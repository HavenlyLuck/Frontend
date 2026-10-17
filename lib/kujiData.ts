import { getKujiSet, type KujiSetResponse } from './api'
import { getTestKujiSet, isTestKuji } from './kujiTest'

export interface KujiTier {
  grade: string
  title: string
  image: string | null
  count: number
  isTop: boolean
}

export interface KujiProduct {
  id: number
  title: string
  banner: string
  description: string
  pricePerTicket: number
  totalTickets: number
  // 판매 중인지 (매진·종료면 false)
  open: boolean
  tiers: KujiTier[]
  // 라스트원상 — 판의 마지막 제비를 뽑은 사람에게 추가로 주는 상 (상위상이 다 나가도 남은 판에 메리트를 준다)
  lastOne?: KujiLastOne
}

export interface KujiLastOne {
  title: string
  image: string
}

// 서버 쿠지 → 상세 화면용. 어떤 번호에 어떤 상품이 들었는지는 서버만 안다 (제비판은 lib/kujiBoard.ts)
export function toKujiProduct(ks: KujiSetResponse): KujiProduct {
  return {
    id: ks.kuji_set_id,
    title: ks.title,
    banner: ks.image_url ?? '',
    description: ks.description ?? '',
    pricePerTicket: ks.ticket_price,
    totalTickets: ks.total_tickets,
    open: ks.status === 'open' && ks.remaining_tickets > 0,
    tiers: ks.prizes.map(p => ({ grade: p.grade, title: p.name, image: p.image_url, count: p.quantity, isTop: p.tier === 'upper' })),
    lastOne: ks.last_one_name ? { title: ks.last_one_name, image: ks.last_one_image_url ?? ks.image_url ?? '' } : undefined,
  }
}

// 없는 쿠지면 null
export async function fetchKujiProduct(id: number): Promise<KujiProduct | null> {
  if (isTestKuji(id)) return toKujiProduct(getTestKujiSet())
  if (!Number.isInteger(id) || id <= 0) return null
  try {
    return toKujiProduct(await getKujiSet(id))
  } catch {
    return null
  }
}
