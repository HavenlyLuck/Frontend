import type { RaffleEntryCreateResponse, RaffleProductResponse } from './api'

/*
 * 화면 테스트용 응모 — 응모 목록에만 보이고, 서버에 안 가고 브라우저 메모리에서만 굴러간다.
 * 포인트 차감·응모 내역 없음. 새로고침하면 처음 상태(5장 중 2장 판매)로 돌아간다.
 * TODO: 실제 오픈 전에 이 파일과 isTestRaffle 분기를 지운다
 */
export const TEST_RAFFLE_ID = -1

const TOTAL = 5
const START_SOLD = 2
let soldSlots = START_SOLD
let myTickets = 0
let nextEntryNumber = START_SOLD + 1

export function isTestRaffle(id: number) {
  return id === TEST_RAFFLE_ID
}

export function getTestRaffle(): RaffleProductResponse {
  const now = Date.now()
  return {
    raffle_product_id: TEST_RAFFLE_ID,
    product_name: '[테스트] 5장 응모',
    description: '화면 테스트용 응모예요. 포인트가 차감되지 않아요.',
    price_krw: 5000,
    ticket_price: 1000,
    total_slots: TOTAL,
    sold_slots: soldSlots,
    image_url: '/images/demo-2.jpg',
    status: 'open',
    starts_at: new Date(now - 3600_000).toISOString(),
    ends_at: new Date(now + 86400_000).toISOString(),
    drawn_at: null,
    winner_entry_number: null,
    winner_user_id: null,
    remaining_seconds: 86400,
    is_open: true,
    remaining_slots: TOTAL - soldSlots,
    sold_out_at: soldSlots >= TOTAL ? new Date(now).toISOString() : null,
  }
}

export async function createTestRaffleEntry(ticketCount: number): Promise<RaffleEntryCreateResponse> {
  await new Promise(resolve => setTimeout(resolve, 300))
  const left = TOTAL - soldSlots
  if (ticketCount > left) throw new Error(`남은 응모권은 ${left}장이에요.`)
  soldSlots += ticketCount
  myTickets += ticketCount
  const entryNumber = nextEntryNumber++
  return {
    entry_id: entryNumber,
    raffle_product_id: TEST_RAFFLE_ID,
    ticket_count: ticketCount,
    points_spent: 0,
    created_at: new Date().toISOString(),
    entry_number: entryNumber,
    total_ticket_count: myTickets,
  }
}
