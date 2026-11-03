'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowsClockwiseIcon, ConfettiIcon, TicketIcon, WarningIcon } from '@phosphor-icons/react'
import { ApiError, getRaffleProduct, type StoreFundingStatus, type StoreProductResponse } from '@/lib/api'
import { getValidSession, loginPath } from '@/lib/auth'
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
  const [qty, setQty] = useState(1)
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
  const leftMs = funding.ends_at ? parseServerTime(funding.ends_at) - now : null
  // 전환 후 모금 응모권을 취소해서 생긴 구매 제한 (한국 시간으로 표시)
  const bannedUntil = funding.banned_until && parseServerTime(funding.banned_until) > now ? new Date(parseServerTime(funding.banned_until)) : null
  const bannedText = bannedUntil
    ? `${bannedUntil.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}까지 전환 응모권을 살 수 없어요`
    : null

  const changeQty = (delta: number) => setQty(prev => Math.min(maxQty, Math.max(1, prev + delta)))

  const openModal = () => {
    setQty(1)
    setError(null)
    setDone(null)
    setOpen(true)
  }
  const closeModal = () => {
    if (paying) return
    setOpen(false)
  }

  const confirm = async () => {
    if (paying) return
    const session = await getValidSession()
    if (!session) {
      router.replace(loginPath())
      return
    }
    setPaying(true)
    setError(null)
    try {
      const res = await payWithCard(session.token, {
        order_type: 'store_funding',
        target_id: product.store_product_id,
        quantity: qty,
      })
      if (res.status !== 'paid' || !res.raffle_entry) {
        setError(res.status === 'conflict' ? '응모권을 살 수 없습니다.' : paymentFailureMessage(res))
        return
      }
      const entry = res.raffle_entry
      // 이번 구매로 1/3을 넘었으면 응모 상품으로 전환되어 있다
      const raffle = await getRaffleProduct(entry.raffle_product_id).catch(() => null)
      setDone({
        tickets: entry.ticket_count,
        entryNumber: entry.entry_number,
        convertedRaffleId: raffle && raffle.status !== 'funding' ? raffle.raffle_product_id : null,
      })
      setQty(1)
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
          응모권({funding.ticket_price.toLocaleString()}원)이 {funding.total_slots}장 중 {funding.threshold}장 모이면
          이 상품이 응모 상품으로 바뀌어요.{' '}
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
          {!funding.available ? '지금은 전환할 수 없어요' : started ? '응모권 사고 전환 참여하기' : '응모 전환 시작하기'}
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
                : '전환되면 산 응모권 그대로 응모돼요. 기간 안에 못 모이면 자동 환불돼요.'}
            </div>
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
              카드로 결제합니다.
            </div>

            <div className="ticket-count">
              <div className="ticket-label">응모권 수</div>
              <div className="ticket-selector">
                <button className="ticket-btn" onClick={() => changeQty(-1)} disabled={paying || qty <= 1} aria-label="응모권 줄이기">
                  −
                </button>
                <div className="ticket-num">{qty}</div>
                <button className="ticket-btn" onClick={() => changeQty(1)} disabled={paying || qty >= maxQty} aria-label="응모권 늘리기">
                  +
                </button>
              </div>
              <div className="ticket-info">
                <span>{needed > 0 ? `전환까지 ${needed}장` : `남은 응모권 ${maxQty}장`}</span>
                <span className="total">총 {(funding.ticket_price * qty).toLocaleString()}원</span>
              </div>
            </div>

            <div className="modal-notice">
              <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                응모권은 이 상품의 응모권이 돼요. 전환되면 그대로 응모되고, 기간 안에 1/3이 모이지 않거나 전환 후 매진되지
                않으면 카드 결제가 전액 자동 취소돼요. 응모권은 언제든 마이페이지 응모 내역에서 취소할 수 있지만,{' '}
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
              <button className="btn-confirm" onClick={confirm} disabled={paying}>
                {paying ? '처리 중...' : '결제하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
