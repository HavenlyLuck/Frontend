import Link from 'next/link'
import { TicketIcon } from '@phosphor-icons/react'
import type { RaffleProductResponse } from '@/lib/api'
import CardImage from '@/components/CardImage'
import { isSoldOutRaffle } from '@/lib/raffle'

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '마감'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (d === 0) return `${pad(h)}:${pad(m)}:${pad(s)} 남음`
  return `${d}일 ${pad(h)}:${pad(m)}:${pad(s)} 남음`
}

// 응모 상품 카드 (응모 목록 · 검색 결과). secondsLeft는 부모가 1초마다 다시 계산해 넘긴다.
export default function RaffleCard({ product: p, secondsLeft }: { product: RaffleProductResponse; secondsLeft: number }) {
  const soldOut = isSoldOutRaffle(p)
  const content = (
    <>
      <div className="card-img">
        {p.image_url && <CardImage src={p.image_url} alt={p.product_name} />}
        {soldOut
          ? <div className="card-soldout-stamp"><span>매진</span></div>
          : <div className="card-time-badge">⏱ {formatCountdown(secondsLeft)}</div>}
      </div>
      <div className="card-body">
        <div className="card-raffle-badge"><TicketIcon size={11} weight="fill" /> {p.status === 'completed' ? '추첨 완료' : soldOut ? '추첨 대기' : '응모 진행 중'}</div>
        <div className="card-title">{p.product_name}</div>
        <div className="card-price"><span className="nowrap">{p.ticket_price.toLocaleString()} 운포인트</span> <span className="card-price-unit">/ 장당</span></div>
        <div className="card-progress-row">
          <div className="card-progress-bar">
            <div
              className="card-progress-fill"
              style={{ width: `${p.total_slots > 0 ? Math.min(100, Math.round((p.sold_slots / p.total_slots) * 100)) : 0}%` }}
            />
          </div>
        </div>
        <div className="card-progress-label">
          <span>{p.remaining_slots.toLocaleString()}장 남음</span>
          <span>총 {p.total_slots.toLocaleString()}장</span>
        </div>
      </div>
    </>
  )
  // 매진되면 상세 페이지로 못 들어가게 링크 자체를 없앤다
  return soldOut ? (
    <div className="product-card-home is-soldout" aria-disabled="true">{content}</div>
  ) : (
    <Link className="product-card-home" href={`/eungmo/${p.raffle_product_id}`}>{content}</Link>
  )
}
