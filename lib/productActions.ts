import {
  cancelRaffleProduct, closeKujiSet, updateStoreProductStock,
  type KujiSetAdminResponse, type RaffleProductResponse, type StoreProductResponse,
} from './api'

/*
 * 관리자 상품 판매 종료 · 수량 조정 — 남은 물건은 서버가 재고로 되돌린다.
 *
 *   응모 취소     : 매진 전에만. 산 사람 전원 전액 환불(카드 결제 취소) + 물건 1개 재고로
 *   쿠지 판매 종료: 이미 뽑힌 제비는 그대로, 아직 안 뽑힌 상품·라스트원상은 재고로
 *   상점 수량 조정: 줄이면 줄인 만큼 재고로, 늘리면 재고에서 더 가져옴 (0 = 판매 종료)
 */

export function cancelRaffle(token: string, raffle: RaffleProductResponse): Promise<RaffleProductResponse> {
  return cancelRaffleProduct(token, raffle.raffle_product_id)
}

export function closeKuji(token: string, kuji: KujiSetAdminResponse): Promise<KujiSetAdminResponse> {
  return closeKujiSet(token, kuji.kuji_set_id)
}

export function setStoreStock(token: string, product: StoreProductResponse, stock: number): Promise<StoreProductResponse> {
  return updateStoreProductStock(token, product.store_product_id, stock)
}
