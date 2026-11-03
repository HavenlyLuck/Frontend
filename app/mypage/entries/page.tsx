"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TicketIcon, CalendarIcon, CheckCircleIcon, GrainsIcon, WarningIcon } from "@phosphor-icons/react";
import {
  useRaffleEntryPhases,
  type PhasedRaffleEntry,
} from "@/hooks/useRaffleEntryPhases";
import {
  fundingLockedTicketCount,
  isOngoingPhase,
  isWinningEntry,
} from "@/lib/raffle";
import { formatRelativeDate } from "@/lib/date";
import LightningDrawScene from "@/components/LightningDrawScene";
import Pagination from "@/components/Pagination";
import { prefetchDrawCast } from "@/lib/raffleCast";
import { normalizeAvatar } from "@/lib/avatar/compose";
import { ApiError, cancelMyRaffleEntries, type RaffleCastMember } from "@/lib/api";
import { getValidSession } from "@/lib/auth";
import type { SceneEntrant } from "@/lib/lightningDraw/scene";

// 매진 후 추첨까지 남은 시간 — 0이 됐는데 아직 결과가 없으면(폴링 전) 기다림 문구로 바뀐다
function DrawCountdown({ drawAt }: { drawAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (drawAt == null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [drawAt]);

  const left =
    drawAt == null ? 0 : Math.max(0, Math.ceil((drawAt - now) / 1000));
  if (left === 0)
    return (
      <span style={{ color: "var(--gold)" }}>
        응모 마감 · 추첨 결과를 불러오는 중이에요
      </span>
    );
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  return (
    <span style={{ color: "var(--gold)" }}>
      응모 마감 · 추첨까지{" "}
      <b className="draw-countdown">
        {mm}:{ss}
      </b>
    </span>
  );
}

type PastFilter = "all" | "won" | "lost" | "failed";
const PAST_FILTERS: { id: PastFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "won", label: "당첨" },
  { id: "lost", label: "낙첨" },
  { id: "failed", label: "응모실패" },
];
const PAST_PAGE_SIZE = 10;
const PAST_EMPTY: Record<PastFilter, string> = {
  all: "아직 종료된 응모가 없어요.",
  won: "아직 당첨된 응모가 없어요.",
  lost: "낙첨된 응모가 없어요.",
  failed: "응모실패한 응모가 없어요.",
};

// 취소할 장수 한 칸 이동 — 상점에서 전환된 응모는 "전환 후에 산 장수까지" 또는 "전부"만 고를 수 있다
function stepCancelQty(item: PhasedRaffleEntry, q: number, delta: number): number {
  const total = item.totalTicketCount;
  const free = total - fundingLockedTicketCount(item); // 제재 없이 취소할 수 있는 장수 (전환 후에 산 것)
  if (fundingLockedTicketCount(item) === 0) return Math.min(total, Math.max(1, q + delta));
  if (delta > 0) return q >= free ? total : q + 1;
  if (q === total) return free > 0 ? free : total;
  return Math.max(1, q - 1);
}

// 취소 미리보기 — 서버와 같은 순서(최근 응모부터)로 count장을 취소했을 때 카드 환불 금액과 보관함으로 돌아갈 무료 응모권 수
function cancelPreview(item: PhasedRaffleEntry, count: number): { refund: number; returned: number } {
  const parts = [...item.parts].sort((a, b) =>
    a.createdAt === b.createdAt ? b.entryId - a.entryId : a.createdAt < b.createdAt ? 1 : -1,
  );
  let left = count;
  let refund = 0;
  let returned = 0;
  for (const p of parts) {
    if (left <= 0) break;
    const take = Math.min(p.ticketCount, left);
    left -= take;
    if (p.amountPaid === 0) returned += take; // 무료 응모권 응모
    else refund += Math.round((p.amountPaid / p.ticketCount) * take);
  }
  return { refund, returned };
}

