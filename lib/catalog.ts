import { API_URL, ApiError, getInventoryItems, updateInventoryItem, type InventoryItemResponse } from './api'

/*
 * 등록 상품 (관리자 "상품 등록") — 떼 온 물건을 사진 · 상품명 · 설명(상품정보제공고시)으로 한 번 등록해 두고,
 * "상품 게시"에서 골라 응모 · 쿠지 · 상점에 올린다. 내려도 다음에 다시 골라 쓸 수 있다.
 * 재고 수량 · 원가는 사이트에서 관리하지 않는다 (엑셀 등 따로, 2026-11-25 결정).
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
}

function toCatalogItem(i: InventoryItemResponse): CatalogItem {
  return { id: i.item_id, name: i.name, imageUrl: i.image_url, description: i.description ?? '' }
}

export async function fetchCatalog(token: string): Promise<CatalogItem[]> {
  const items = await getInventoryItems(token)
  return items.map(toCatalogItem).sort((a, b) => b.id - a.id)
}

async function postForm(token: string, path: string, form: FormData) {
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  const data = await res.json().catch(() => null)
  return { res, data }
}

function errorOf(res: Response, data: unknown, fallback: string): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail
  return new ApiError(res.status, typeof detail === 'string' ? detail : fallback)
}

// 서울 날짜 YYYY-MM-DD (대신 만드는 입고 기록의 날짜)
const seoulToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

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
  form.append('memo', '상품 등록 (재고 아님)')
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
  const res = await fetch(`${API_URL}/inventory/items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (res.ok) return
  const data = await res.json().catch(() => null)
  if (res.status === 405) throw new ApiError(405, '서버에 아직 삭제 기능이 없어요. 서버 작업이 끝나면 지울 수 있어요.')
  throw errorOf(res, data, '삭제 중 오류가 발생했어요.')
}
