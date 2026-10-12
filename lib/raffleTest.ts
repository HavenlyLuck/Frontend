import type { RaffleEntryCreateResponse, RaffleProductResponse } from './api'

/*
 * 화면 확인용 테스트 응모 — 서버 없이 응모 상세·응모권 구매 연출을 바로 볼 수 있게 프론트에만 있다.
 * 응모 목록(/eungmo)에만 보이고 홈에는 안 보인다. 주소는 /eungmo/-1.
 * 구매해도 서버를 부르지 않는다 → 운포인트가 빠지지 않고 응모 내역에도 안 남는다. 새로고침하면 처음 상태로.
 */

export const TEST_RAFFLE_ID = -1

const TOTAL = 5
const START_SOLD = 2
let soldSlots = START_SOLD
let myTickets = 0
let nextEntryId = 1

export function isTestRaffle(id: number) {
  return id === TEST_RAFFLE_ID
}

export function getTestRaffle(): RaffleProductResponse {
  const now = Date.now()
  const start = new Date(now - 3_600_000).toISOString()
  const end = new Date(now + 86_400_000).toISOString()
  return {
    raffle_product_id: TEST_RAFFLE_ID,
    product_name: '[테스트] 5장 응모',
    description: '응모 상세와 응모권 구매 연출을 확인하기 위한 테스트 응모예요. 구매해도 포인트가 빠지지 않아요.',
    price_krw: TOTAL * 1000,
    ticket_price: 1000,
    total_slots: TOTAL,
    sold_slots: soldSlots,
    image_url: '/images/demo-2.jpg',
    status: 'open',
    starts_at: start,
    ends_at: end,
    drawn_at: null,
    winner_entry_number: null,
    winner_user_id: null,
    remaining_seconds: 86_400,
    is_open: true,
    remaining_slots: TOTAL - soldSlots,
    sold_out_at: soldSlots >= TOTAL ? new Date(now).toISOString() : null,
  }
}

// 서버의 응모권 구매 흉내 — 남은 칸 안에서만 산다
export async function createTestRaffleEntry(ticketCount: number): Promise<RaffleEntryCreateResponse> {
  await new Promise(resolve => setTimeout(resolve, 300))
  const left = TOTAL - soldSlots
  if (ticketCount > left) throw new Error(`남은 응모권은 ${left}장이에요.`)
  soldSlots += ticketCount
  myTickets += ticketCount
  return {
    entry_id: nextEntryId++,
    raffle_product_id: TEST_RAFFLE_ID,
    ticket_count: ticketCount,
    points_spent: 0,
    created_at: new Date().toISOString(),
    entry_number: 3,
    total_ticket_count: myTickets,
  }
}
