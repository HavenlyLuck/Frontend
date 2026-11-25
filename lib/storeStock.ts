// 상점 판매 방식 (2026-11-25 결정) — 결제 상점 · 쌀포인트 상점 모두
// - 한정(limited): 올린 개수만큼 팔고, 남은 개수를 보여주고, 다 팔리면 매진
// - 일반(regular): 개수 없이 계속 판다. 남은 개수도 보여주지 않는다 (모자라면 운영자가 떼 와서 보낸다)
// 서버가 sale_mode를 아직 보내지 않으면 모든 상품을 한정으로 본다 (지금과 똑같이 보임 — 서버보다 먼저 배포돼도 안전)
import type { StoreProductResponse } from './api'

// 일반 상품 한 번에 고를 수 있는 최대 수량 (실수로 너무 많이 누르지 않게)
export const REGULAR_MAX_PER_ORDER = 99

type ProductLike = Pick<StoreProductResponse, 'stock'> & { sale_mode?: StoreProductResponse['sale_mode'] }

export function isRegular(p: ProductLike): boolean {
  return p.sale_mode === 'regular'
}
// 매진 — 한정 상품만 매진된다
export function isSoldOut(p: ProductLike): boolean {
  return !isRegular(p) && p.stock <= 0
}
// 한 번에 고를 수 있는 최대 수량
export function maxOrderQty(p: ProductLike): number {
  return isRegular(p) ? REGULAR_MAX_PER_ORDER : p.stock
}
