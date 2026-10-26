import { getAdminShippingItems, markItemsShipped, type AdminShippingItemResponse } from './api'

/*
 * 관리자 배송 관리 — 배송 신청된 보관함 상품을 "한 박스" 단위로 묶어서 보여준다.
 * 발송 전에는 같은 사람 · 같은 주소로 신청한 상품이 신청 횟수와 상관없이 한 박스다 (합배송).
 */

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

// 발송 전 상품은 같은 사람 · 같은 배송지면 신청을 여러 번 했어도 한 박스로 묶는다 (배송지가 다르면 따로 보낸다).
// 발송 완료는 같은 송장으로 나간 상품끼리 묶는다
function boxKey(it: AdminShippingItemResponse) {
  return it.status === 'shipped'
    ? `${it.user_id}|${it.carrier}|${it.tracking_number}`
    : `${it.user_id}|${it.address_id}`
}

export function groupIntoBoxes(items: AdminShippingItemResponse[]): ShippingBox[] {
  const boxes = new Map<string, ShippingBox>()
  for (const it of items) {
    const key = boxKey(it)
    const box = boxes.get(key)
    if (box) {
      box.items.push(it)
      // 박스의 신청 시각은 가장 먼저 신청한 것 — 오래 기다린 순 정렬에 쓴다
      if (it.requested_at && (!box.requestedAt || it.requested_at < box.requestedAt)) box.requestedAt = it.requested_at
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
  const items = await getAdminShippingItems(token, status)
  return groupIntoBoxes(items)
}

export async function shipBox(token: string, box: ShippingBox, carrier: string, trackingNumber: string): Promise<void> {
  await markItemsShipped(token, box.items.map(i => i.storage_item_id), carrier, trackingNumber)
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
