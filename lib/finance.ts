import { createExpense, deleteExpense, getFinance, type ExpenseResponse, type SaleRecordResponse } from './api'
import { shiftDate, todayKey } from './sales'

/*
 * 재고·자금 관리의 손익 계산 — 판매 기록 · 재고 입고 · 부대비용을 서버에서 받아 한데 모은다.
 *
 *   매출      = 카드 결제 금액 (쌀포인트 결제는 0, 환불된 결제는 빠짐)
 *   판매 원가 = 나간 물건의 원가 전부 (재고 평균 원가에서 자동) — 쌀포인트로 나간 물건도 여기
 *   마진      = 매출 − 판매 원가
 *   부대비용  = 손으로 적은 비용(택배비·광고비 등)
 *   순이익    = 마진 − 부대비용
 *
 * 물건을 사 온 돈(입고)은 비용이 아니다 — 재고로 남아 있다가 팔릴 때 원가가 된다.
 * 그래서 손익과 따로 "돈의 흐름"으로 보여준다(이 기간 매입 금액).
 */

export type SaleRecord = SaleRecordResponse
export type ExpenseRecord = ExpenseResponse

export type Period = 'day' | 'week' | 'month' | 'year'

export { todayKey }

const lastDayOfMonth = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return `${key}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

// key: day·week → 'YYYY-MM-DD'(주는 이 날로 끝나는 7일), month → 'YYYY-MM', year → 'YYYY'
export function periodRange(period: Period, key: string): { from: string; to: string } {
  if (period === 'day') return { from: key, to: key }
  if (period === 'week') return { from: shiftDate(key, -6), to: key }
  if (period === 'month') return { from: `${key}-01`, to: lastDayOfMonth(key) }
  return { from: `${key}-01-01`, to: `${key}-12-31` }
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

export interface PeriodFinance {
  sales: SaleRecord[]
  expenses: ExpenseRecord[]
  summary: PeriodSummary
}

export async function fetchPeriodFinance(token: string, period: Period, key: string): Promise<PeriodFinance> {
  const { from, to } = periodRange(period, key)
  const data = await getFinance(token, from, to)
  const revenue = data.sales.reduce((n, s) => n + s.revenue, 0)
  const cost = data.sales.reduce((n, s) => n + s.cost, 0)
  const ssalCost = data.sales.filter(s => s.pay === 'ssal').reduce((n, s) => n + s.cost, 0)
  const expenseTotal = data.expenses.reduce((n, e) => n + e.amount, 0)
  const margin = revenue - cost
  return {
    sales: data.sales,
    expenses: data.expenses,
    summary: {
      revenue, cost, ssalCost, margin,
      expenses: expenseTotal,
      netProfit: margin - expenseTotal,
      purchases: data.purchases,
      salesCount: data.sales.length,
    },
  }
}

export function addExpense(token: string, record: { date: string; label: string; amount: number }) {
  return createExpense(token, { spent_on: record.date, label: record.label, amount: record.amount })
}

export function removeExpense(token: string, expenseId: number) {
  return deleteExpense(token, expenseId)
}
