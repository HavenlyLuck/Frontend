import {
  cancelRaffleProduct, closeKujiSet, updateStoreProductStock,
  type KujiSetAdminResponse, type RaffleProductResponse, type StoreProductResponse,
} from './api'
import { adjustInventoryForProduct } from './inventory'

/*
 * 관리자 상품 판매 종료 · 수량 조정 — 남은 물건은 재고로 돌아간다.
 *
 *   응모 취소     : 매진 전에만. 산 사람 전원 전액 환불(카드 결제 취소) + 물건 1개 재고로
 *   쿠지 판매 종료: 이미 뽑힌 제비는 그대로, 아직 안 뽑힌 상품·라스트원상은 재고로
 *   상점 수량 조정: 줄이면 줄인 만큼 재고로, 늘리면 재고에서 더 가져옴 (0 = 판매 종료)
 *
 * TODO(backend): 세 API(POST /raffles/{id}/cancel, POST /kuji/{id}/close, PATCH /store-products/{id})가
 *   생기면 USE_MOCK을 false로. 재고 되돌리기·환불은 서버가 같은 트랜잭션에서 처리해야 한다.
 *   그때까지는 화면에서만 흉내 낸다(새로고침하면 서버 상태로 돌아감).
 */
const USE_MOCK = true

// 화면에서만 흉내 내는 중인지 — 관리자가 실제로 취소·환불된 줄 알면 안 되니까 결과 안내에 쓴다
export const PRODUCT_ACTIONS_MOCK = USE_MOCK

export async function cancelRaffle(token: string, raffle: RaffleProductResponse): Promise<RaffleProductResponse> {
  if (!USE_MOCK) return cancelRaffleProduct(token, raffle.raffle_product_id)
  await new Promise(resolve => setTimeout(resolve, 300))
  adjustInventoryForProduct('raffle', raffle.raffle_product_id)
  return { ...raffle, status: 'cancelled', is_open: false }
}

export async function closeKuji(token: string, kuji: KujiSetAdminResponse): Promise<KujiSetAdminResponse> {
  if (!USE_MOCK) return closeKujiSet(token, kuji.kuji_set_id)
  await new Promise(resolve => setTimeout(resolve, 300))
  adjustInventoryForProduct('kuji', kuji.kuji_set_id)
  return { ...kuji, status: 'closed' }
}

export async function setStoreStock(token: string, product: StoreProductResponse, stock: number): Promise<StoreProductResponse> {
  if (!USE_MOCK) return updateStoreProductStock(token, product.store_product_id, stock)
  await new Promise(resolve => setTimeout(resolve, 300))
  adjustInventoryForProduct('store', product.store_product_id, stock - product.stock)
  return { ...product, stock }
}
