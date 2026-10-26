/*
 * 날짜 키 도우미 — 재고·자금 손익과 관리자 홈 매출이 같이 쓴다.
 * 판매 기록 자체는 서버가 결제 · 보관함에서 모아서 준다 (GET /finance, lib/finance.ts).
 */

// 한국 시간 기준 오늘 YYYY-MM-DD
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
