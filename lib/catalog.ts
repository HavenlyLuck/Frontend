import {
  API_URL, ApiError, apiFetch, createInventoryReceipt, deleteInventoryReceipt, getInventoryItem, getInventoryItems,
  updateInventoryItem, updateInventoryReceipt, type InventoryItemResponse, type InventoryReceiptResponse,
} from './api'

/*
 * 등록 상품 (관리자 "상품 등록") — 떼 온 물건을 사진 · 상품명 · 설명(상품정보제공고시)으로 한 번 등록해 두고,
 * "상품 게시"에서 골라 응모 · 쿠지 · 상점에 올린다. 내려도 다음에 다시 골라 쓸 수 있다.
 * 매입 기록(언제 · 어디서 · 몇 개 · 단가)은 상품마다 남긴다 — 주간 장부(구글 시트)가 이걸 원가로 쓴다.
 * 재고 수량 계산(묶임 · 팔림)은 사이트에서 하지 않고 장부에서 한다 (2026-11-25 결정).
 *
 * 서버는 기존 재고 품목 표(inventory_items: 이름 · 사진 · 설명)를 그대로 쓴다.
 * TODO(백엔드): POST /inventory/items (name, image, description — 입고 기록 없이 품목만),
 *              DELETE /inventory/items/{id}, PATCH /inventory/items/{id}에 name 받기.
 *   POST가 아직 없으면 수량 1 · 단가 0 입고 기록으로 대신 만든다(재고 화면이 없어져서 보이지 않는다).
 */

export interface CatalogItem {
  id: number
  name: string
  imageUrl: string | null
  description: string
  purchasedQty: number      // 지금까지 매입한 개수 (등록용 빈 기록 제외)
  avgUnitCost: number       // 매입 단가 평균(원)
}

// 매입 정보 없이 등록할 때 서버에 품목만 만드는 API가 없어서 넣는 빈 입고 기록 — 매입으로 세지 않는다
const PLACEHOLDER_MEMO = '상품 등록 (재고 아님)'
const isPlaceholder = (r: Pick<InventoryReceiptResponse, 'memo' | 'unit_cost'>) => r.memo === PLACEHOLDER_MEMO && r.unit_cost === 0

function toCatalogItem(i: InventoryItemResponse): CatalogItem {
  // 빈 기록만 있는 품목 = 수량 1 · 평균 0원 → 매입 0개로 본다
  const onlyPlaceholder = i.avg_unit_cost === 0 && i.total_received <= 1
  return {
    id: i.item_id, name: i.name, imageUrl: i.image_url, description: i.description ?? '',
    purchasedQty: onlyPlaceholder ? 0 : i.total_received,
    avgUnitCost: i.avg_unit_cost,
  }
}

// ── 매입 기록 ─────────────────────────────────────────────
// 상품값만 남긴다. 배송비 · 수수료 같은 나머지 돈은 상품에 붙이지 않고 관리자 "비용"에 날짜별로 적는다 (lib/expenses.ts)
export interface PurchaseInput {
  date: string          // 매입일 YYYY-MM-DD (돈 낸 날)
  supplier: string      // 매입처 (가게 · 사이트 · 거래처)
  quantity: number
  unitCost: number      // 1개당 실제로 낸 돈(원) — 과세면 부가세 포함, 면세면 그대로
  taxFree: boolean      // 부가세 면세로 떼 온 것 (계산서 · 면세 영수증)
  memo: string
}

export interface PurchaseRecord {
  id: number
  date: string
  supplier: string
  quantity: number
  unitCost: number
  taxFree: boolean
  memo: string
}

/*
 * 면세 여부는 서버 입고 기록에 칸이 없어서 메모 앞에 "[면세]"로 붙인다 — 장부가 이걸 보고 과세분만 부가세를 나눈다.
 * TODO(백엔드): 입고 기록에 tax_free(bool) — 생기면 메모 대신 그 칸을 쓴다 (POST 때 tax_free 필드는 이미 같이 보냄).
 */
const TAX_FREE_TAG = /^\[면세\]\s*/

function toPurchase(r: InventoryReceiptResponse): PurchaseRecord {
  const memo = r.memo ?? ''
  const taxFree = r.tax_free ?? TAX_FREE_TAG.test(memo)
  return { id: r.receipt_id, date: r.received_at, supplier: r.supplier ?? '', quantity: r.quantity, unitCost: r.unit_cost, taxFree, memo: memo.replace(TAX_FREE_TAG, '') }
}

const memoWithTax = (p: Pick<PurchaseInput, 'memo' | 'taxFree'>) => [p.taxFree ? '[면세]' : '', p.memo.trim()].filter(Boolean).join(' ')

