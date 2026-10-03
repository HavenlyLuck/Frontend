import type { MyRaffleEntryResponse, RaffleProductResponse } from './api'

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
    // TODO(backend): 시간 초과 시 백엔드가 status를 cancelled로 바꿔주면 이 분기는 필요 없어진다
    if (product.remaining_seconds <= 0) return 'failed'
  }
  return 'waiting'
}

export function isOngoingPhase(phase: EntryPhase): boolean {
  return phase === 'waiting' || phase === 'drawPending' || phase === 'resultReady'
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
