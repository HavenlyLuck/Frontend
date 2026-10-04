import { getRaffleProducts, type MyRaffleEntryResponse, type RaffleProductResponse } from './api'

// 백엔드 시각은 UTC인데 끝에 Z가 없어서("2026-10-03T02:51:35") 그대로 파싱하면 로컬 시각으로 읽힌다
export function parseServerTime(iso: string): number {
  return Date.parse(/(Z|[+-]\d\d:?\d\d)$/i.test(iso) ? iso : `${iso}Z`)
}

// 매진(추첨 끝난) 카드를 목록에 블러로 남겨두는 기간
export const SOLD_OUT_VISIBLE_MS = 24 * 60 * 60 * 1000

export function isSoldOutRaffle(p: RaffleProductResponse): boolean {
  return p.status === 'completed' || p.remaining_slots <= 0
}

/*
 * 홈/응모 목록에 보여줄 응모 상품: 진행 중(매진 후 추첨 대기 포함) + 추첨이 끝난 지 하루가 안 된 상품.
 * 진행 중인 상품이 먼저, 매진 상품은 뒤로.
 * TODO(backend): 매진 시각(sold_out_at)이 생기면 추첨 시각 대신 매진 시각 기준으로 하루를 센다
 *   (지금은 매진 5분 뒤 추첨이라는 전제로 drawn_at 기준 — 매진 후 추첨이 안 된 상품은 마감 시간까지 남는다)
 */
export async function getListedRaffles(): Promise<RaffleProductResponse[]> {
  const [open, completed] = await Promise.all([
    getRaffleProducts('open'),
    getRaffleProducts('completed').catch(() => [] as RaffleProductResponse[]),
  ])
  const recent = completed.filter(p => p.drawn_at && isWithinSoldOutWindow(p))
  return [...open, ...recent].sort((a, b) => Number(isSoldOutRaffle(a)) - Number(isSoldOutRaffle(b)))
}

export function isWithinSoldOutWindow(p: RaffleProductResponse, now = Date.now()): boolean {
  return p.drawn_at != null && now - parseServerTime(p.drawn_at) < SOLD_OUT_VISIBLE_MS
}

// 목록에서 계속 보여줄지: 진행 중이면 마감 전까지, 추첨이 끝났으면 추첨 후 하루까지
export function isListedRaffleVisible(p: RaffleProductResponse, remainingSeconds: number, now = Date.now()): boolean {
  if (p.status === 'completed') return isWithinSoldOutWindow(p, now)
  return remainingSeconds > 0
}

export interface GroupedRaffleEntry {
  raffle_product_id: number
  product_name: string
  image_url: string | null
  status: 'open' | 'completed' | 'cancelled'
  ends_at: string
  totalTicketCount: number
  totalPointsSpent: number
  lastEnteredAt: string
  entryNumber: number
  entryNumbers: number[]
  winnerEntryNumber: number | null
  drawVideoUrl: string | null
}

