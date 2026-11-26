'use client'

import Link from 'next/link'
import { GiftIcon } from '@phosphor-icons/react'
import CardImage from '@/components/CardImage'
import type { KujiListItem } from '@/lib/kujiList'

// 쿠지 카드 (홈 · 쿠지 목록 · 검색 결과) — 로그인 안 해도 상세까지 구경할 수 있다 (뽑기 버튼에서 가입을 권함)
export default function KujiCard({ item }: { item: KujiListItem }) {
  // 매진돼도 무슨 상품이었는지 볼 수 있게 상세로는 들어간다 (상세에서 뽑기 버튼만 막힘)
  return (
    <Link className={`product-card-home${item.soldOut ? ' is-soldout' : ''}`} href={item.href}>
      <div className="card-img">
        <CardImage src={item.img} alt={item.alt} />
        {item.soldOut && <div className="card-soldout-stamp"><span>SOLD OUT</span></div>}
      </div>
      <div className="card-body">
        <div className="card-raffle-badge"><GiftIcon size={11} weight="fill" /> {item.badge}</div>
        <div className="card-title">{item.title}</div>
        {/* 응모 카드처럼 "10,000원"과 "/ 1장"이 각각 한 덩어리로 줄바꿈되게 — 좁은 카드에서 "장"만 떨어지지 않도록 */}
        <div className="card-price"><span className="nowrap">{item.price}</span> <span className="card-price-unit">/ 1장</span></div>
        <div className="card-progress-row">
          <div className="card-progress-bar">
            <div className="card-progress-fill" style={{ width: `${item.pct}%` }} />
          </div>
          <span className="card-progress-pct">{item.pct}%</span>
        </div>
        <div className="card-progress-label">
          <span>총 {item.max}장 중 <span className="cnt">{item.count}장</span> 소진</span>
        </div>
      </div>
    </Link>
  )
}
