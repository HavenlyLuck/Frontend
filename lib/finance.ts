import { DAILY_REV, MONTHLY_REV, DAILY_SALES } from './adminStats'
import { PRODUCTS } from './adminProducts'

export interface ExpenseRecord {
  id: string
  date: string // YYYY-MM-DD
  label: string
  amount: number
  auto?: boolean // true = 쌀포인트 판매에서 자동으로 생성된 항목 (수동 삭제 불가)
}

export const EXPENSE_RECORDS: ExpenseRecord[] = []

export function addExpenseRecord(record: ExpenseRecord) {
  EXPENSE_RECORDS.unshift(record)
}

export function removeExpenseRecord(id: string) {
  const idx = EXPENSE_RECORDS.findIndex(r => r.id === id)
  if (idx !== -1) EXPENSE_RECORDS.splice(idx, 1)
}

function parseWon(s: string): number {
  return Number(s.replace(/[^0-9]/g, '')) || 0
}

function toDateStr(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function last7Dates(endDate: string): string[] {
  const end = new Date(endDate + 'T00:00:00')
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    dates.push(toDateStr(d))
  }
  return dates
}

export type Period = 'day' | 'week' | 'month' | 'year'

// 해당 기간에 속하는 판매 기록 날짜(DAILY_SALES 기준) 목록
function datesInPeriod(period: Period, key: string): string[] {
  if (period === 'day') return [key]
  if (period === 'week') return last7Dates(key)
  return Object.keys(DAILY_SALES).filter(d => d.startsWith(key))
}

// 쌀포인트 상점 상품은 무료로 지급된 포인트로 구매하는 것이라 매출로 잡지 않고,
// 판매될 때마다 제품 원가만 "판매된 상품명"으로 부대비용에 자동 기록한다.
function isRicePointSale(title: string): boolean {
  const matched = PRODUCTS.find(p => p.title === title)
  return matched?.type === '상점(쌀포인트)'
}

function getRicePointAutoExpenses(date: string): ExpenseRecord[] {
  const sales = DAILY_SALES[date] ?? []
  const result: ExpenseRecord[] = []
  sales.forEach((s, i) => {
    const matched = PRODUCTS.find(p => p.title === s.title)
    if (matched?.type === '상점(쌀포인트)' && matched.cost) {
      result.push({ id: `auto-rice-${date}-${i}`, date, label: s.title, amount: parseWon(matched.cost), auto: true })
    }
  })
  return result
}

// 쌀포인트 판매분은 원가 집계에서 제외한다 (부대비용 쪽으로 옮겨서 잡으므로 중복 집계 방지)
export function getDailyCost(date: string): number {
  const sales = DAILY_SALES[date] ?? []
  return sales.reduce((sum, s) => {
    if (isRicePointSale(s.title)) return sum
    const matched = PRODUCTS.find(p => p.title === s.title)
    return sum + (matched?.cost ? parseWon(matched.cost) : 0)
  }, 0)
}

export interface PeriodSummary {
  revenue: number
  cost: number
  margin: number
  expenses: number
  netProfit: number
}

// key: day -> 'YYYY-MM-DD' (window ends on this date for week), month -> 'YYYY-MM', year -> 'YYYY'
export function getPeriodSummary(period: Period, key: string): PeriodSummary {
  const dates = datesInPeriod(period, key)

  let revenue = 0
  if (period === 'day') revenue = DAILY_REV[key] ?? 0
  else if (period === 'week') revenue = dates.reduce((sum, d) => sum + (DAILY_REV[d] ?? 0), 0)
  else if (period === 'month') revenue = MONTHLY_REV[key] ?? 0
  else revenue = Object.entries(MONTHLY_REV).filter(([m]) => m.startsWith(key)).reduce((sum, [, v]) => sum + v, 0)

  const cost = dates.reduce((sum, d) => sum + getDailyCost(d), 0)
  const dateSet = new Set(dates)
  const manualExpenses = EXPENSE_RECORDS.filter(r => dateSet.has(r.date)).reduce((sum, r) => sum + r.amount, 0)
  const autoExpenses = dates.reduce((sum, d) => sum + getRicePointAutoExpenses(d).reduce((s, r) => s + r.amount, 0), 0)
  const expenses = manualExpenses + autoExpenses

  const margin = revenue - cost
  return { revenue, cost, margin, expenses, netProfit: margin - expenses }
}

export function getExpensesForPeriod(period: Period, key: string): ExpenseRecord[] {
  const dates = datesInPeriod(period, key)
  const dateSet = new Set(dates)
  const manual = EXPENSE_RECORDS.filter(r => dateSet.has(r.date))
  const auto = dates.flatMap(getRicePointAutoExpenses)
  return [...manual, ...auto].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
