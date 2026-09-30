"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  ChatCircleIcon,
  ClockIcon,
  ConfettiIcon,
  EyeIcon,
  FlameIcon,
  HeartIcon,
  PaletteIcon,
  TicketIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  ApiError,
  createRaffleEntry,
  getMyRaffleEntriesForProduct,
  getRaffleProducts,
  type RaffleProductResponse,
  type RaffleEntryCreateResponse,
} from "@/lib/api";
import { isWished, toggleWishlist } from "@/lib/wishlist";
import { getValidSession, isLoggedIn } from "@/lib/auth";
import { notifyPointsUpdated } from "@/hooks/useMyPoints";
import { getMarbleColor } from "@/lib/roulette/marbleColor";

const MAX_COLOR_LEGEND_ENTRIES = 50;

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "마감";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d === 0) return `${pad(h)}:${pad(m)}:${pad(s)} 남음`;
  return `${d}일 ${pad(h)}:${pad(m)}:${pad(s)} 남음`;
}

export default function RaffleProductPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const raffleId = Number(params.id);

  useEffect(() => {
    if (!isLoggedIn()) {
      alert("로그인 후 이용해주세요.");
      router.replace("/login");
    }
  }, [router]);

  const [product, setProduct] = useState<
    RaffleProductResponse | null | undefined
  >(undefined);
  const [ticketCount, setTicketCount] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [colorInfoOpen, setColorInfoOpen] = useState(false);
  const [purchaseResult, setPurchaseResult] =
    useState<RaffleEntryCreateResponse | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [tearing, setTearing] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [myEntryNumber, setMyEntryNumber] = useState<number | null>(null);

  useEffect(() => {
    getRaffleProducts()
      .then((list) => {
        const found =
          list.find((rp) => rp.raffle_product_id === raffleId) ?? null;
        setProduct(found);
        if (found) {
          setRemaining(found.remaining_seconds);
          setIsLiked(isWished(`raffle-${found.raffle_product_id}`));
        }
      })
      .catch(() => setProduct(null));
  }, [raffleId]);

  useEffect(() => {
    if (!product) return;
    const timer = setInterval(
      () => setRemaining((prev) => Math.max(0, prev - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [product]);

  useEffect(() => {
    if (!product || !isLoggedIn()) return;
    getValidSession()
      .then((session) => {
        if (!session) return;
        return getMyRaffleEntriesForProduct(
          session.token,
          product.raffle_product_id,
        );
      })
      .then((entries) => {
        if (entries && entries.length > 0)
          setMyEntryNumber(entries[0].entry_number);
      })
      .catch(() => {});
  }, [product]);

  // 성공 모달은 처음부터 열린 채로 마운트하지 않고, 마운트 다음 프레임에 open
  // 클래스를 붙여서 .modal-overlay의 기존 트랜지션(opacity/scale)이 실제로 재생되게 한다.
  // (Rules of Hooks 때문에 이 useEffect는 아래 조건부 return들보다 반드시 위에 있어야 한다.)
  useEffect(() => {
    if (!purchaseResult) return;
    const id = requestAnimationFrame(() => setResultOpen(true));
    return () => cancelAnimationFrame(id);
  }, [purchaseResult]);

  if (product === undefined) {
    return (
      <div className="home-container">
        <div className="coming-soon-box large">
          <div className="emoji">
            <TicketIcon size={32} weight="light" />
          </div>
          <div className="title">불러오는 중이에요</div>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="home-container">
        <div className="coming-soon-box large">
          <div className="emoji">
            <TicketIcon size={32} weight="light" />
          </div>
          <div className="title">응모 상품을 찾을 수 없어요</div>
          <div className="desc">마감되었거나 존재하지 않는 상품이에요</div>
        </div>
      </div>
    );
  }

  const urgent = remaining > 0 && remaining < 3600;
  const wishId = `raffle-${product.raffle_product_id}`;

  const soldCount = product.sold_slots;
  const maxPurchasable = Math.max(0, product.total_slots - soldCount);
  const soldOut = maxPurchasable === 0;
  const soldPct =
    product.total_slots > 0
      ? Math.min(100, Math.round((soldCount / product.total_slots) * 100))
      : 0;

  const changeTicket = (delta: number) =>
    setTicketCount((prev) =>
      Math.min(Math.max(maxPurchasable, 1), Math.max(1, prev + delta)),
    );

  const openModal = () => {
    setSubmitError(null);
    setTicketCount(1);
    setModalOpen(true);
  };

  function closeResultModal() {
    setResultOpen(false);
    setTimeout(() => setPurchaseResult(null), 250); // .modal-overlay transition 길이와 맞춤
  }

  const submitRaffle = async () => {
    const session = await getValidSession();
    if (!session) {
      alert("로그인 후 이용해주세요.");
      router.replace("/login");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const entry = await createRaffleEntry(
        session.token,
        product.raffle_product_id,
        ticketCount,
      );
      const newSoldSlots = product.sold_slots + entry.ticket_count;
      const justSoldOut = newSoldSlots >= product.total_slots;
      setProduct((prev) =>
        prev ? { ...prev, sold_slots: newSoldSlots } : prev,
      );
      // 응모권이 절취선을 따라 찢어지는 연출(당기다가 → 딱 끊어짐 → 떨어져 나감,
      // 1.05초)을 다 보여준 다음 결과 모달로 넘어간다
      setTearing(true);
      await new Promise((resolve) => setTimeout(resolve, 1300));
      setTearing(false);
      notifyPointsUpdated();
      setModalOpen(false);
      setPurchaseResult(entry);
      setMyEntryNumber(entry.entry_number);
      if (justSoldOut) {
        alert(
          "응모권이 모두 소진되었습니다! 당첨자 추첨 기능은 아직 준비 중이라, 별도 절차 없이 응모가 그대로 진행됩니다.",
        );
      }
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.message : "응모 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="container">
        <div className="breadcrumb">
          <span>
            <Link href="/">홈</Link>
          </span>
          <span>
            <Link href="/eungmo">응모</Link>
          </span>
          <span>{product.product_name}</span>
        </div>

        <div className="product-layout">
          <div className="image-area">
            <div className="main-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.product_name} />
              ) : (
                <div className="image-placeholder">
                  <TicketIcon size={72} weight="thin" />
                </div>
              )}
            </div>
            <button
              onClick={() => setColorInfoOpen(true)}
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "7px 12px",
                background: "var(--bg-subtle)",
                cursor: "pointer",
              }}
            >
              <PaletteIcon size={14} weight="fill" color="var(--accent)" />{" "}
              당첨번호 구슬 색
            </button>
          </div>

          <div className="info-panel">
            <div className="status-row">
              <span className="badge raffle">
                <TicketIcon size={12} weight="fill" /> 응모 진행 중
              </span>
              {urgent && (
                <span className="badge urgent">
                  <FlameIcon size={12} weight="fill" /> 마감 임박
                </span>
              )}
            </div>

            <div className="product-title">{product.product_name}</div>
            <div className="price-sub">
              응모 마감 후 추첨으로 1명에게 판매됩니다
            </div>

            <div className="divider" />

            {product.description && (
              <div className="description">{product.description}</div>
            )}

            <div className="raffle-section">
              <div className="raffle-header">
                <div className="raffle-title">
                  <TicketIcon size={16} weight="fill" /> 응모 현황
                </div>
                <div
                  className={`raffle-countdown ${urgent ? "urgent-cd" : ""}`}
                >
                  {urgent ? (
                    <FlameIcon size={14} weight="fill" />
                  ) : (
                    <ClockIcon size={14} weight="bold" />
                  )}
                  {formatCountdown(remaining)}
                </div>
              </div>

              <div className="progress-wrap">
                <div className="progress-label">
                  <span>응모권 판매 현황</span>
                  <span>총 {product.total_slots.toLocaleString()}장</span>
                </div>
                <div className="progress-bar-row">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ transform: `scaleX(${soldPct / 100})` }}
                    />
                  </div>
                  <span className="progress-pct">{soldPct}%</span>
                </div>
              </div>

              <div
                className="raffle-stats"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <div className="stat-item">
                  <div className="stat-value">
                    {product.ticket_price.toLocaleString()}원
                  </div>
                  <div className="stat-label">응모권 가격</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {maxPurchasable.toLocaleString()}장
                  </div>
                  <div className="stat-label">
                    남은 응모권 (총 {product.total_slots.toLocaleString()}장)
                  </div>
                </div>
              </div>
            </div>

            {product.status === "completed" && product.draw_video_url && (
              <div
                style={{
                  marginBottom: 12,
                  fontSize: 13,
                  color: "var(--gold)",
                  fontWeight: 700,
                }}
              >
                🎉 당첨 응모 번호: #{product.winner_entry_number}
              </div>
            )}

            <div className="cta-row">
              {product.status === "completed" && product.draw_video_url ? (
                <a
                  href={product.draw_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-raffle"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ConfettiIcon size={17} weight="fill" /> 당첨 확인하기
                </a>
              ) : (
                <button
                  className="btn-raffle"
                  onClick={openModal}
                  disabled={soldOut}
                >
                  <TicketIcon size={17} weight="fill" />{" "}
                  {soldOut ? "매진" : "응모하기"}
                </button>
              )}
              <button
                className={`btn-wish ${isLiked ? "liked" : ""}`}
                onClick={() =>
                  setIsLiked(
                    toggleWishlist({
                      id: wishId,
                      href: `/eungmo/${product.raffle_product_id}`,
                      title: product.product_name,
                      image: product.image_url,
                      subtitle: `${product.ticket_price.toLocaleString()} 운포인트 / 장당`,
                    }),
                  )
                }
              >
                <HeartIcon
                  size={19}
                  weight={isLiked ? "fill" : "regular"}
                  color={isLiked ? "var(--danger)" : "var(--text-tertiary)"}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 응모 모달 */}
      <div
        className={`modal-overlay ${modalOpen ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div className={`modal ticket-modal${tearing ? " tearing" : ""}`}>
          <div className="ticket-modal-top">
            <div className="modal-icon">
              <TicketIcon size={28} weight="fill" color="var(--accent)" />
            </div>
            <div className="modal-title">응모권 선택</div>
            <div className="modal-sub">
              {product.product_name}
              <br />
              응모권 1장당{" "}
              <strong style={{ color: "var(--text)" }}>
                {product.ticket_price.toLocaleString()}원
              </strong>
              이며 추첨일에 당첨자를 발표합니다.
            </div>

            <div className="ticket-count">
              <div className="ticket-label">응모권 수량</div>
              <div className="ticket-selector">
                <button className="ticket-btn" onClick={() => changeTicket(-1)}>
                  −
                </button>
                <div className="ticket-num">{ticketCount}</div>
                <button className="ticket-btn" onClick={() => changeTicket(1)}>
                  +
                </button>
              </div>
              <div className="ticket-info">
                <span>
                  최대 {maxPurchasable.toLocaleString()}장까지 구매 가능
                </span>
                <span className="total">
                  총 {(ticketCount * product.ticket_price).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          <div className="ticket-modal-bottom">
            <div className="modal-notice">
              <WarningIcon
                size={13}
                weight="fill"
                style={{ flexShrink: 0, marginTop: "2px" }}
              />
              <span>
                응모권 구매 후 취소 및 환불이 불가합니다. 추첨 결과는 마감일 기준
                24시간 이내에 알림으로 발송됩니다.
              </span>
            </div>

            {submitError && (
              <div className="modal-notice" style={{ color: "var(--danger)" }}>
                <WarningIcon
                  size={13}
                  weight="fill"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <span>{submitError}</span>
              </div>
            )}

            <div className="modal-btn-row">
              <button
                className="btn-cancel"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
              취소
            </button>
            <button
              className="btn-confirm"
              onClick={submitRaffle}
              disabled={submitting || soldOut}
            >
              <TicketIcon size={15} weight="fill" />{" "}
              {submitting ? "처리 중..." : "응모하기"}
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* 구매 완료 결과 */}
      {purchaseResult && (
        <div
          className={`modal-overlay ${resultOpen ? "open" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeResultModal();
          }}
        >
          <div className="modal">
            <div className="modal-icon celebrate">
              <ConfettiIcon size={28} weight="fill" color="var(--gold)" />
            </div>
            <div className="modal-title">응모가 완료되었습니다!</div>
            <div className="modal-sub">
              내 응모 번호
              <br />
              <strong style={{ color: "var(--text)", fontSize: 20 }}>
                #{purchaseResult.entry_number}
              </strong>
            </div>
            <div className="modal-sub">
              이 상품에 지금까지 총{" "}
              <strong style={{ color: "var(--text)" }}>
                {purchaseResult.total_ticket_count}장
              </strong>{" "}
              응모하셨습니다.
            </div>
            <div className="modal-btn-row">
              <button
                className="btn-confirm"
                style={{ width: "100%" }}
                onClick={closeResultModal}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 당첨번호 구슬 색 안내 */}
      {colorInfoOpen && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setColorInfoOpen(false);
          }}
        >
          <div
            className="modal"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <div className="modal-icon" style={{ margin: 0 }}>
                <PaletteIcon size={28} weight="fill" color="var(--accent)" />
              </div>
              <button
                onClick={() => setColorInfoOpen(false)}
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="modal-title">추첨 구슬 색 안내</div>
            <div className="modal-sub">
              추첨 애니메이션에서 내 응모 번호가 어떤 색 구슬인지 미리
              확인해보세요.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
                gap: 10,
                margin: "16px 0",
              }}
            >
              {(() => {
                const base = Array.from(
                  {
                    length: Math.min(
                      product.total_slots,
                      MAX_COLOR_LEGEND_ENTRIES,
                    ),
                  },
                  (_, i) => i + 1,
                );
                if (myEntryNumber !== null && !base.includes(myEntryNumber))
                  base.push(myEntryNumber);
                return base;
              })().map((n) => {
                const isMine = n === myEntryNumber;
                return (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 4px",
                      borderRadius: 10,
                      border: isMine
                        ? "2px solid var(--accent)"
                        : "2px solid transparent",
                      background: isMine ? "var(--bg-subtle)" : "transparent",
                      boxShadow: isMine ? "0 0 10px var(--accent)" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: getMarbleColor(n),
                        boxShadow: `0 0 8px ${getMarbleColor(n)}`,
                        border: "1px solid rgba(255,255,255,0.25)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: isMine ? "var(--gold)" : "var(--text-secondary)",
                        fontWeight: isMine ? 700 : 400,
                      }}
                    >
                      {n}번{isMine ? " (MY)" : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            {product.total_slots > MAX_COLOR_LEGEND_ENTRIES && (
              <div className="modal-notice">
                <WarningIcon
                  size={13}
                  weight="fill"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <span>
                  응모 번호가 {MAX_COLOR_LEGEND_ENTRIES}번을 넘어가면 색이
                  앞번호와 겹칠 수 있어요.
                </span>
              </div>
            )}

            <div className="modal-btn-row">
              <button
                className="btn-confirm"
                style={{ width: "100%" }}
                onClick={() => setColorInfoOpen(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
