export interface RaffleEntry {
  id: string
  href: string
  title: string
  image: string | null
  emoji?: string
  ticketCount: number
  price: string
  date: string
  status: 'ongoing' | 'won' | 'lost' | 'canceled'
  timeText?: string
  cancelReason?: string
}

export const RAFFLE_ENTRIES: RaffleEntry[] = [
  { id: '1', href: '/products/iphone', title: '주술회전 나오야 젠인 피규어', image: '/images/naoya.jpg', ticketCount: 2, price: '2,000 운포인트', date: '오늘', status: 'ongoing', timeText: '⏱ 8시간 남음' },
  { id: '2', href: '/products/notebook', title: '플레이스테이션 5 디스크 에디션', image: '/images/ps5.jpg', ticketCount: 2, price: '2,000 운포인트', date: '3일 전', status: 'ongoing', timeText: '⏳ 1일 남음' },
  { id: '3', href: '/products/notebook', title: '반다이 맥시매틱 젠인 나오야 피규어', image: '/images/naoya.jpg', ticketCount: 1, price: '1,000 운포인트', date: '어제', status: 'won' },
  { id: '4', href: '/products/notebook', title: '에어팟 프로 2세대', image: '/images/demo-4.jpg', ticketCount: 1, price: '1,000 운포인트', date: '5일 전', status: 'lost' },
  { id: '5', href: '/products/notebook', title: '갤럭시 워치 6 클래식', image: '/images/demo-6.jpg', ticketCount: 1, price: '1,000 운포인트', date: '1주일 전', status: 'lost' },
  { id: '6', href: '/products/notebook', title: '닌텐도 스위치 OLED', image: '/images/demo-5.jpg', ticketCount: 1, price: '1,000 운포인트', date: '2주일 전', status: 'canceled', cancelReason: '참여 인원 부족으로 취소됨' },
]

export function getOngoingEntries(): RaffleEntry[] {
  return RAFFLE_ENTRIES.filter(e => e.status === 'ongoing')
}

export function getPastEntries(): RaffleEntry[] {
  return RAFFLE_ENTRIES.filter(e => e.status === 'won' || e.status === 'lost')
}

// 취소된 응모(내가 취소했거나 인원 부족으로 취소된 것)는 참여 횟수에서 제외
export function getParticipationCount(): number {
  return RAFFLE_ENTRIES.filter(e => e.status !== 'canceled').length
}

export function getWinCount(): number {
  return RAFFLE_ENTRIES.filter(e => e.status === 'won').length
}
