import Link from 'next/link'
import { CreditCardIcon, GrainsIcon } from '@phosphor-icons/react'
import type { StorePayType, StoreProductResponse } from '@/lib/api'
import CardImage from './CardImage'

// 상점 이름 — cash: 카드 결제 상점, ssal: 쌀포인트 상점
export const STORE_LABEL: Record<StorePayType, string> = { cash: '일반', ssal: '쌀포인트' }

// 가격 표기 — 결제 상품은 "5,000원", 쌀포인트 상품은 "5,000 쌀포인트"
export function formatStorePrice(type: StorePayType, amount: number): string {
  return type === 'cash' ? `${amount.toLocaleString()}원` : `${amount.toLocaleString()} 쌀포인트`
}

export function PayTypeIcon({ type, size }: { type: StorePayType; size: number }) {
  return type === 'cash' ? <CreditCardIcon size={size} weight="fill" /> : <GrainsIcon size={size} weight="fill" />
}

// 상점 상품 카드 (상점 목록 · 홈) — 품절이어도 상세는 볼 수 있게 링크 유지
export default function StoreProductCard({ product: p }: { product: StoreProductResponse }) {
  const soldOut = p.stock === 0
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
        <div className="card-price" style={{ color: soldOut ? 'var(--text-tertiary)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span>{formatStorePrice(p.pay_type, p.price)}</span>
          {p.stock > 0 && p.stock <= 3 && (
            <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0 }}>
              재고 {p.stock}개 남음
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
