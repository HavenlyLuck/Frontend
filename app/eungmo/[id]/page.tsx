"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  ConfettiIcon,
  FlameIcon,
  HeartIcon,
  TicketIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import {
  ApiError,
  enterRaffleWithFreeTickets,
  getMyFreeTickets,
  getRaffleProducts,
  type RaffleProductResponse,
  type RaffleEntryCreateResponse,
} from "@/lib/api";
import { getValidSession, isLoggedIn, loginPath } from "@/lib/auth";
import { payWithCard, paymentFailureMessage } from "@/lib/payment";
import RefundNotice from "@/components/RefundNotice";
import { notifyPointsUpdated } from "@/hooks/useMyPoints";
import { addRaffleToWishlist, getMyRaffleWishlist, removeRaffleFromWishlist } from "@/lib/wishlist";

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
      router.replace(loginPath());
    }
  }, [router]);

  const [product, setProduct] = useState<
    RaffleProductResponse | null | undefined
  >(undefined);
  const [ticketCount, setTicketCount] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchaseResult, setPurchaseResult] =
    useState<RaffleEntryCreateResponse | null>(null);
  const [tearing, setTearing] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // 보관함 쌀 응모권(이벤트 · 추천인 보상) — 있으면 결제 대신 쓸 수 있다
  const [freeTicketCount, setFreeTicketCount] = useState(0);
  const [payMode, setPayMode] = useState<"card" | "free">("card");

  useEffect(() => {
    getRaffleProducts()
      .then((list) => {
        const found =
          list.find((rp) => rp.raffle_product_id === raffleId) ?? null;
        setProduct(found);
        if (found) {
          setRemaining(found.remaining_seconds);
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


  // 찜 상태 — 서버에 저장된 내 찜 목록에 이 응모가 있는지
  const [isLiked, setIsLiked] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getValidSession()
      .then((session) => (session ? getMyRaffleWishlist(session.token) : []))
      .then((list) => {
        if (!cancelled) setIsLiked(list.some((p) => p.raffle_product_id === raffleId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [raffleId]);

  const toggleWish = async () => {
    if (wishBusy) return;
    const session = await getValidSession();
    if (!session) {
      router.push(loginPath());
      return;
    }
    const next = !isLiked;
    setIsLiked(next);
    setWishBusy(true);
    try {
      if (next) await addRaffleToWishlist(session.token, raffleId);
      else await removeRaffleFromWishlist(session.token, raffleId);
    } catch {
      setIsLiked(!next);
    } finally {
      setWishBusy(false);
    }
  };

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

  const soldCount = product.sold_slots;
  const maxPurchasable = Math.max(0, product.total_slots - soldCount);
  const soldOut = maxPurchasable === 0;
  // 마감 시간이 지났거나 백엔드가 닫힌 응모로 보는 경우 — 매진이 아니어도 구매를 막는다
  // (안 막으면 모달까지 열고 눌러봐야 "마감된 응모입니다"로 거절당함)
  const expired = remaining <= 0 || !product.is_open;
  const soldPct =
    product.total_slots > 0
      ? Math.min(100, Math.round((soldCount / product.total_slots) * 100))
      : 0;

  const useFree = payMode === "free" && freeTicketCount > 0;
  // 무료 응모권으로 낼 때는 가진 장수까지만
  const maxTickets = useFree ? Math.min(maxPurchasable, freeTicketCount) : maxPurchasable;

  const changeTicket = (delta: number) =>
    setTicketCount((prev) =>
      Math.min(Math.max(maxTickets, 1), Math.max(1, prev + delta)),
    );

  const changePayMode = (mode: "card" | "free") => {
    setPayMode(mode);
    setTicketCount(1);
    setSubmitError(null);
  };

  const openModal = () => {
    setSubmitError(null);
    setTicketCount(1);
    setTearing(false);
    setPurchaseResult(null);
    setPayMode("card");
    setModalOpen(true);
    // 로그인했으면 보관함 무료 응모권 수를 확인해 결제 방식 선택지를 보여준다
    getValidSession().then((session) => {
      if (!session) return;
      getMyFreeTickets(session.token)
        .then((list) => {
          setFreeTicketCount(list.length);
          if (list.length > 0) setPayMode("free");
        })
        .catch(() => setFreeTicketCount(0));
    });
  };

  // 응모권 카드와 성공 카드는 같은 배경(.modal-overlay) 하나를 공유한다.
  // 상태 초기화는 배경 페이드아웃(0.25s)이 끝난 뒤에 해야 닫히는 도중 내용이 바뀌지 않는다.
  function closeTicketFlow() {
    setModalOpen(false);
    setTimeout(() => {
      setPurchaseResult(null);
      setTearing(false);
    }, 260);
  }

  const submitRaffle = async () => {
    const session = await getValidSession();
    if (!session) {
      alert("로그인 후 이용해주세요.");
      router.replace(loginPath());
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      let entry: RaffleEntryCreateResponse;
      if (useFree) {
        // 보관함 무료 응모권 사용 — 결제 없이 바로 응모된다
        try {
          entry = await enterRaffleWithFreeTickets(session.token, product.raffle_product_id, ticketCount);
        } catch (err) {
          setSubmitError(err instanceof ApiError ? err.message : "응모권을 사용하지 못했어요.");
          return;
        }
        setFreeTicketCount((n) => Math.max(0, n - ticketCount));
      } else {
        // 카드 결제 → 서버가 결제를 확인하고 응모권을 발급한다
        const paid = await payWithCard(session.token, {
          order_type: "raffle_entry",
          target_id: product.raffle_product_id,
          quantity: ticketCount,
        });
        if (paid.status !== "paid" || !paid.raffle_entry) {
          setSubmitError(paid.status === "conflict" ? "응모할 수 없습니다." : paymentFailureMessage(paid));
          return;
        }
        entry = paid.raffle_entry;
      }
      const newSoldSlots = product.sold_slots + entry.ticket_count;
      const justSoldOut = newSoldSlots >= product.total_slots;
      setProduct((prev) =>
        prev ? { ...prev, sold_slots: newSoldSlots } : prev,
      );
      // 응모권이 절취선을 따라 찢어지는 연출(당기다가 → 딱 끊어짐(~0.67s) → 떨어져 나감, CSS 1.05초).
      // 조각이 아직 날아가는 0.8초 시점에 같은 배경 위로 성공 카드를 띄워서, 빈 화면이나
      // 배경 깜빡임 없이 "찢었다 → 응모됐다"가 한 동작처럼 이어지게 한다.
      // tearing 클래스는 모달이 닫힐 때까지 유지 — 먼저 풀면 찢어진 조각이 다시 붙어 보인다.
      setTearing(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setPurchaseResult(entry);
      // 쌀 응모권을 썼거나 첫 구매로 추천 보상을 받았을 수 있으니 상단 장수를 다시 불러온다
      notifyPointsUpdated();
      if (justSoldOut) {
        alert(
          "응모권이 모두 소진되었습니다! 당첨자 추첨 기능은 아직 준비 중이라, 별도 절차 없이 응모가 그대로 진행됩니다.",
        );
      }
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "응모 처리 중 오류가 발생했습니다.",
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
              <button
                className={`wish-heart ${isLiked ? "liked" : ""}`}
                aria-label={isLiked ? "찜 해제" : "찜하기"}
                aria-pressed={isLiked}
                disabled={wishBusy}
                onClick={toggleWish}
              >
                <HeartIcon size={20} weight={isLiked ? "fill" : "regular"} />
              </button>
            </div>
          </div>

          <div className="info-panel">
            <div className="status-row">
              <span className="badge raffle">
                <TicketIcon size={12} weight="fill" />{" "}
                {product.status === "completed"
                  ? "추첨 완료"
                  : soldOut
                    ? "추첨 대기"
                    : expired
                      ? "응모 마감"
                      : "응모 진행 중"}
              </span>
              {urgent && !soldOut && (
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
                    {product.ticket_price.toLocaleString()}
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginLeft: 3 }}>원</span>
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

            {product.status === "completed" && product.winner_entry_number != null && (
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

            {product.drand_round != null && (
              <details style={{ marginBottom: 12, fontSize: 12, color: "var(--text-secondary)" }}>
                <summary style={{ cursor: "pointer" }}>
                  공정성 검증 · drand 라운드 #{product.drand_round}
                </summary>
                <div style={{ marginTop: 6, lineHeight: 1.6, wordBreak: "break-all" }}>
                  {product.drand_randomness ? (
                    <>
                      <div>난수: <code>{product.drand_randomness}</code></div>
                      <div>
                        당첨 칸 = 난수(16진수 정수) mod 전체 응모권 수. 응모 번호 오름차순으로 응모권
                        수만큼 칸을 이어 붙였을 때 그 칸의 주인이 당첨돼요.
                      </div>
                    </>
                  ) : (
                    <div>매진 순간 정해진 라운드예요. 이 라운드의 난수가 나오면 그 값으로 추첨해요.</div>
                  )}
                  <a
                    href={`https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971/public/${product.drand_round}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "underline" }}
                  >
                    drand에서 직접 확인하기
                  </a>
                </div>
              </details>
            )}

            <div className="cta-row">
              <button
                className="btn-raffle"
                onClick={openModal}
                disabled={soldOut || expired}
              >
                <TicketIcon size={17} weight="fill" />{" "}
                {soldOut ? "매진" : expired ? "마감" : "응모하기"}
              </button>
            </div>

            <RefundNotice kind="raffle" />
          </div>
        </div>
      </div>

      {/* 응모 모달 — 응모권 카드와 성공 카드가 이 배경 하나를 공유한다.
          결제 처리 중이거나 찢기 연출 중(성공 카드가 뜨기 전)엔 배경 클릭으로 닫히지 않게 막는다.
          (안 막으면 모달이 먼저 사라졌다가 결제 완료 후 성공 카드가 혼자 튀어나옴) */}
      <div
        className={`modal-overlay ${modalOpen ? "open" : ""}`}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          if (submitting) return;
          if (tearing && !purchaseResult) return;
          closeTicketFlow();
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

            {freeTicketCount > 0 && (
              <div className="pay-mode-toggle" role="radiogroup" aria-label="응모 방법">
                <button
                  type="button"
                  role="radio"
                  aria-checked={payMode === "free"}
                  className={payMode === "free" ? "active" : ""}
                  onClick={() => changePayMode("free")}
                  disabled={submitting}
                >
                  쌀 응모권 <b>{freeTicketCount}장</b>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={payMode === "card"}
                  className={payMode === "card" ? "active" : ""}
                  onClick={() => changePayMode("card")}
                  disabled={submitting}
                >
                  카드 결제
                </button>
              </div>
            )}

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
                  {useFree
                    ? `쌀 응모권 최대 ${maxTickets.toLocaleString()}장 사용 가능`
                    : `최대 ${maxPurchasable.toLocaleString()}장까지 구매 가능`}
                </span>
                <span className="total">
                  {useFree
                    ? `응모권 ${ticketCount}장 사용 · 0원`
                    : `총 ${(ticketCount * product.ticket_price).toLocaleString()}원`}
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
                매진 전에는 마이페이지 응모 내역에서 취소할 수 있어요.{" "}
                <b>매진되어 추첨이 시작되면 취소·환불할 수 없어요.</b> 기간 안에
                응모권이 다 팔리지 않으면 결제 금액이 카드로 자동 환불돼요.{" "}
                <a href="/refund#응모" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                  취소·환불 정책
                </a>
              </span>
            </div>

            {submitError && (
              <div className="modal-notice" style={{ color: "var(--danger)" }}>
                <WarningIcon
                  size={13}
                  weight="fill"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <span style={{ whiteSpace: "pre-line" }}>{submitError}</span>
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
              disabled={submitting || soldOut || expired}
            >
              <TicketIcon size={15} weight="fill" />{" "}
              {submitting
                ? useFree ? "응모 중..." : "결제 중..."
                : useFree ? "응모권 사용하기" : "결제하기"}
            </button>
            </div>
          </div>
        </div>

        {/* 구매 완료 — 찢어진 조각이 날아가는 동안 같은 배경 위로 겹쳐서 떠오른다 */}
        {purchaseResult && (
          <div className="modal success-modal" role="dialog" aria-modal="true" aria-label="응모 완료">
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
                onClick={closeTicketFlow}
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
