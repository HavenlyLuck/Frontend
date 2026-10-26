export type ProductType = '응모' | '쿠지' | '상점(일반)' | '상점(쌀포인트)'

// itemId: 재고 품목에서 고른 줄이면 그 품목 id (이름·사진·원가가 재고에서 채워진다)
export interface KujiItem { name: string; img: string; count: string; cost: string; itemId?: number }

export interface Product {
  id: number
  type: ProductType
  title: string
  price: string
  cost?: string
  img: string
  active: boolean
  stock: number
  maxTickets?: number
  ticketPrice?: string
  description?: string
  kujiItems?: KujiItem[] // 상위상
  lowerItems?: KujiItem[] // 하위상 (상품명·사진·개수·원가)
  lowerCount?: number // 하위상 총 장수
  lastOne?: { name: string; img: string; cost: string } // 라스트원상 (마지막 장을 뽑은 사람에게 추가로, 장수에는 안 들어감)
  deadlineLabel?: string
}

export const PRODUCT_TABS: ProductType[] = ['응모', '쿠지', '상점(일반)', '상점(쌀포인트)']
