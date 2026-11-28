import Link from 'next/link'
import { TicketIcon } from '@phosphor-icons/react'
import type { RaffleProductResponse } from '@/lib/api'
import CardImage from '@/components/CardImage'
import { formatRaffleCountdown, isSoldOutRaffle } from '@/lib/raffle'
import EmojiIcon from '@/components/EmojiIcon'


// 응모 상품 카드 (응모 목록 · 검색 결과). secondsLeft는 부모가 1초마다 다시 계산해 넘긴다.
export default function RaffleCard({ product: p, secondsLeft }: { product: RaffleProductResponse; secondsLeft: number }) {
  const soldOut = isSoldOutRaffle(p)
  const content = (
    <>
      <div className="card-img">
        {p.image_url && <CardImage src={p.image_url} alt={p.product_name} />}
        {soldOut
          ? <div className="card-soldout-stamp"><span>SOLD OUT</span></div>
          : <div className="card-time-badge"><EmojiIcon name="timer" /> {formatRaffleCountdown(secondsLeft)}</div>}
      </div>
      <div className="card-body">
        <div className="card-raffle-badge"><TicketIcon size={11} weight="fill" /> {p.status === 'completed' ? '추첨 완료' : soldOut ? '추첨 대기' : '응모 진행 중'}</div>
        <div className="card-title">{p.product_name}</div>
        <div className="card-price"><span className="nowrap">{p.ticket_price.toLocaleString()}원</span> <span className="card-price-unit">/ 장당</span></div>
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
  // 매진돼도 무슨 상품이었는지 볼 수 있게 상세로는 들어간다 (상세에서 응모 버튼만 막힘)
  return (
    <Link className={`product-card-home${soldOut ? ' is-soldout' : ''}`} href={`/eungmo/${p.raffle_product_id}`}>{content}</Link>
  )
}
