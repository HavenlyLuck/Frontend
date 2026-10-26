import {
  createInventoryReceipt, deleteInventoryReceipt, getInventoryItem, getInventoryItemForProduct, getInventoryItems, updateInventoryReceipt,
  type CreateInventoryReceiptPayload, type InventoryAllocationResponse,
  type InventoryItemDetailResponse, type InventoryItemResponse, type InventoryLinkType, type InventoryReceiptResponse,
  type UpdateInventoryReceiptPayload,
} from './api'

/*
 * 관리자 재고 관리 — 떼 온 물건(품목)과 입고 기록, 그리고 그 물건이 어느 상품에 얼마나 걸려 있는지.
 *
 * 수량은 세 칸으로 나뉜다 (재고는 "등록하면 묶이고, 팔리면 빠진다"):
 *   재고      — 아직 아무 상품에도 안 올린 것 (API 필드명은 available)
 *   판매 중   — 응모·쿠지·상점 상품에 걸려 있는 것 (응모 취소·쿠지 판매 종료·상점 수량 줄이기 시 재고로 돌아옴)
 *   판매 완료 — 팔려서 나간 것
 * 판매 중 · 판매 완료는 서버가 연결된 상품의 지금 상태에서 계산한다. 평균 원가 = 입고 단가의 수량 가중 평균.
 */

export type { InventoryItemResponse as InventoryItem, InventoryItemDetailResponse as InventoryItemDetail }

export function fetchInventoryItems(token: string): Promise<InventoryItemResponse[]> {
  return getInventoryItems(token)
}

export function fetchInventoryItem(token: string, itemId: number): Promise<InventoryItemDetailResponse> {
  return getInventoryItem(token, itemId)
}

export async function addInventoryReceipt(token: string, payload: CreateInventoryReceiptPayload): Promise<void> {
  await createInventoryReceipt(token, payload)
}

export async function editInventoryReceipt(token: string, receiptId: number, patch: UpdateInventoryReceiptPayload): Promise<void> {
  await updateInventoryReceipt(token, receiptId, patch)
}

// 입고가 하나도 안 남고 어디에도 안 쓴 품목이면 서버가 품목도 지운다
export async function removeInventoryReceipt(token: string, receiptId: number): Promise<void> {
  await deleteInventoryReceipt(token, receiptId)
}

// 상품에 연결된 재고 품목 (상점 수량 조정 화면에서 남은 재고를 보여주려고) — 연결이 없으면 null
export function fetchInventoryItemForProduct(token: string, productType: InventoryLinkType, productId: number) {
  return getInventoryItemForProduct(token, productType, productId)
}

// 입고 단가의 수량 가중 평균
export function averageCost(receipts: Pick<InventoryReceiptResponse, 'quantity' | 'unit_cost'>[]): number {
  const qty = receipts.reduce((n, r) => n + r.quantity, 0)
  return qty > 0 ? Math.round(receipts.reduce((n, r) => n + r.quantity * r.unit_cost, 0) / qty) : 0
}

export const PRODUCT_TYPE_LABEL: Record<InventoryAllocationResponse['product_type'], string> = {
  raffle: '응모',
  kuji: '쿠지',
  store: '상점',
}