// 같은 상품에 여러 번 응모한 경우, 상품 하나당 한 줄로 합쳐서 총 응모권 수를 보여주기 위한 집계
export function groupEntriesByProduct(entries: MyRaffleEntryResponse[]): GroupedRaffleEntry[] {
  const map = new Map<number, GroupedRaffleEntry>()

  for (const entry of entries) {
    const existing = map.get(entry.raffle_product_id)
    if (existing) {
      existing.totalTicketCount += entry.ticket_count
      existing.totalPointsSpent += entry.points_spent
      if (!existing.entryNumbers.includes(entry.entry_number)) existing.entryNumbers.push(entry.entry_number)
      if (entry.created_at > existing.lastEnteredAt) existing.lastEnteredAt = entry.created_at
    } else {
      map.set(entry.raffle_product_id, {
        raffle_product_id: entry.raffle_product_id,
        product_name: entry.product_name,
        image_url: entry.image_url,
        status: entry.status,
        ends_at: entry.ends_at,
        totalTicketCount: entry.ticket_count,
        totalPointsSpent: entry.points_spent,
        lastEnteredAt: entry.created_at,
        entryNumber: entry.entry_number,
        entryNumbers: [entry.entry_number],
        winnerEntryNumber: entry.winner_entry_number,
        drawVideoUrl: entry.draw_video_url,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.lastEnteredAt < b.lastEnteredAt ? 1 : -1))
}

export function isWinningEntry(item: GroupedRaffleEntry): boolean {
  return item.winnerEntryNumber != null && item.entryNumbers.includes(item.winnerEntryNumber)
}

/*
 * 마이페이지 응모 내역의 단계
 *  waiting      — 응모권이 아직 남아 있음 (참여 중 · 대기 중)
 *  drawPending  — 응모권 매진, 추첨 전 (참여 중 · 추첨 대기 중)
 *  resultReady  — 추첨 완료, 아직 결과 안 봄 (참여 중 · 당첨결과 확인하기)
 *  won / lost   — 결과 확인함 (참여했던 · 당첨 / 낙첨)
 *  failed       — 시간 내에 못 채움 (참여했던 · 응모실패)
 */
export type EntryPhase = 'waiting' | 'drawPending' | 'resultReady' | 'won' | 'lost' | 'failed'

export function getEntryPhase(
  item: GroupedRaffleEntry,
  product: RaffleProductResponse | undefined,
  resultChecked: boolean,
): EntryPhase {
  if (item.status === 'cancelled') return 'failed'
  if (item.status === 'completed') {
    // TODO(backend): 추첨 완료인데 당첨번호가 아직 없으면 결과가 나올 때까지 추첨 대기로 둔다
    if (item.winnerEntryNumber == null) return 'drawPending'
    if (!resultChecked) return 'resultReady'
    return isWinningEntry(item) ? 'won' : 'lost'
  }
  if (product) {
    if (product.remaining_slots <= 0) return 'drawPending'
    // 백엔드가 다음 조회 때 cancelled로 바꾸고 환급하지만, 그 전에 화면에 남아 있는 데이터를 위한 분기
    if (product.remaining_seconds <= 0) return 'failed'
  }
  return 'waiting'
}

export function isOngoingPhase(phase: EntryPhase): boolean {
  return phase === 'waiting' || phase === 'drawPending' || phase === 'resultReady'
}

// 매진 후 추첨까지 걸리는 시간 (백엔드: 매진 5분 뒤 자동 추첨)
export const DRAW_DELAY_MS = 5 * 60 * 1000
const SOLD_OUT_SEEN_KEY_PREFIX = 'raffleSoldOutSeen:'

/*
 * 추첨 예정 시각 (ms). 백엔드가 sold_out_at을 주면 그 기준, 아니면 이 브라우저가 매진을 처음 본 시각 기준(임시).
 * TODO(backend): sold_out_at 필드가 생기면 임시 기준은 쓰이지 않는다
 */
export function getDrawAt(product: RaffleProductResponse | undefined): number | null {
  if (!product || product.status !== 'open' || product.remaining_slots > 0) return null
  if (product.sold_out_at) return parseServerTime(product.sold_out_at) + DRAW_DELAY_MS
  try {
    const key = SOLD_OUT_SEEN_KEY_PREFIX + product.raffle_product_id
    let seen = Number(localStorage.getItem(key))
    if (!seen) {
      seen = Date.now()
      localStorage.setItem(key, String(seen))
    }
    return seen + DRAW_DELAY_MS
  } catch {
    return null
  }
}

// TODO(backend): "결과 확인함"을 서버에 저장하는 API가 생기면 교체 — 지금은 기기(브라우저)별로만 기억된다
const CHECKED_KEY_PREFIX = 'raffleResultChecked:'
export const RESULT_CHECKED_EVENT = 'raffle-result-checked'

function checkedKey(): string {
  return CHECKED_KEY_PREFIX + (localStorage.getItem('userId') ?? '')
}

export function getCheckedResultIds(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(checkedKey()) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is number => typeof v === 'number') : []
  } catch {
    return []
  }
}

export function markResultChecked(raffleProductId: number) {
  try {
    const ids = getCheckedResultIds()
    if (ids.includes(raffleProductId)) return
    localStorage.setItem(checkedKey(), JSON.stringify([...ids, raffleProductId]))
  } catch {
    // 저장이 막힌 환경(시크릿 모드 등)에서는 이번 화면에서만 반영된다
  }
  // 사이드바 배지처럼 같은 화면의 다른 곳도 바로 갱신되도록 알린다
  window.dispatchEvent(new Event(RESULT_CHECKED_EVENT))
}
