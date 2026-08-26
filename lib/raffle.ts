import type { MyRaffleEntryResponse } from './api'

export interface GroupedRaffleEntry {
  raffle_product_id: number
  product_name: string
  image_url: string | null
  status: 'open' | 'completed' | 'cancelled'
  ends_at: string
  totalTicketCount: number
  totalPointsSpent: number
  lastEnteredAt: string
}

// 같은 상품에 여러 번 응모한 경우, 상품 하나당 한 줄로 합쳐서 총 응모권 수를 보여주기 위한 집계
export function groupEntriesByProduct(entries: MyRaffleEntryResponse[]): GroupedRaffleEntry[] {
  const map = new Map<number, GroupedRaffleEntry>()

  for (const entry of entries) {
    const existing = map.get(entry.raffle_product_id)
    if (existing) {
      existing.totalTicketCount += entry.ticket_count
      existing.totalPointsSpent += entry.points_spent
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
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.lastEnteredAt < b.lastEnteredAt ? 1 : -1))
}
