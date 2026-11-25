// 보관함 보관 기간 — 응모 당첨·쿠지 상품은 보관함에 들어온 날부터 30일 안에 배송 신청하지 않으면 쌀 응모권으로 바뀐다 (2026-11 결정).
// 상점에서 산 상품(카드·쌀포인트)은 대상이 아니다.
// 실제 변환은 서버가 1시간마다 처리한다 (Backend crud/storage.convert_expired_items — 기간이 서버 값과 같아야 한다).
// 장수는 서버가 계산해 보낸다(convert_tickets): 응모는 정가 ÷ 2,000원, 쿠지 상은 원가 × 1.3 ÷ 2,000원 (모두 올림)
import type { StorageItemResponse } from './api'
import { parseServerTime } from './raffle'

export const STORAGE_KEEP_DAYS = 30
export const STORAGE_CONVERT_WON_PER_TICKET = 2000 // 응모 상품 정가 2,000원당 쌀 응모권 1장

export function expiresFor(item: Pick<StorageItemResponse, 'source'>): boolean {
  return item.source !== 'store'
}

// 남은 날 (오늘 들어온 상품 = 30). 0 이하면 오늘 바뀐다
export function daysLeft(item: Pick<StorageItemResponse, 'created_at'>, now = Date.now()): number {
  const end = parseServerTime(item.created_at) + STORAGE_KEEP_DAYS * 86_400_000
  return Math.ceil((end - now) / 86_400_000)
}

// 바뀔 쌀 응모권 장수 — 서버 값을 쓰고, 없으면(예전 서버) 응모 상품만 정가로 계산한다
export function convertTickets(item: Pick<StorageItemResponse, 'price_krw' | 'convert_tickets'>): number | null {
  if (item.convert_tickets != null) return item.convert_tickets
  return item.price_krw ? Math.ceil(item.price_krw / STORAGE_CONVERT_WON_PER_TICKET) : null
}

export const STORAGE_EXPIRY_NOTICE = `응모 당첨·쿠지 상품은 보관함에 들어온 날부터 ${STORAGE_KEEP_DAYS}일 안에 배송 신청하지 않으면 쌀 응모권으로 바뀌어요. 바뀌기 7일 전과 1일 전에 알려 드려요. (상점에서 산 상품은 해당 없음)`
