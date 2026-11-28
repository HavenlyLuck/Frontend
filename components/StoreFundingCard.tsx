'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowsClockwiseIcon, ConfettiIcon, TicketIcon, WarningIcon } from '@phosphor-icons/react'
import {
  ApiError,
  enterRaffleWithFreeTickets,
  fundStoreWithFreeTickets,
  getRaffleProduct,
  type RaffleEntryCreateResponse,
  type StoreFundingStatus,
  type StoreProductResponse,
} from '@/lib/api'
import { notifyPointsUpdated, useMyPoints } from '@/hooks/useMyPoints'
import { getValidSession, isLoggedIn, loginPath, promptSignup } from '@/lib/auth'
import { payWithCard, paymentFailureMessage, PaymentWindowError } from '@/lib/payment'
import { parseServerTime } from '@/lib/raffle'

// 남은 시간 — "2일 3시간", "5시간 12분", "8분"
function formatLeft(ms: number): string {
  const min = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d > 0) return `${d}일 ${h}시간`
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

interface Props {
  product: StoreProductResponse
  funding: StoreFundingStatus
  // 응모권을 산 뒤 상점 재고·모금 현황을 다시 불러온다
  onChanged: () => void
}

// 상점 상품 → 응모 상품 전환 모금
// 응모권을 사서 전체 응모권의 1/3이 모이면 이 상품(재고 1개)이 응모 상품으로 바뀐다.
// 기간 안에 못 모이면 산 응모권은 전부 자동 환불된다.
export default function StoreFundingCard({ product, funding, onChanged }: Props) {
  const router = useRouter()
  const [now, setNow] = useState(() => Date.now())
  const [open, setOpen] = useState(false)
  // 카드로 살 장수와 보관함 쌀 응모권으로 낼 장수 — 응모 페이지처럼 둘을 섞어 한 번에 참여할 수 있다
  const [cardCount, setCardCount] = useState(1)
  const [ssalCount, setSsalCount] = useState(0)
  const { ssalTicket } = useMyPoints()
  // 카드는 결제됐지만 쌀 응모권을 못 썼을 때 완료 카드에 함께 보여 줄 안내
  const [partialNote, setPartialNote] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 결제 완료 — 산 장수, 응모 번호, 이번 구매로 응모 상품으로 전환됐으면 그 응모 id
  const [done, setDone] = useState<{ tickets: number; entryNumber: number; convertedRaffleId: number | null } | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const started = funding.raffle_product_id != null
  const percent = Math.min(100, Math.floor((funding.sold_slots / funding.threshold) * 100))
  const needed = Math.max(0, funding.threshold - funding.sold_slots)
  const maxQty = Math.max(1, funding.total_slots - funding.sold_slots)
  const totalCount = cardCount + ssalCount
  const maxSsal = Math.min(ssalTicket, Math.max(0, maxQty - cardCount))
  const maxCard = Math.max(0, maxQty - ssalCount)
  const leftMs = funding.ends_at ? parseServerTime(funding.ends_at) - now : null
  // 전환 후 모금 응모권을 취소해서 생긴 구매 제한 (한국 시간으로 표시)
  const bannedUntil = funding.banned_until && parseServerTime(funding.banned_until) > now ? new Date(parseServerTime(funding.banned_until)) : null
  const bannedText = bannedUntil
    ? `${bannedUntil.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}까지 전환 응모권을 살 수 없어요`
    : null

  const changeCard = (delta: number) => {
    setError(null)
    setCardCount(prev => Math.min(maxCard, Math.max(0, prev + delta)))
  }
  const changeSsal = (delta: number) => {
    setError(null)
    setSsalCount(prev => Math.min(maxSsal, Math.max(0, prev + delta)))
  }

  const openModal = () => {
    // 구경은 누구나 — 응모 전환에 참여하려고 할 때만 가입을 권한다
    if (!isLoggedIn()) {
      promptSignup()
      return
    }
    // 쌀 응모권이 있으면 1장을 쌀 응모권으로 시작한다
    setCardCount(ssalTicket > 0 ? 0 : 1)
    setSsalCount(ssalTicket > 0 ? 1 : 0)
    setError(null)
    setPartialNote(null)
    setDone(null)
    setOpen(true)
  }
  const closeModal = () => {
    if (paying) return
    setOpen(false)
  }

  const confirm = async () => {
    if (paying || totalCount < 1) return
    const session = await getValidSession()
    if (!session) {
      router.replace(loginPath())
      return
    }
    setPaying(true)
    setError(null)
    try {
      // 카드 결제를 먼저 한다 — 결제창을 닫거나 실패하면 쌀 응모권은 쓰지 않은 채로 끝난다
      let entry: RaffleEntryCreateResponse | null = null
      let added = 0
      if (cardCount > 0) {
        const res = await payWithCard(session.token, {
          order_type: 'store_funding',
          target_id: product.store_product_id,
          quantity: cardCount,
        })
        if (res.status !== 'paid' || !res.raffle_entry) {
          setError(res.status === 'conflict' ? '응모권을 살 수 없습니다.' : paymentFailureMessage(res))
          return
        }
        entry = res.raffle_entry
        added += cardCount
      }
      // 이어서 쌀 응모권 — 카드로 먼저 냈으면 그 응모(카드 결제로 이미 전환됐어도 같은 응모)에,
      // 쌀 응모권만 내면 상점 상품의 모금에 넣는다 (모금이 없으면 새로 열린다)
      if (ssalCount > 0) {
        try {
          entry = entry
            ? await enterRaffleWithFreeTickets(session.token, entry.raffle_product_id, ssalCount)
            : await fundStoreWithFreeTickets(session.token, product.store_product_id, ssalCount)
          added += ssalCount
        } catch (err) {
          const reason = err instanceof ApiError ? err.message : '쌀 응모권을 사용하지 못했어요.'
          if (!entry) {
            setError(reason)
            return
          }
          setPartialNote(`카드 결제 ${cardCount}장은 참여됐지만, 쌀 응모권 ${ssalCount}장은 사용하지 못했어요. (${reason})`)
        }
        notifyPointsUpdated()
      }
      if (!entry) return
      // 이번 참여로 1/3을 넘었으면 응모 상품으로 전환되어 있다
      const raffle = await getRaffleProduct(entry.raffle_product_id).catch(() => null)
      setDone({
        tickets: added,
        entryNumber: entry.entry_number,
        convertedRaffleId: raffle && raffle.status !== 'funding' ? raffle.raffle_product_id : null,
      })
      onChanged()
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof PaymentWindowError ? err.message : '결제 처리 중 오류가 발생했습니다.',
      )
    } finally {
      setPaying(false)
    }
  }

  return (
    <>
      <div className="funding-card">
        <div className="funding-head">
          <span className="funding-title">
            <ArrowsClockwiseIcon size={15} weight="bold" /> 응모 상품으로 전환
          </span>
          {leftMs != null && (
            <span className="funding-left">{leftMs > 0 ? `${formatLeft(leftMs)} 남음` : '마감'}</span>
          )}
        </div>
        <div className="funding-desc">
          응모권({funding.ticket_price.toLocaleString()}원)이 {funding.threshold}장 모이면 이 상품이 응모에 올라가요
          (응모권은 모두 {funding.total_slots}장).{' '}
          {started ? '기간' : `시작 후 ${funding.duration_days}일`} 안에 못 모이면 전액 자동 환불돼요.
        </div>

        <div className="funding-progress-row">
          <div
            className="funding-progress-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="응모 상품 전환률"
          >
            <div className="funding-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="funding-progress-pct">{percent}%</span>
        </div>
        <div className="funding-progress-label">
          <span>
            <TicketIcon size={12} /> {funding.sold_slots} / {funding.threshold}장
          </span>
          <span>{started ? `전환까지 ${needed}장` : '아직 아무도 시작하지 않았어요'}</span>
        </div>

        <button className="funding-btn" onClick={openModal} disabled={!funding.available || bannedUntil != null}>
          {!funding.available
            ? funding.unavailable_reason ?? '지금은 전환할 수 없어요'
            : started
              ? '응모권 사고 전환 참여하기'
              : '응모 전환 시작하기'}
        </button>
        {bannedText && (
          <div className="funding-banned" role="note">
            <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>응모 상품으로 전환된 뒤 응모권을 취소해서 {bannedText}.</span>
          </div>
        )}
      </div>

      {/* 응모권 구매 팝업 — 확인 → (결제) → 완료까지 같은 배경 위에서 이어진다. 결제 중에는 닫히지 않는다 */}
      <div
        className={`modal-overlay ${open ? 'open' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) closeModal()
        }}
      >
        {done ? (
          <div className="modal success-modal" role="dialog" aria-modal="true" aria-label="응모권 구매 완료" style={{ margin: '0 16px' }}>
            <div className="modal-icon celebrate">
              <ConfettiIcon size={28} weight="fill" color="var(--gold)" />
            </div>
            <div className="modal-title">
              {done.convertedRaffleId != null ? '응모 상품으로 전환됐어요!' : '전환 모금에 참여했어요'}
            </div>
            <div className="modal-sub">
              응모 번호 {done.entryNumber}번 · 응모권 {done.tickets}장
              <br />
              {done.convertedRaffleId != null
                ? '이제 응모 페이지에서 다른 사람들과 함께 추첨을 기다려요.'
                : '전환되면 낸 응모권 그대로 응모돼요. 기간 안에 못 모이면 자동 환불돼요.'}
            </div>
            {partialNote && (
              <div className="modal-notice" style={{ textAlign: 'left' }}>
                <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{partialNote}</span>
              </div>
            )}
            <div className="modal-btn-row">
              <button className="btn-cancel" onClick={closeModal}>
                닫기
              </button>
              {done.convertedRaffleId != null ? (
                <Link className="btn-confirm" style={{ textDecoration: 'none' }} href={`/eungmo/${done.convertedRaffleId}`}>
                  응모 페이지로 가기
                </Link>
              ) : (
                <Link className="btn-confirm" style={{ textDecoration: 'none' }} href="/mypage/entries">
                  응모 내역 보기
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="modal" role="dialog" aria-modal="true" aria-label="응모 전환 응모권 구매" style={{ margin: '0 16px' }}>
            <div className="modal-icon">
              <TicketIcon size={28} weight="fill" color="var(--accent)" />
            </div>
            <div className="modal-title">응모 전환 응모권</div>
            <div className="modal-sub">
              {product.product_name}
              <br />
              카드 결제와 보관함 쌀 응모권을 함께 쓸 수 있어요.
            </div>

            <div className="ticket-count">
              <div className="ticket-split-row">
                <div className="ticket-split-label">
                  <b>쌀 응모권</b>
                  <span>보유 {ssalTicket.toLocaleString()}장 · 무료</span>
                </div>
                <div className="ticket-selector ticket-selector-sm">
                  <button className="ticket-btn" onClick={() => changeSsal(-1)} disabled={paying || ssalCount <= 0} aria-label="쌀 응모권 한 장 빼기">−</button>
                  <div className="ticket-num">{ssalCount}</div>
                  <button className="ticket-btn" onClick={() => changeSsal(1)} disabled={paying || ssalCount >= maxSsal} aria-label="쌀 응모권 한 장 더하기">+</button>
                </div>
              </div>
              <div className="ticket-split-row">
                <div className="ticket-split-label">
                  <b>카드 결제</b>
                  <span>1장 {funding.ticket_price.toLocaleString()}원</span>
                </div>
                <div className="ticket-selector ticket-selector-sm">
                  <button className="ticket-btn" onClick={() => changeCard(-1)} disabled={paying || cardCount <= 0} aria-label="카드 결제 한 장 빼기">−</button>
                  <div className="ticket-num">{cardCount}</div>
                  <button className="ticket-btn" onClick={() => changeCard(1)} disabled={paying || cardCount >= maxCard} aria-label="카드 결제 한 장 더하기">+</button>
                </div>
              </div>
              <div className="ticket-info">
                <span>{needed > 0 ? `전환까지 ${needed}장` : `남은 응모권 ${maxQty}장`}</span>
              </div>
              <div className="ticket-summary">
                <div>
                  <span>총 응모권</span>
                  <b>{totalCount.toLocaleString()}장</b>
                </div>
                <div>
                  <span>결제 금액</span>
                  <b>{(funding.ticket_price * cardCount).toLocaleString()}원</b>
                </div>
              </div>
              {ssalCount > 0 && (
                <div className="ticket-summary-note">쌀 응모권으로 낸 {ssalCount}장은 낙첨돼도 쌀포인트가 적립되지 않아요.</div>
              )}
            </div>

            <div className="modal-notice">
              <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                응모권은 이 상품의 응모권이 돼요. 전환되면 그대로 응모되고, 기간 안에 1/3이 모이지 않거나 전환 후 매진되지
                않으면 카드 결제는 전액 자동 취소되고 쌀 응모권은 보관함으로 돌아가요. 응모권은 언제든 마이페이지 응모 내역에서 취소할 수 있지만,{' '}
                <b>응모 상품으로 전환된 뒤에 취소하면 이 응모권은 전부 함께 취소되고, 3일 동안 전환 응모권을 살 수 없어요.</b>
              </span>
            </div>

            {error && (
              <div className="modal-notice" role="alert">
                <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
              </div>
            )}

            <div className="modal-btn-row">
              <button className="btn-cancel" onClick={closeModal} disabled={paying}>
                취소
              </button>
              <button className="btn-confirm" onClick={confirm} disabled={paying || totalCount < 1}>
                {paying
                  ? '처리 중...'
                  : cardCount > 0
                    ? `${(funding.ticket_price * cardCount).toLocaleString()}원 결제하기`
                    : '쌀 응모권으로 참여하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
