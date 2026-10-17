import type { KujiBoardResponse, KujiDrawResponse, KujiSetResponse } from './api'

/*
 * 화면 테스트용 쿠지 — 쿠지 목록에만 보이고, 서버에 안 가고 브라우저 메모리에서만 굴러간다.
 * 5장(A상 1 · C상 2 · D상 2) + 라스트원상. 포인트 차감·보관함 적재 없음.
 * 새로고침하면 처음 상태로 돌아간다(제비 배치는 그때마다 새로 섞인다).
 * TODO: 실제 오픈 전에 이 파일과 isTestKuji 분기를 지운다
 */
export const TEST_KUJI_ID = -1

const PRIZES = [
  { id: -11, tier: 'upper' as const, grade: 'A', name: '테스트 A상 피규어', image: '/images/demo-1.jpg', quantity: 1 },
  { id: -12, tier: 'lower' as const, grade: 'C', name: '테스트 캔뱃지', image: null, quantity: 2 },
  { id: -13, tier: 'lower' as const, grade: 'D', name: '테스트 스티커', image: null, quantity: 2 },
]
const LAST_ONE = { name: '테스트 라스트원 피규어', image_url: '/images/demo-3.jpg' }
const TOTAL = PRIZES.reduce((n, p) => n + p.quantity, 0)

// 번호 → 상품. 화면은 뽑힌 번호의 등급만 받는다(서버와 같은 규칙)
const slots = PRIZES.flatMap(p => Array.from({ length: p.quantity }, () => p))
for (let i = slots.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[slots[i], slots[j]] = [slots[j], slots[i]]
}
let drawn: { ticket_number: number; grade: string }[] = []
let version = 1
let soldOutAt: string | null = null

export function isTestKuji(id: number) {
  return id === TEST_KUJI_ID
}

function board(): KujiBoardResponse {
  return { kuji_set_id: TEST_KUJI_ID, version, total_tickets: TOTAL, remaining_tickets: TOTAL - drawn.length, drawn: [...drawn] }
}

export function getTestKujiSet(): KujiSetResponse {
  const remaining = TOTAL - drawn.length
  return {
    kuji_set_id: TEST_KUJI_ID,
    title: '[테스트] 5장 쿠지',
    description: '화면 테스트용 쿠지예요. 포인트가 차감되지 않아요.',
    image_url: '/images/demo-2.jpg',
    ticket_price: 1000,
    total_tickets: TOTAL,
    remaining_tickets: remaining,
    status: remaining > 0 ? 'open' : 'sold_out',
    prizes: PRIZES.map(p => ({
      kuji_prize_id: p.id,
      tier: p.tier,
      grade: p.grade,
      name: p.name,
      image_url: p.image,
      quantity: p.quantity,
      remaining_quantity: p.quantity - drawn.filter(d => d.grade === p.grade).length,
    })),
    last_one_name: LAST_ONE.name,
    last_one_image_url: LAST_ONE.image_url,
    created_at: new Date().toISOString(),
    sold_out_at: soldOutAt,
  }
}

export async function getTestKujiBoard(since?: number): Promise<KujiBoardResponse | null> {
  return since === version ? null : board()
}

export async function drawTestKuji(ticketNumbers: number[]): Promise<KujiDrawResponse> {
  await new Promise(resolve => setTimeout(resolve, 300))
  const conflicts = ticketNumbers.filter(n => drawn.some(d => d.ticket_number === n))
  if (conflicts.length > 0) {
    return { ok: false, drawn: [], last_one: null, points_spent: 0, conflict_ticket_numbers: conflicts, board: board() }
  }
  const picked = ticketNumbers.map(n => {
    const p = slots[n - 1]
    return { ticket_number: n, kuji_prize_id: p.id, grade: p.grade, tier: p.tier, name: p.name, image_url: p.image }
  })
  drawn = [...drawn, ...picked.map(d => ({ ticket_number: d.ticket_number, grade: d.grade }))]
  version++
  if (drawn.length === TOTAL) soldOutAt = new Date().toISOString()
  return {
    ok: true,
    drawn: picked,
    last_one: drawn.length === TOTAL ? LAST_ONE : null,
    points_spent: 0,
    conflict_ticket_numbers: [],
    board: board(),
  }
}
