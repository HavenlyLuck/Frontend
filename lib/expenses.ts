import { createExpense, deleteExpense, getFinance, type ExpenseResponse } from './api'

/*
 * 비용 기록 (관리자 "비용") — 상품 매입 말고 나가는 돈: 택배비 · 마케팅 · 서버 · 포장재 · 수수료 등.
 * 서버의 부대비용 표(/finance/expenses: 날짜 · 이름 · 금액)를 그대로 쓰고, 구분은 이름 앞에 "구분 · 항목"으로 붙인다.
 * 주간 장부(구글 시트) 비용 탭이 이 기록을 날짜 · 구분 · 항목 · 금액으로 가져간다.
 */

export const EXPENSE_CATEGORIES = ['택배·배송', '마케팅', '서버·운영', '포장재', '결제 수수료', '매입 관련', '기타'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface ExpenseRecord {
  id: number
  date: string          // YYYY-MM-DD
  category: string      // 구분 (목록에 없는 옛 기록은 "기타")
  item: string          // 항목
  amount: number        // 원
}

const SEP = ' · '

export function toExpenseRecord(e: ExpenseResponse): ExpenseRecord {
  const i = e.label.indexOf(SEP)
  const head = i >= 0 ? e.label.slice(0, i) : ''
  const known = (EXPENSE_CATEGORIES as readonly string[]).includes(head)
  return { id: e.expense_id, date: e.spent_on, category: known ? head : '기타', item: known ? e.label.slice(i + SEP.length) : e.label, amount: e.amount }
}

export async function fetchExpenses(token: string, from: string, to: string): Promise<ExpenseRecord[]> {
  const res = await getFinance(token, from, to)
  return res.expenses.map(toExpenseRecord).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
}

export async function addExpense(token: string, input: { date: string; category: ExpenseCategory; item: string; amount: number }): Promise<void> {
  await createExpense(token, { spent_on: input.date, label: `${input.category}${SEP}${input.item.trim() || input.category}`, amount: input.amount })
}

export async function removeExpense(token: string, id: number): Promise<void> {
  await deleteExpense(token, id)
}
