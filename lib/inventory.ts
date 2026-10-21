import {
  createInventoryReceipt, deleteInventoryReceipt, getInventoryItem, getInventoryItems, updateInventoryReceipt,
  type CreateInventoryReceiptPayload, type InventoryAllocationResponse,
  type InventoryItemDetailResponse, type InventoryItemResponse, type InventoryReceiptResponse,
  type UpdateInventoryReceiptPayload,
} from './api'

/*
 * 관리자 재고 관리 — 떼 온 물건(품목)과 입고 기록, 그리고 그 물건이 어느 상품에 얼마나 걸려 있는지.
 *
 * 수량은 세 칸으로 나뉜다 (재고는 "등록하면 묶이고, 팔리면 빠진다"):
 *   재고      — 아직 아무 상품에도 안 올린 것 (API 필드명은 available)
 *   판매 중   — 응모·쿠지·상점 상품에 걸려 있는 것 (환불·중간 종료 시 재고로 돌아옴)
 *   판매 완료 — 팔려서 나간 것 (이때 원가가 기록된다)
 * 평균 원가 = 입고 단가의 수량 가중 평균.
 *
 * TODO(backend): /inventory API가 생기면 USE_MOCK을 false로. 그때까지 아래 가짜 데이터로 화면만 돈다(새로고침하면 처음 상태).
 */
const USE_MOCK = true

export type { InventoryItemResponse as InventoryItem, InventoryItemDetailResponse as InventoryItemDetail }

export async function fetchInventoryItems(token: string): Promise<InventoryItemResponse[]> {
  if (!USE_MOCK) return getInventoryItems(token)
  return mockItems.map(summarize)
}

export async function fetchInventoryItem(token: string, itemId: number): Promise<InventoryItemDetailResponse | null> {
  if (!USE_MOCK) return getInventoryItem(token, itemId)
  const item = mockItems.find(i => i.item_id === itemId)
  if (!item) return null
  return {
    ...summarize(item),
    receipts: mockReceipts.filter(r => r.item_id === itemId).sort((a, b) => b.received_at.localeCompare(a.received_at)),
    allocations: mockAllocations.filter(a => a.item_id === itemId),
  }
}

export async function addInventoryReceipt(token: string, payload: CreateInventoryReceiptPayload): Promise<void> {
  if (!USE_MOCK) {
    await createInventoryReceipt(token, payload)
    return
  }
  await new Promise(resolve => setTimeout(resolve, 300))
  let itemId = payload.item_id
  if (itemId == null) {
    itemId = Math.max(0, ...mockItems.map(i => i.item_id)) + 1
    mockItems = [...mockItems, {
      item_id: itemId,
      name: payload.name ?? '',
      image_url: payload.image ? URL.createObjectURL(payload.image) : null,
      memo: null,
    }]
  }
  mockReceipts = [...mockReceipts, {
    receipt_id: Math.max(0, ...mockReceipts.map(r => r.receipt_id)) + 1,
    item_id: itemId,
    quantity: payload.quantity,
    unit_cost: payload.unit_cost,
    received_at: payload.received_at,
    supplier: payload.supplier ?? null,
    tax_invoice: payload.tax_invoice,
    memo: payload.memo ?? null,
    created_at: new Date().toISOString(),
  }]
}

// 입고 기록을 고치거나 지울 때, 이미 상품에 올렸거나 팔린 수량보다 총 입고가 적어지면 안 된다
function checkReceiptChange(receiptId: number, nextQuantity: number) {
  const receipt = mockReceipts.find(r => r.receipt_id === receiptId)
  if (!receipt) throw new Error('입고 기록을 찾을 수 없어요.')
  const item = mockItems.find(i => i.item_id === receipt.item_id)
  if (!item) throw new Error('품목을 찾을 수 없어요.')
  const s = summarize(item)
  const used = s.reserved + s.sold
  const nextTotal = s.total_received - receipt.quantity + nextQuantity
  if (nextTotal < used) {
    throw new Error(`이 품목은 이미 ${used}개를 상품에 올렸거나 팔았어요. 입고 합계가 ${used}개보다 적어질 수 없어요.`)
  }
  return receipt
}