export async function fetchPurchases(token: string, itemId: number): Promise<PurchaseRecord[]> {
  const detail = await getInventoryItem(token, itemId)
  return detail.receipts.filter(r => !isPlaceholder(r)).map(toPurchase).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
}

// 등록 때 만든 빈 기록만 있으면 그걸 첫 매입으로 고쳐 쓴다 (빈 기록 1개가 재고 수량에 섞이지 않게)
export async function addPurchase(token: string, item: { id: number; name: string }, p: PurchaseInput): Promise<void> {
  const detail = await getInventoryItem(token, item.id)
  const placeholder = detail.receipts.length > 0 && detail.receipts.every(isPlaceholder) ? detail.receipts[0] : null
  const fields = { quantity: p.quantity, unit_cost: p.unitCost, received_at: p.date, supplier: p.supplier.trim() || undefined, memo: memoWithTax(p) || undefined }
  if (placeholder) {
    await updateInventoryReceipt(token, placeholder.receipt_id, { ...fields, supplier: fields.supplier ?? null, memo: fields.memo ?? null })
  } else {
    await createInventoryReceipt(token, { item_id: item.id, ...fields, tax_free: p.taxFree })
  }
}

// 서버는 입고 기록이 하나도 안 남으면 품목까지 지우므로, 마지막 기록은 지우지 않고 빈 기록으로 되돌린다.
export async function removePurchase(token: string, itemId: number, purchaseId: number): Promise<void> {
  const detail = await getInventoryItem(token, itemId)
  if (detail.receipts.length <= 1) {
    await updateInventoryReceipt(token, purchaseId, { quantity: 1, unit_cost: 0, supplier: null, memo: PLACEHOLDER_MEMO })
    return
  }
  await deleteInventoryReceipt(token, purchaseId)
}

export async function fetchCatalog(token: string): Promise<CatalogItem[]> {
  const items = await getInventoryItems(token)
  return items.map(toCatalogItem).sort((a, b) => b.id - a.id)
}

async function postForm(token: string, path: string, form: FormData) {
  const res = await apiFetch(`${API_URL}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  const data = await res.json().catch(() => null)
  return { res, data }
}

function errorOf(res: Response, data: unknown, fallback: string): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail
  return new ApiError(res.status, typeof detail === 'string' ? detail : fallback)
}

// 서울 날짜 YYYY-MM-DD (대신 만드는 입고 기록의 날짜)
const seoulToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

// 상품만 등록한다 — 입고는 목록의 "+ 입고"로 따로
export async function createCatalogItem(token: string, input: { name: string; image: Blob; description: string }): Promise<void> {
  const base = () => {
    const form = new FormData()
    form.append('name', input.name.trim())
    form.append('image', input.image)
    if (input.description.trim()) form.append('description', input.description.trim())
    return form
  }
  const first = await postForm(token, '/inventory/items', base())
  if (first.res.ok) return
  // 405/404 = 서버에 아직 "품목만 만들기"가 없다 → 입고 기록으로 대신 만든다
  if (first.res.status !== 405 && first.res.status !== 404) throw errorOf(first.res, first.data, '상품 등록 중 오류가 발생했어요.')
  const form = base()
  form.append('quantity', '1')
  form.append('unit_cost', '0')
  form.append('received_at', seoulToday())
  form.append('memo', PLACEHOLDER_MEMO)
  const second = await postForm(token, '/inventory/receipts', form)
  if (!second.res.ok) throw errorOf(second.res, second.data, '상품 등록 중 오류가 발생했어요.')
}

// 이름 · 설명 고치기 — 이미 게시한 상품은 그대로, 다음에 게시할 때부터 바뀐 내용이 들어간다.
// 이름은 서버가 받기 전까지 저장되지 않는다 (저장 후 다시 불러와 확인한다)
export async function updateCatalogItem(token: string, id: number, patch: { name: string; description: string }): Promise<CatalogItem> {
  const updated = await updateInventoryItem(token, id, { name: patch.name.trim(), description: patch.description.trim() || null })
  return toCatalogItem(updated)
}

export async function deleteCatalogItem(token: string, id: number): Promise<void> {
  const res = await apiFetch(`${API_URL}/inventory/items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (res.ok) return
  const data = await res.json().catch(() => null)
  if (res.status === 405) throw new ApiError(405, '서버에 아직 삭제 기능이 없어요. 서버 작업이 끝나면 지울 수 있어요.')
  throw errorOf(res, data, '삭제 중 오류가 발생했어요.')
}
