import { getAdminShippingItems, markItemsShipped, type AdminShippingItemResponse } from './api'

/*
 * 관리자 배송 관리 — 배송 신청된 보관함 상품을 "한 박스" 단위로 묶어서 보여준다.
 * 한 번의 배송 신청(같은 사람 · 같은 주소 · 같은 신청 시각)에 고른 상품들이 한 박스다.
 *
 * TODO(backend): 서버 API(GET /storage/admin, POST /storage/admin/ship)가 생기면 USE_MOCK을 false로.
 *   그때까지는 아래 가짜 데이터로 화면만 돌아간다(새로고침하면 처음 상태).
 */
const USE_MOCK = true

export type ShippingStatus = 'requested' | 'shipped'

export interface ShippingBox {
  key: string
  userId: number
  nickname: string
  address: AdminShippingItemResponse['address']
  requestedAt: string | null
  items: AdminShippingItemResponse[]
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
}

export const CARRIERS = ['CJ대한통운', '롯데택배', '한진택배', '우체국택배', '로젠택배']

export function groupIntoBoxes(items: AdminShippingItemResponse[]): ShippingBox[] {
  const boxes = new Map<string, ShippingBox>()
  for (const it of items) {
    const key = `${it.user_id}|${it.address_id}|${it.requested_at}`
    const box = boxes.get(key)
    if (box) {
      box.items.push(it)
      continue
    }
    boxes.set(key, {
      key,
      userId: it.user_id,
      nickname: it.nickname,
      address: it.address,
      requestedAt: it.requested_at,
      items: [it],
      carrier: it.carrier ?? null,
      trackingNumber: it.tracking_number ?? null,
      shippedAt: it.shipped_at ?? null,
    })
  }
  // 오래 기다린 신청부터
  return [...boxes.values()].sort((a, b) => (a.requestedAt ?? '').localeCompare(b.requestedAt ?? ''))
}

export async function fetchShippingBoxes(token: string, status: ShippingStatus): Promise<ShippingBox[]> {
  const items = USE_MOCK ? mockItems.filter(i => i.status === status) : await getAdminShippingItems(token, status)
  return groupIntoBoxes(items)
}

export async function shipBox(token: string, box: ShippingBox, carrier: string, trackingNumber: string): Promise<void> {
  const ids = box.items.map(i => i.storage_item_id)
  if (!USE_MOCK) {
    await markItemsShipped(token, ids, carrier, trackingNumber)
    return
  }
  await new Promise(resolve => setTimeout(resolve, 300))
  const shippedAt = new Date().toISOString()
  mockItems = mockItems.map(i => (ids.includes(i.storage_item_id)
    ? { ...i, status: 'shipped', carrier, tracking_number: trackingNumber, shipped_at: shippedAt }
    : i))
}

// 택배사 대량 접수용 — 박스 하나가 한 줄. 엑셀에서 한글이 안 깨지게 BOM을 붙인다.
export function boxesToCsv(boxes: ShippingBox[]): string {
  const header = ['받는분', '전화번호', '우편번호', '주소', '상세주소', '품목', '수량', '닉네임', '신청일시']
  const rows = boxes.map(b => [
    b.address?.recipient ?? '',
    b.address?.phone ?? '',
    b.address?.zip_code ?? '',
    b.address?.address1 ?? '',
    b.address?.address2 ?? '',
    b.items.map(i => `${i.product_name} x${i.quantity}`).join(' / '),
    String(b.items.reduce((n, i) => n + i.quantity, 0)),
    b.nickname,
    b.requestedAt ? new Date(b.requestedAt).toLocaleString('ko-KR') : '',
  ])
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return '﻿' + [header, ...rows].map(r => r.map(esc).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── 가짜 데이터 (서버 API 생기면 지운다) ──
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

function mock(
  id: number, user: [number, string], addr: AdminShippingItemResponse['address'] & object, addressId: number,
  requestedAt: string, source: AdminShippingItemResponse['source'], name: string, image: string, quantity = 1,
): AdminShippingItemResponse {
  return {
    storage_item_id: id, source, raffle_product_id: null, store_product_id: null, kuji_set_id: null, kuji_prize_id: null,
    product_name: name, image_url: image, quantity, price_krw: null, pay_type: null, amount_spent: null,
    status: 'requested', address_id: addressId, requested_at: requestedAt, created_at: requestedAt,
    carrier: null, tracking_number: null, shipped_at: null,
    user_id: user[0], nickname: user[1], address: addr,
  }
}

const KIM = [101, '행운의고양이'] as [number, string]
const LEE = [102, '쿠지장인'] as [number, string]
const PARK = [103, '라플러'] as [number, string]
const KIM_ADDR = { recipient: '김민준', phone: '010-1234-5678', zip_code: '06236', address1: '서울 강남구 테헤란로 123', address2: '4층 401호' }
const LEE_ADDR = { recipient: '이서연', phone: '010-9876-5432', zip_code: '48058', address1: '부산 해운대구 센텀중앙로 55', address2: '101동 1203호' }
const PARK_ADDR = { recipient: '박지호', phone: '010-5555-1212', zip_code: '34126', address1: '대전 유성구 대학로 99', address2: null }

let mockItems: AdminShippingItemResponse[] = [
  mock(1, KIM, KIM_ADDR, 11, hoursAgo(30), 'raffle', '[응모 당첨] 원피스 루피 기어5 피규어', '/images/demo-1.jpg'),
  mock(2, LEE, LEE_ADDR, 21, hoursAgo(20), 'kuji', '[쿠지 A상] 주술회전 고죠 사토루 피규어', '/images/demo-4.jpg'),
  mock(3, LEE, LEE_ADDR, 21, hoursAgo(20), 'kuji', '[쿠지 D상] 아크릴 스탠드', '/images/demo-5.jpg', 2),
  mock(4, LEE, LEE_ADDR, 21, hoursAgo(20), 'store', '포켓몬 카드 151 부스터팩', '/images/demo-6.jpg', 3),
  mock(5, PARK, PARK_ADDR, 31, hoursAgo(3), 'kuji', '[쿠지 라스트원] 나루토 라스트원 피규어', '/images/demo-7.jpg'),
  {
    ...mock(6, KIM, KIM_ADDR, 11, hoursAgo(80), 'store', '귀멸의 칼날 캔뱃지 세트', '/images/demo-8.jpg'),
    status: 'shipped', carrier: 'CJ대한통운', tracking_number: '6789-1234-5678', shipped_at: hoursAgo(60),
  },
]
