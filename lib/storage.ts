export interface StorageItem {
  id: string
  img: string | null
  emoji?: string
  title: string
  source: '당첨' | '구매'
  date: string
  value: string
  status: 'ready' | 'requested'
}

export const STORAGE_ITEMS: StorageItem[] = [
  { id: '1', img: '/images/naoya.jpg', title: '주술회전 나오야 젠인 피규어', source: '당첨', date: '2026-08-05', value: '120,000원', status: 'ready' },
  { id: '2', img: '/images/demo-3.jpg', title: '귀멸의 칼날 렌고쿠 피규어', source: '당첨', date: '2026-08-02', value: '135,000원', status: 'ready' },
  { id: '3', img: '/images/demo-4.jpg', title: '에어팟 프로 2세대', source: '구매', date: '2026-07-28', value: '180,000원', status: 'ready' },
  { id: '4', img: '/images/ps5.jpg', title: '플레이스테이션 5 디스크 에디션', source: '당첨', date: '2026-07-14', value: '450,000원', status: 'requested' },
]

export function getReadyStorageCount(): number {
  return STORAGE_ITEMS.filter(i => i.status === 'ready').length
}

export function addStorageItem(item: StorageItem) {
  STORAGE_ITEMS.unshift(item)
}
