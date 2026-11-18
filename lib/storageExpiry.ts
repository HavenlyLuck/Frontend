// 보관함 보관 기간 — 응모 당첨·쿠지 상품은 보관함에 들어온 날부터 30일 안에 배송 신청하지 않으면 쌀포인트로 바뀐다 (2026-11 결정).
// 상점에서 산 상품(카드·쌀포인트)은 대상이 아니다.
// ※ 실제 변환은 서버가 매일 처리해야 한다(백엔드 요청). 변환 비율은 임시값 — 확정되면 여기만 고친다.
import type { StorageItemResponse } from './api'
import { parseServerTime } from './raffle'

export const STORAGE_KEEP_DAYS = 30
export const STORAGE_CONVERT_RATE = 0.5 // 판매가의 50% (임시)
export const STORAGE_CONVERT_PERCENT_TEXT = `${Math.round(STORAGE_CONVERT_RATE * 100)}%`

export function expiresFor(item: Pick<StorageItemResponse, 'source'>): boolean {
  return item.source !== 'store'
}

// 남은 날 (오늘 들어온 상품 = 30). 0 이하면 오늘 바뀐다
export function daysLeft(item: Pick<StorageItemResponse, 'created_at'>, now = Date.now()): number {
  const end = parseServerTime(item.created_at) + STORAGE_KEEP_DAYS * 86_400_000
  return Math.ceil((end - now) / 86_400_000)
}

export function convertPoints(item: Pick<StorageItemResponse, 'price_krw'>): number | null {
  return item.price_krw ? Math.floor(item.price_krw * STORAGE_CONVERT_RATE) : null
}

export const STORAGE_EXPIRY_NOTICE = `응모 당첨·쿠지 상품은 보관함에 들어온 날부터 ${STORAGE_KEEP_DAYS}일 안에 배송 신청하지 않으면 판매가의 ${STORAGE_CONVERT_PERCENT_TEXT}가 쌀포인트로 바뀌어요. 바뀌기 7일 전과 1일 전에 알려 드려요. (상점에서 산 상품은 해당 없음)`
