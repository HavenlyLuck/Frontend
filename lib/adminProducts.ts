export type ProductType = '응모' | '쿠지' | '상점(일반)' | '상점(쌀포인트)'

export interface KujiItem { name: string; img: string; count: string; cost: string }

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

export const PRODUCTS: Product[] = [
  { id: 4, type: '쿠지', title: '주술회전 나오야 젠인 쿠지', price: '10,000원', img: '/images/naoya.jpg', active: true, stock: 2, maxTickets: 50, ticketPrice: '10,000원' },
  { id: 5, type: '쿠지', title: '원피스 A상 루피 쿠지', price: '10,000원', img: '/images/demo-5.jpg', active: true, stock: 1, maxTickets: 50, ticketPrice: '10,000원' },
]

export function addProduct(product: Product) {
  PRODUCTS.unshift(product)
}

export function removeProduct(id: number) {
  const idx = PRODUCTS.findIndex(p => p.id === id)
  if (idx !== -1) PRODUCTS.splice(idx, 1)
}

export function toggleProductActive(id: number) {
  const product = PRODUCTS.find(p => p.id === id)
  if (product) product.active = !product.active
}
