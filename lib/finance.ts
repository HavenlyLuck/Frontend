import { getSales, shiftDate, todayKey, type SaleRecord } from './sales'
import { listInventoryReceipts } from './inventory'

/*
 * 재고·자금 관리의 손익 계산 — 판매 기록(lib/sales.ts) · 재고 입고(lib/inventory.ts) · 부대비용을 한데 모은다.
 *
 *   매출      = 카드 결제 금액 (쌀포인트 결제는 0)
 *   판매 원가 = 나간 물건의 원가 전부 (재고 평균 원가에서 자동) — 쌀포인트로 나간 물건도 여기
 *   마진      = 매출 − 판매 원가
 *   부대비용  = 손으로 적은 비용(택배비·광고비 등)
 *   순이익    = 마진 − 부대비용
 *
 * 물건을 사 온 돈(입고)은 비용이 아니다 — 재고로 남아 있다가 팔릴 때 원가가 된다.
 * 그래서 손익과 따로 "돈의 흐름"으로 보여준다(이 기간 매입 금액).
 */

export interface ExpenseRecord {
  id: string
  date: string // YYYY-MM-DD
  label: string
  amount: number
}

// TODO(backend): 부대비용 API 없음 — 지금은 새로고침하면 사라진다
export const EXPENSE_RECORDS: ExpenseRecord[] = []

export function addExpenseRecord(record: ExpenseRecord) {
  EXPENSE_RECORDS.unshift(record)
}

export function removeExpenseRecord(id: string) {
  const idx = EXPENSE_RECORDS.findIndex(r => r.id === id)
  if (idx !== -1) EXPENSE_RECORDS.splice(idx, 1)
}

export type Period = 'day' | 'week' | 'month' | 'year'

export { todayKey }

// key: day·week → 'YYYY-MM-DD'(주는 이 날로 끝나는 7일), month → 'YYYY-MM', year → 'YYYY'
export function periodRange(period: Period, key: string): { from: string; to: string } {
  if (period === 'day') return { from: key, to: key }
  if (period === 'week') return { from: shiftDate(key, -6), to: key }
  if (period === 'month') return { from: `${key}-01`, to: `${key}-31` }
  return { from: `${key}-01-01`, to: `${key}-12-31` }
}

const within = (date: string, r: { from: string; to: string }) => date >= r.from && date <= r.to

export function getSalesForPeriod(period: Period, key: string): SaleRecord[] {
  const r = periodRange(period, key)
  return getSales().filter(s => within(s.date, r)).sort((a, b) => b.date.localeCompare(a.date))
}

export function getExpensesForPeriod(period: Period, key: string): ExpenseRecord[] {
  const r = periodRange(period, key)
  return EXPENSE_RECORDS.filter(e => within(e.date, r)).sort((a, b) => b.date.localeCompare(a.date))
}

export interface PeriodSummary {
  revenue: number
  cost: number        // 나간 물건 원가 전부 (카드 + 쌀포인트)
  ssalCost: number    // cost 중 쌀포인트로 나간 물건 원가
  margin: number
  expenses: number    // 손으로 적은 부대비용
  netProfit: number
  purchases: number   // 이 기간 입고(물건 사는 데 쓴 돈) — 손익과 별개
  salesCount: number
}

export function getPeriodSummary(period: Period, key: string): PeriodSummary {
  const sales = getSalesForPeriod(period, key)
  const revenue = sales.reduce((n, s) => n + s.revenue, 0)
  const cost = sales.reduce((n, s) => n + s.cost, 0)
  const ssalCost = sales.filter(s => s.pay === 'ssal').reduce((n, s) => n + s.cost, 0)
  const expenseTotal = getExpensesForPeriod(period, key).reduce((n, e) => n + e.amount, 0)
  const r = periodRange(period, key)
  const purchases = listInventoryReceipts()
    .filter(rc => within(rc.received_at, r))
    .reduce((n, rc) => n + rc.quantity * rc.unit_cost, 0)
  const margin = revenue - cost
  return {
    revenue, cost, ssalCost, margin,
    expenses: expenseTotal,
    netProfit: margin - expenseTotal,
    purchases,
    salesCount: sales.length,
  }
}
