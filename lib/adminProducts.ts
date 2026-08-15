export type ProductType = '응모' | '쿠지' | '상점(운포인트)' | '상점(쌀포인트)'

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
  durationDays?: number
  kujiItems?: KujiItem[]
  lowerCount?: number
}

export const PRODUCT_TABS: ProductType[] = ['응모', '쿠지', '상점(운포인트)', '상점(쌀포인트)']
export const TAB_EMOJI: Record<ProductType, string> = { '응모': '🎟', '쿠지': '🎁', '상점(운포인트)': '🎰', '상점(쌀포인트)': '🌾' }

export const PRODUCTS: Product[] = [
  { id: 1, type: '응모', title: '아이폰 14 Pro 256GB 스페이스 블랙', price: '650,000 운포인트', img: '/images/iphone14pro.jpg', active: true, stock: 3, maxTickets: 50, ticketPrice: '1,000 운포인트' },
  { id: 2, type: '응모', title: '플레이스테이션 5 디스크 에디션', price: '450,000 운포인트', img: '/images/ps5.jpg', active: true, stock: 2, maxTickets: 50, ticketPrice: '1,000 운포인트' },
  { id: 3, type: '응모', title: '에어팟 프로 2세대', price: '180,000 운포인트', img: '/images/demo-4.jpg', active: true, stock: 5, maxTickets: 50, ticketPrice: '1,000 운포인트' },
  { id: 4, type: '쿠지', title: '주술회전 나오야 젠인 쿠지', price: '10,000 운포인트', img: '/images/naoya.jpg', active: true, stock: 2, maxTickets: 50, ticketPrice: '10,000 운포인트' },
  { id: 5, type: '쿠지', title: '원피스 A상 루피 쿠지', price: '10,000 운포인트', img: '/images/demo-5.jpg', active: true, stock: 1, maxTickets: 50, ticketPrice: '10,000 운포인트' },
  { id: 6, type: '상점(운포인트)', title: '캐릭터 굿즈 스티커 세트', price: '12,000 운포인트', img: '/images/demo-1.jpg', active: true, stock: 15 },
  { id: 7, type: '상점(운포인트)', title: '인기 캐릭터 아크릴 스탠드', price: '18,000 운포인트', img: '/images/demo-2.jpg', active: true, stock: 8 },
  { id: 9, type: '상점(운포인트)', title: '데스크용 미니 피규어', price: '25,000 운포인트', img: '/images/demo-4.jpg', active: true, stock: 0 },
  { id: 8, type: '상점(쌀포인트)', title: '쌀포인트 특별 상품', price: '10,000 쌀포인트', img: '', active: true, stock: 20 },
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