export async function editInventoryReceipt(token: string, receiptId: number, patch: UpdateInventoryReceiptPayload): Promise<void> {
  if (!USE_MOCK) {
    await updateInventoryReceipt(token, receiptId, patch)
    return
  }
  const receipt = checkReceiptChange(receiptId, patch.quantity ?? mockReceipts.find(r => r.receipt_id === receiptId)?.quantity ?? 0)
  await new Promise(resolve => setTimeout(resolve, 200))
  mockReceipts = mockReceipts.map(r => (r.receipt_id === receipt.receipt_id ? { ...r, ...patch } : r))
}

export async function removeInventoryReceipt(token: string, receiptId: number): Promise<void> {
  if (!USE_MOCK) {
    await deleteInventoryReceipt(token, receiptId)
    return
  }
  const receipt = checkReceiptChange(receiptId, 0)
  await new Promise(resolve => setTimeout(resolve, 200))
  mockReceipts = mockReceipts.filter(r => r.receipt_id !== receiptId)
  // 입고가 하나도 안 남고 어디에도 안 쓴 품목이면 품목도 지운다
  const left = mockReceipts.some(r => r.item_id === receipt.item_id)
  const used = mockAllocations.some(a => a.item_id === receipt.item_id)
  if (!left && !used) mockItems = mockItems.filter(i => i.item_id !== receipt.item_id)
}

// 상품 판매 종료·수량 조정 때 묶어 둔 수량을 조정한다 (delta < 0 이면 재고로 돌려놓기, > 0 이면 재고에서 더 묶기).
// 실제로는 서버가 판매 종료·수량 조정 API 안에서 처리하므로, 가짜 데이터일 때만 화면용으로 흉내 낸다.
// delta를 안 주면 그 상품에 묶인 판매 중 수량을 전부 재고로 돌려놓는다. 반환값: 실제로 바뀐 수량
export function adjustInventoryForProduct(
  productType: InventoryAllocationResponse['product_type'],
  productId: number,
  delta?: number,
): number {
  if (!USE_MOCK) return 0
  const mine = mockAllocations.filter(a => a.product_type === productType && a.product_id === productId)
  if (delta == null) {
    const released = mine.reduce((n, a) => n + a.reserved, 0)
    mockAllocations = mockAllocations.map(a => (mine.includes(a) ? { ...a, reserved: 0 } : a))
    return -released
  }
  const target = mine[0]
  if (!target) return 0
  if (delta < 0) {
    const take = Math.min(-delta, target.reserved)
    mockAllocations = mockAllocations.map(a => (a === target ? { ...a, reserved: a.reserved - take } : a))
    return -take
  }
  const item = mockItems.find(i => i.item_id === target.item_id)
  const available = item ? summarize(item).available : 0
  if (delta > available) throw new Error(`재고가 ${available}개뿐이라 ${delta}개를 더 올릴 수 없어요.`)
  mockAllocations = mockAllocations.map(a => (a === target ? { ...a, reserved: a.reserved + delta } : a))
  return delta
}

// 상품에 연결된 재고 품목 (상점 수량 조정 화면에서 남은 재고를 보여주려고)
export function inventoryItemForProduct(productType: InventoryAllocationResponse['product_type'], productId: number): InventoryItemResponse | null {
  if (!USE_MOCK) return null
  const a = mockAllocations.find(x => x.product_type === productType && x.product_id === productId)
  const item = a ? mockItems.find(i => i.item_id === a.item_id) : null
  return item ? summarize(item) : null
}

// 상품 등록 때 재고에서 고른 수량을 "판매 중"으로 묶는다.
// 실제로는 서버가 상품을 만들면서 같은 트랜잭션으로 처리하므로(inventory_item_id), 가짜 데이터일 때만 화면용으로 흉내 낸다.
export function reserveInventoryForProduct(lines: {
  itemId: number
  quantity: number
  productType: InventoryAllocationResponse['product_type']
  productId: number
  productName: string
}[]) {
  if (!USE_MOCK) return
  for (const l of lines) {
    if (l.quantity <= 0) continue
    mockAllocations = [...mockAllocations, {
      item_id: l.itemId, product_type: l.productType, product_id: l.productId, product_name: l.productName, reserved: l.quantity, sold: 0,
    }]
  }
}

