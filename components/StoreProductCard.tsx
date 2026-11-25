import Link from 'next/link'
import { CreditCardIcon, GrainsIcon } from '@phosphor-icons/react'
import type { StoreCategory, StorePayType, StoreProductResponse } from '@/lib/api'
import CardImage from './CardImage'
import { isRegular, isSoldOut } from '@/lib/storeStock'

// 상점 이름 — cash: 카드 결제 상점, ssal: 쌀포인트 상점
export const STORE_LABEL: Record<StorePayType, string> = { cash: '일반', ssal: '쌀포인트' }

// 가격 표기 — 결제 상품은 "5,000원", 쌀포인트 상품은 "5,000 쌀포인트", 쌀 응모권(쿠폰)은 "5,000p"
export function formatStorePrice(type: StorePayType, amount: number, category?: StoreCategory | null): string {
  if (type === 'cash') return `${amount.toLocaleString()}원`
  return category === 'coupon' ? `${amount.toLocaleString()}p` : `${amount.toLocaleString()} 쌀포인트`
}

export function PayTypeIcon({ type, size }: { type: StorePayType; size: number }) {
  return type === 'cash' ? <CreditCardIcon size={size} weight="fill" /> : <GrainsIcon size={size} weight="fill" />
}

// 상점 상품 카드 (상점 목록 · 홈) — 품절이어도 상세는 볼 수 있게 링크 유지
export default function StoreProductCard({ product: p }: { product: StoreProductResponse }) {
  const soldOut = isSoldOut(p)
  const regular = isRegular(p)
  const label = STORE_LABEL[p.pay_type]
  return (
    <Link className="product-card-home is-shop" href={`/shop/${p.store_product_id}`}>
      <div className={`card-img${soldOut ? ' is-dimmed' : ''}`}>
        {p.image_url ? (
          <CardImage src={p.image_url} alt={p.product_name} />
        ) : (
          <span style={{ display: 'flex', color: 'var(--text-tertiary)' }}><PayTypeIcon type={p.pay_type} size={44} /></span>
        )}
        {soldOut && <div className="card-soldout-stamp"><span>품절</span></div>}
      </div>
      <div className="card-body">
        <div className="card-raffle-badge"><PayTypeIcon type={p.pay_type} size={11} /> {label} 상점</div>
        <div className="card-title" style={soldOut ? { color: 'var(--text-tertiary)' } : undefined}>{p.product_name}</div>
        <div className="card-price store-price-row" style={soldOut ? { color: 'var(--text-tertiary)' } : undefined}>
          <span className="nowrap">{formatStorePrice(p.pay_type, p.price, p.category)}</span>
          {/* 한정 상품만 — 마지막 1개일 때 알린다 (일반 상품은 개수를 보여주지 않는다) */}
          {!regular && p.stock === 1 && (
            <span className="store-stock-badge">
              재고 {p.stock}개 남음
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
