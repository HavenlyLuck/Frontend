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

// 당첨/구매 상품을 보관하는 백엔드 기능이 아직 없어 항상 빈 배열로 시작한다.
export const STORAGE_ITEMS: StorageItem[] = []

export function getReadyStorageCount(): number {
  return STORAGE_ITEMS.filter(i => i.status === 'ready').length
}

export function addStorageItem(item: StorageItem) {
  STORAGE_ITEMS.unshift(item)
}
