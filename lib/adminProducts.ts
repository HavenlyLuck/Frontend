export type ProductType = '응모' | '쿠지' | '상점(일반)' | '상점(쌀포인트)'

// itemId: 등록 상품에서 고른 줄이면 그 상품 id (이름·사진이 채워진다)
// kind 'point': 하위상 쌀포인트 — 실물 대신 points만큼 쌀포인트를 바로 적립 (이름은 "쌀포인트 500P"로 자동)
export interface KujiItem { name: string; img: string; count: string; itemId?: number; kind?: 'item' | 'point'; points?: string }

export interface Product {
  id: number
  type: ProductType
  title: string
  price: string
  img: string
  active: boolean
  stock: number
  maxTickets?: number
  ticketPrice?: string
  description?: string
  kujiItems?: KujiItem[] // 상위상
  lowerItems?: KujiItem[] // 하위상 (상품명·사진·개수)
  lowerCount?: number // 하위상 총 장수
  lastOne?: { name: string; img: string } // 라스트원상 (마지막 장을 뽑은 사람에게 추가로, 장수에는 안 들어감)
  deadlineLabel?: string
}

export const PRODUCT_TABS: ProductType[] = ['응모', '쿠지', '상점(일반)', '상점(쌀포인트)']