// 기간 손익의 "물건 사는 데 쓴 돈"용 — 입고 기록 전체
// TODO(backend): GET /inventory/receipts?from=&to= 로 교체
export function listInventoryReceipts(): InventoryReceiptResponse[] {
  return mockReceipts
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

// ── 가짜 데이터 (서버 API 생기면 지운다) ──
interface MockItem { item_id: number; name: string; image_url: string | null; memo: string | null }

function summarize(item: MockItem): InventoryItemResponse {
  const receipts = mockReceipts.filter(r => r.item_id === item.item_id)
  const allocations = mockAllocations.filter(a => a.item_id === item.item_id)
  const total = receipts.reduce((n, r) => n + r.quantity, 0)
  const reserved = allocations.reduce((n, a) => n + a.reserved, 0)
  const sold = allocations.reduce((n, a) => n + a.sold, 0)
  return {
    ...item,
    total_received: total,
    reserved,
    sold,
    available: total - reserved - sold,
    avg_unit_cost: averageCost(receipts),
    last_received_at: receipts.map(r => r.received_at).sort().pop() ?? null,
  }
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString().slice(0, 10)

let mockItems: MockItem[] = [
  { item_id: 1, name: '원피스 루피 기어5 피규어', image_url: '/images/demo-1.jpg', memo: null },
  { item_id: 2, name: '주술회전 고죠 사토루 피규어', image_url: '/images/demo-4.jpg', memo: '정품 인증서 동봉' },
  { item_id: 3, name: '귀멸의 칼날 캔뱃지', image_url: '/images/demo-8.jpg', memo: null },
  { item_id: 4, name: '아크릴 스탠드 (랜덤)', image_url: '/images/demo-5.jpg', memo: null },
  { item_id: 5, name: '포켓몬 카드 151 부스터팩', image_url: '/images/demo-6.jpg', memo: null },
]

let mockReceipts: InventoryReceiptResponse[] = [
  { receipt_id: 1, item_id: 1, quantity: 2, unit_cost: 24000, received_at: daysAgo(20), supplier: '도매꾹 ○○상사', tax_invoice: true, memo: null, created_at: daysAgo(20) },
  { receipt_id: 2, item_id: 1, quantity: 1, unit_cost: 22500, received_at: daysAgo(4), supplier: '도매꾹 ○○상사', tax_invoice: true, memo: '재입고 할인', created_at: daysAgo(4) },
  { receipt_id: 3, item_id: 2, quantity: 1, unit_cost: 38000, received_at: daysAgo(12), supplier: '△△토이 총판', tax_invoice: true, memo: null, created_at: daysAgo(12) },
  { receipt_id: 4, item_id: 3, quantity: 40, unit_cost: 1800, received_at: daysAgo(15), supplier: '□□굿즈', tax_invoice: false, memo: null, created_at: daysAgo(15) },
  { receipt_id: 5, item_id: 4, quantity: 30, unit_cost: 2300, received_at: daysAgo(15), supplier: '□□굿즈', tax_invoice: false, memo: null, created_at: daysAgo(15) },
  { receipt_id: 6, item_id: 5, quantity: 10, unit_cost: 4500, received_at: daysAgo(6), supplier: '◇◇카드', tax_invoice: true, memo: null, created_at: daysAgo(6) },
]

let mockAllocations: (InventoryAllocationResponse & { item_id: number })[] = [
  { item_id: 1, product_type: 'raffle', product_id: 11, product_name: '[응모] 원피스 루피 기어5', reserved: 1, sold: 0 },
  { item_id: 1, product_type: 'raffle', product_id: 7, product_name: '[응모] 원피스 루피 기어5 (1차)', reserved: 0, sold: 1 },
  { item_id: 2, product_type: 'kuji', product_id: 3, product_name: '[쿠지] 주술회전 A상', reserved: 1, sold: 0 },
  { item_id: 3, product_type: 'kuji', product_id: 3, product_name: '[쿠지] 주술회전 D상', reserved: 12, sold: 8 },
  { item_id: 3, product_type: 'store', product_id: 21, product_name: '[쌀포인트 상점] 캔뱃지', reserved: 5, sold: 3 },
  { item_id: 4, product_type: 'kuji', product_id: 3, product_name: '[쿠지] 주술회전 E상', reserved: 10, sold: 10 },
  { item_id: 5, product_type: 'store', product_id: 22, product_name: '[상점] 포켓몬 카드 151', reserved: 10, sold: 0 },
]
