// 쿠지 목록 카드 데이터 (홈 · 쿠지 목록 · 검색 결과가 같이 쓴다)
import { getKujiSets, type KujiSetResponse } from './api'

export interface KujiListItem {
  href: string
  img: string
  alt: string
  badge: string
  title: string
  price: string
  pct: number
  count: number
  max: number
  soldOut: boolean
}

export function toKujiListItem(ks: KujiSetResponse): KujiListItem {
  const drawn = ks.total_tickets - ks.remaining_tickets
  return {
    href: `/kuji/${ks.kuji_set_id}`,
    img: ks.image_url ?? '',
    alt: ks.title,
    badge: ks.status === 'open' ? '쿠지' : '매진',
    title: ks.title,
    price: `${ks.ticket_price.toLocaleString()} 운포인트 / 1장`,
    pct: ks.total_tickets > 0 ? Math.round((drawn / ks.total_tickets) * 100) : 0,
    count: drawn,
    max: ks.total_tickets,
    soldOut: ks.status !== 'open' || ks.remaining_tickets === 0,
  }
}

// 판매 중인 쿠지 먼저, 매진된 쿠지는 뒤로 (종료된 쿠지는 안 보인다)
export async function fetchKujiList(): Promise<KujiListItem[]> {
  const list = await getKujiSets()
  const items = list.filter(ks => ks.status !== 'closed').map(toKujiListItem)
  return [...items.filter(k => !k.soldOut), ...items.filter(k => k.soldOut)]
}