export default function RaffleEntriesPage() {
  const { items, entries, checkResult, reload } = useRaffleEntryPhases();
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  // 응모 취소 팝업 — 확인 → (취소 요청) → 완료까지 사이트 공통 모달(.modal-overlay) 하나로 이어진다
  const [cancelTarget, setCancelTarget] = useState<PhasedRaffleEntry | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelDone, setCancelDone] = useState<{ tickets: number; remaining: number; returned: number; refunded: boolean } | null>(null);
  // 취소할 응모권 장수 — 기본은 전부
  const [cancelQty, setCancelQty] = useState(1);

  function openCancel(item: PhasedRaffleEntry) {
    if (cancelingId != null) return;
    setCancelTarget(item);
    // 전환 후 모금 응모권까지 취소하면 제재가 있으므로, 전환 후에 산 응모권이 있으면 그 장수를 기본으로 둔다
    const locked = fundingLockedTicketCount(item);
    setCancelQty(locked > 0 && item.totalTicketCount > locked ? item.totalTicketCount - locked : item.totalTicketCount);
    setCancelError(null);
    setCancelDone(null);
  }

  function closeCancel() {
    if (cancelingId != null) return; // 취소 요청 중에는 닫지 않는다
    setCancelTarget(null);
  }

  // 매진 전 응모만 취소할 수 있다 — 이 상품에 산 응모권 전부를 취소하고 카드 결제를 환불한다
  async function confirmCancel() {
    const item = cancelTarget;
    if (!item || cancelingId != null) return;
    const session = await getValidSession();
    if (!session) {
      setCancelError("로그인이 만료되었어요. 다시 로그인해 주세요.");
      return;
    }
    setCancelingId(item.raffle_product_id);
    setCancelError(null);
    try {
      const res = await cancelMyRaffleEntries(session.token, item.raffle_product_id, cancelQty);
      setCancelDone({ tickets: res.cancelled_tickets, remaining: res.remaining_tickets, returned: res.returned_free_tickets, refunded: res.refunded });
      await reload();
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "취소 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
      await reload();
    } finally {
      setCancelingId(null);
    }
  }
  const [resultItem, setResultItem] = useState<PhasedRaffleEntry | null>(null);
  // 번개 연출이 끝나야 결과 문구가 이어서 나온다
  const [revealed, setRevealed] = useState(false);
  // 결과 연출에 세울 실제 응모자들 — 대기 1분 동안 미리 받아 두었으면 바로, 아니면 받는 즉시 시작
  const [cast, setCast] = useState<RaffleCastMember[] | null>(null);
  const [castFailed, setCastFailed] = useState(false);
  const isWin = resultItem != null && isWinningEntry(resultItem);

  useEffect(() => {
    if (!resultItem) return;
    let cancelled = false;
    setCast(null);
    setCastFailed(false);
    prefetchDrawCast(resultItem.raffle_product_id)
      .then((list) => { if (!cancelled) setCast(list); })
      .catch(() => { if (!cancelled) setCastFailed(true); });
    return () => { cancelled = true; };
  }, [resultItem]);

  // 꾸민 적 없는 사람(avatar_config 없음)은 null로 두면 장면에서 임시 아바타로 그린다
  const entrants = useMemo<SceneEntrant[] | undefined>(
    () =>
      cast?.map((c) => ({
        entryNumber: c.entry_number,
        avatar: c.avatar_config?.v === 2 ? normalizeAvatar(c.avatar_config) : null,
        ticketCount: c.ticket_count,
        nickname: c.nickname,
      })),
    [cast],
  );

  const ongoing = items.filter((e) => isOngoingPhase(e.phase));
  const past = items.filter((e) => !isOngoingPhase(e.phase));
  // 참여했던 응모 — 결과별로 나눠 보기
  const [pastFilter, setPastFilter] = useState<PastFilter>("all");
  const pastCounts: Record<PastFilter, number> = {
    all: past.length,
    won: past.filter((e) => e.phase === "won").length,
    lost: past.filter((e) => e.phase === "lost").length,
    failed: past.filter((e) => e.phase === "failed").length,
  };
  const filteredPast =
    pastFilter === "all" ? past : past.filter((e) => e.phase === pastFilter);
  const [pastPage, setPastPage] = useState(1);
  const pastPageCount = Math.max(1, Math.ceil(filteredPast.length / PAST_PAGE_SIZE));
  const currentPastPage = Math.min(pastPage, pastPageCount);
  const pagedPast = filteredPast.slice(
    (currentPastPage - 1) * PAST_PAGE_SIZE,
    currentPastPage * PAST_PAGE_SIZE,
  );
  const participationCount = entries.filter(
    (e) => e.status !== "cancelled",
  ).length;

  // 결과를 여는 순간 "확인함"으로 기록 → 모달을 닫으면 참여했던 응모로 내려가 있다
  function openResult(item: PhasedRaffleEntry) {
    setRevealed(false);
    setResultItem(item);
    checkResult(item.raffle_product_id);
  }

  return (
    <>
      <div className="mypage-section-header">
        <div className="mypage-section-title">
          <TicketIcon size={17} weight="fill" color="var(--accent)" /> 응모 내역
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <div
          className="summary-card"
          style={{ flex: 1, textAlign: "center", cursor: "default" }}
        >
          <div className="summary-value">
            {participationCount}
            <span>회</span>
          </div>
          <div className="summary-label">총 참여 횟수</div>
        </div>
        <div
          className="summary-card"
          style={{ flex: 1, textAlign: "center", cursor: "default" }}
        >
          <div className="summary-value" style={{ color: "var(--gold)" }}>
            {ongoing.length}
            <span>건</span>
          </div>
          <div className="summary-label">진행중인 응모</div>
        </div>
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 14px",
        }}
      >
        참여 중인 응모 ({ongoing.length})
      </div>
      {ongoing.length === 0 ? (
        <div className="coming-soon-box" style={{ marginBottom: 32 }}>
          <div className="desc">참여 중인 응모가 없어요.</div>
        </div>
      ) : (
        <div className="entry-list" style={{ marginBottom: 32 }}>
          {ongoing.map((item) => {
            const body = (
              <>
                <div className="entry-emoji">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name} />
                  ) : (
                    "🎟"
                  )}
                </div>
                <div className="entry-info">
                  <div className="entry-title">{item.product_name}</div>
                  <div className="entry-meta">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <TicketIcon size={12} /> 총 {item.totalTicketCount}장 응모
                    </span>
                    {item.phase === "drawPending" ? (
                      <DrawCountdown drawAt={item.drawAt} />
                    ) : item.phase === "resultReady" ? (
                      <span style={{ color: "var(--gold)" }}>
                        추첨이 끝났어요
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <CalendarIcon size={12} /> 최근{" "}
                        {formatRelativeDate(item.lastEnteredAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="entry-status">
                  {item.phase === "resultReady" ? (
                    <button
                      className="btn-win-confirm"
                      onClick={() => openResult(item)}
                    >
                      당첨결과 확인하기
                    </button>
                  ) : item.phase === "drawPending" ? (
                    <span className="status-badge ongoing">추첨 대기 중</span>
                  ) : (
                    <>
                      <span className="status-badge waiting">
                        {item.status === "funding" ? "전환 모금 중" : "대기 중"}
                      </span>
                      <button
                        type="button"
                        className="entry-cancel-btn"
                        disabled={cancelingId === item.raffle_product_id}
                        onClick={(e) => {
                          // 카드 전체가 상세 페이지 링크라서 이동을 막는다
                          e.preventDefault();
                          e.stopPropagation();
                          openCancel(item);
                        }}
                      >
                        {cancelingId === item.raffle_product_id ? "취소 중..." : "응모 취소"}
                      </button>
                    </>
                  )}
                </div>
              </>
            );
            // 응모권이 남아 있을 때만 상세 페이지로 이동 (매진 이후엔 상세 진입을 막는다)
            return item.phase === "waiting" ? (
              <Link
                key={item.raffle_product_id}
                href={
                  // 응모 전환 모금 중이면 아직 응모 목록에 없으므로 상점 상세에서 현황을 보여준다
                  item.status === "funding" && item.fundingStoreProductId != null
                    ? `/shop/${item.fundingStoreProductId}`
                    : `/eungmo/${item.raffle_product_id}`
                }
                className="entry-item"
              >
                {body}
              </Link>
            ) : (
              <div
                key={item.raffle_product_id}
                className="entry-item"
                style={{ cursor: "default" }}
              >
                {body}
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 14px",
        }}
      >
        참여했던 응모 ({past.length})
      </div>
      <div className="entry-filter-tabs" role="tablist" aria-label="참여했던 응모 결과별 보기">
        {PAST_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={pastFilter === f.id}
            className={`entry-filter-tab${pastFilter === f.id ? " active" : ""}`}
            onClick={() => {
              setPastFilter(f.id);
              setPastPage(1);
            }}
          >
            {f.label} <span>{pastCounts[f.id]}</span>
          </button>
        ))}
      </div>
      {filteredPast.length === 0 ? (
        <div className="coming-soon-box">
          <div className="desc">{PAST_EMPTY[pastFilter]}</div>
        </div>
      ) : (
        <div className="entry-list">
          {pagedPast.map((item) => (
            <div
              key={item.raffle_product_id}
              className="entry-item"
              style={{ cursor: "default" }}
            >
              <div
                className="entry-emoji"
                style={
                  item.phase === "won"
                    ? undefined
                    : { filter: "grayscale(1)", opacity: 0.7 }
                }
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} />
                ) : (
                  "🎟"
                )}
              </div>
              <div className="entry-info">
                <div
                  className="entry-title"
                  style={
                    item.phase === "won"
                      ? undefined
                      : { color: "var(--text-tertiary)" }
                  }
                >
                  {item.product_name}
                </div>
                <div className="entry-meta">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <TicketIcon size={12} /> 총 {item.totalTicketCount}장 응모
                  </span>
                  {item.phase === "failed" ? (
                    <span>시간 내에 응모권이 다 팔리지 않았어요</span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <CalendarIcon size={12} /> 최근{" "}
                      {formatRelativeDate(item.lastEnteredAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="entry-status">
                {item.phase === "won" ? (
                  <span className="status-badge win">당첨</span>
                ) : item.phase === "lost" ? (
                  <span className="status-badge lose">낙첨</span>
                ) : (
                  <span className="status-badge lose">응모실패</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={currentPastPage} pageCount={pastPageCount} onChange={setPastPage} label="참여했던 응모 페이지" />

      <div
        className={`win-overlay ${resultItem ? "open" : ""}`}
        onClick={() => setResultItem(null)}
      >
        {resultItem && resultItem.winnerEntryNumber != null && (
          <div
            className="win-modal has-scene"
            onClick={(e) => e.stopPropagation()}
          >
            {entrants || castFailed ? (
              // 응모자 목록을 못 받았으면 임시 아바타로라도 결과 연출은 보여준다
              <LightningDrawScene
                key={resultItem.raffle_product_id}
                seed={resultItem.raffle_product_id}
                myEntryNumbers={resultItem.entryNumbers}
                winnerEntryNumber={resultItem.winnerEntryNumber}
                entrants={entrants}
                onFinish={() => setRevealed(true)}
              />
            ) : (
              <div className="draw-scene draw-scene-loading">응모자들을 공원에 모으는 중...</div>
            )}
            {revealed && (
              <div className="win-reveal">
                <div
                  className="win-title"
                  style={!isWin ? { color: "var(--text-tertiary)" } : undefined}
                >
                  {isWin ? "당첨을 축하드려요!" : "아쉽게도 낙첨되었어요"}
                </div>
                <div className="win-product">
                  {resultItem.product_name}
                  <br />내 응모번호 #{resultItem.entryNumbers.join(", #")} ·
                  당첨번호 #{resultItem.winnerEntryNumber}
                </div>
                {!isWin && resultItem.totalAmountPaid > 0 && (
                  // 낙첨 보상 — 서버가 추첨과 동시에 돈 내고 산 응모권만큼(= 결제 금액) 쌀포인트를 지급해 두었다. 무료 응모권은 제외
                  <div className="consolation-card">
                    <div className="consolation-icon">
                      <GrainsIcon size={22} weight="fill" />
                    </div>
                    <div className="consolation-body">
                      <div className="consolation-label">쌀포인트 환급 완료</div>
                      <div className="consolation-amount">
                        +{resultItem.totalAmountPaid.toLocaleString()}P
                      </div>
                      <div className="consolation-desc">
                        응모권 {resultItem.parts.filter((p) => p.amountPaid > 0).reduce((n, p) => n + p.ticketCount, 0)}장만큼 돌려드렸어요. 쌀포인트 상점에서 사용할 수 있어요.
                      </div>
                    </div>
                  </div>
                )}
                {!isWin && resultItem.totalAmountPaid > 0 && (
                  <Link
                    className="win-close"
                    href="/mypage/points"
                    style={{
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      marginBottom: 8,
                    }}
                  >
                    쌀포인트 내역 보기 →
                  </Link>
                )}
                {isWin && (
                  <Link
                    className="win-close"
                    href="/mypage/storage"
                    style={{
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      marginBottom: 8,
                    }}
                  >
                    보관함에서 확인하기 →
                  </Link>
                )}
                <button
                  className="win-close"
                  onClick={() => setResultItem(null)}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 응모 취소 팝업 */}
      <div
        className={`modal-overlay ${cancelTarget ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeCancel();
        }}
      >
        {cancelTarget && (cancelDone ? (
          <div className="modal success-modal" role="dialog" aria-modal="true" aria-label="응모 취소 완료" style={{ margin: "0 16px" }}>
            <div className="modal-icon">
              <CheckCircleIcon size={28} weight="fill" color="var(--accent)" />
            </div>
            <div className="modal-title">응모가 취소되었어요</div>
            <div className="modal-sub">
              {cancelTarget.product_name}
              <br />
              응모권 <strong style={{ color: "var(--text)" }}>{cancelDone.tickets}장</strong>이 취소되었어요.
              {cancelDone.remaining > 0 && <> 남은 응모권 {cancelDone.remaining}장으로 계속 응모 중이에요.</>}
              <br />
              {cancelDone.returned > 0 && <>무료 응모권 {cancelDone.returned}장은 보관함으로 돌아갔어요.<br /></>}
              {cancelDone.tickets > cancelDone.returned &&
                (cancelDone.refunded
                  ? "카드 결제가 취소되었어요. 카드사에 따라 환불 반영까지 며칠 걸릴 수 있어요."
                  : "카드 결제 취소는 잠시 뒤 자동으로 처리돼요.")}
            </div>
            <div className="modal-btn-row">
              <button className="btn-confirm" autoFocus onClick={closeCancel}>
                확인
              </button>
            </div>
          </div>
        ) : (
          <div className="modal" role="dialog" aria-modal="true" aria-label="응모 취소 확인" style={{ margin: "0 16px" }}>
            <div className="modal-icon">
              <TicketIcon size={28} weight="fill" color="var(--accent)" />
            </div>
            <div className="modal-title">응모를 취소할까요?</div>
            <div className="modal-sub">
              {cancelTarget.product_name}
              <br />
              지금 응모권 {cancelTarget.totalTicketCount}장을 갖고 있어요.
              {fundingLockedTicketCount(cancelTarget) > 0 && (
                <>
                  <br />
                  그중 {fundingLockedTicketCount(cancelTarget)}장은 응모 상품으로 전환되기 전에 산 응모권이에요.
                </>
              )}
            </div>

            <div className="ticket-count">
              <div className="ticket-label">취소할 응모권</div>
              <div className="ticket-selector">
                <button
                  className="ticket-btn"
                  onClick={() => setCancelQty((q) => stepCancelQty(cancelTarget, q, -1))}
                  disabled={cancelingId != null || stepCancelQty(cancelTarget, cancelQty, -1) === cancelQty}
                  aria-label="취소할 장수 줄이기"
                >
                  −
                </button>
                <div className="ticket-num">{cancelQty}</div>
                <button
                  className="ticket-btn"
                  onClick={() => setCancelQty((q) => stepCancelQty(cancelTarget, q, 1))}
                  disabled={cancelingId != null || stepCancelQty(cancelTarget, cancelQty, 1) === cancelQty}
                  aria-label="취소할 장수 늘리기"
                >
                  +
                </button>
              </div>
              <div className="ticket-info">
                <span>
                  {cancelQty === cancelTarget.totalTicketCount ? "전부 취소" : `취소 후 ${cancelTarget.totalTicketCount - cancelQty}장 남음`}
                </span>
                <span className="total">
                  {(() => {
                    const { refund, returned } = cancelPreview(cancelTarget, cancelQty);
                    return [refund > 0 || returned === 0 ? `환불 ${refund.toLocaleString()}원` : null, returned > 0 ? `응모권 ${returned}장 반환` : null]
                      .filter(Boolean)
                      .join(" + ");
                  })()}
                </span>
              </div>
            </div>

            <div className="modal-notice">
              <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                {cancelQty === cancelTarget.totalTicketCount
                  ? "이 상품에 산 응모권이 모두 취소되고 응모에서 빠져요."
                  : "최근에 산 응모권부터 취소되고, 남은 응모권으로 계속 응모돼요."}{" "}
                카드 결제는 취소한 만큼 환불되고(반영까지 며칠 걸릴 수 있어요), 무료 응모권으로 응모한 장수는 보관함으로 돌아가요.
              </span>
            </div>

            {/* 전환 후 모금 응모권까지 취소하면 — 전부 함께 취소되고 3일 동안 전환 응모권 구매 제한 */}
            {fundingLockedTicketCount(cancelTarget) > 0 &&
              cancelQty > cancelTarget.totalTicketCount - fundingLockedTicketCount(cancelTarget) && (
                <div className="modal-notice" role="alert">
                  <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>
                    전환 전에 산 응모권 {fundingLockedTicketCount(cancelTarget)}장도 함께 취소돼요.{" "}
                    <b>취소하면 3일 동안 상점 상품의 응모 전환 응모권을 살 수 없어요.</b>
                  </span>
                </div>
              )}

            {cancelError && (
              <div className="modal-notice" role="alert">
                <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span style={{ whiteSpace: "pre-line" }}>{cancelError}</span>
              </div>
            )}

            <div className="modal-btn-row">
              <button className="btn-cancel" onClick={closeCancel} disabled={cancelingId != null}>
                닫기
              </button>
              <button className="btn-confirm" onClick={confirmCancel} disabled={cancelingId != null}>
                {cancelingId != null ? "취소 중..." : "응모 취소하기"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
