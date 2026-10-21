import { getSales, todayKey } from './sales'

// 관리자 메인 "재고·자금 관리" 카드의 오늘 · 이번 달 매출 — 판매 기록(lib/sales.ts)에서 계산한다

export const TODAY = todayKey()
export const THIS_MONTH = TODAY.slice(0, 7)

export const DAILY_REV: Record<string, number> = {}
export const MONTHLY_REV: Record<string, number> = {}

for (const s of getSales()) {
  if (s.revenue <= 0) continue
  DAILY_REV[s.date] = (DAILY_REV[s.date] ?? 0) + s.revenue
  const month = s.date.slice(0, 7)
  MONTHLY_REV[month] = (MONTHLY_REV[month] ?? 0) + s.revenue
}
