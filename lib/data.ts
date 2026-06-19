export interface RelatedProduct {
  id: string
  title: string
  price: string
  emoji: string
  views: number
  wishes: number
  badge: string
  sold?: boolean
}

export interface Product {
  id: string
  title: string
  price: string
  category: string
  subcategory: string
  description: string
  image: string | null
  emoji: string
  seller: {
    name: string
    avatar: string
    rating: number
    trades: number
    location: string
  }
  raffle: {
    totalSlots: number
    currentEntries: number
    remainingSeconds: number
    urgent: boolean
  }
  specs?: { key: string; val: string }[]
  relatedProducts: RelatedProduct[]
  meta: { chats: number; wishes: number; views: number; time: string }
  thumbs: (string | null)[]
  modalIcon: string
  relatedLabel: string
}

export const products: Product[] = [
  {
    id: 'notebook',
    title: '노트북 LG 그램 17인치',
    price: '200,000원',
    category: '디지털/가전',
    subcategory: '노트북',
    description: '깨끗하게 사용했습니다. 구매 후 6개월 사용, 외관 스크래치 없음.\n배터리 상태 양호, 충전기 포함. 직거래 서울 강남구 가능합니다.',
    image: null,
    emoji: '💻',
    seller: { name: '갬블마켓', avatar: '🐔', rating: 4.9, trades: 12, location: '서울 강남구' },
    raffle: { totalSlots: 50, currentEntries: 19, remainingSeconds: 2 * 86400 + 14 * 3600 + 32 * 60 + 7, urgent: false },
    relatedProducts: [
      { id: 'iphone', title: '아이폰 14 Pro 256GB', price: '650,000원', emoji: '📱', views: 88, wishes: 12, badge: '🎟 응모 중' },
      { id: 'notebook', title: '에어팟 프로 2세대', price: '180,000원', emoji: '🎧', views: 55, wishes: 8, badge: '🎟 응모 중' },
      { id: 'notebook', title: '갤럭시 워치 6', price: '120,000원', emoji: '⌚', views: 31, wishes: 5, badge: '판매 완료', sold: true },
      { id: 'notebook', title: '닌텐도 스위치 OLED', price: '280,000원', emoji: '🎮', views: 67, wishes: 15, badge: '🎟 응모 중' },
    ],
    meta: { chats: 3, wishes: 7, views: 42, time: '3시간 전' },
    thumbs: [null, null, null],
    modalIcon: '🎟',
    relatedLabel: '판매한 상품',
  },
  {
    id: 'iphone',
    title: '아이폰 14 Pro 256GB\n스페이스 블랙',
    price: '650,000원',
    category: '디지털/가전',
    subcategory: '스마트폰',
    description: '자급제 구매 후 8개월 사용했습니다. 케이스 항상 착용하여 외관 깨끗합니다.\n배터리 잔량 91%, 정품 충전기 + 케이블 포함. 직거래 서울 마포구 가능.',
    image: '/images/iphone14pro.jpg',
    emoji: '📱',
    seller: { name: '테크마켓Pro', avatar: '🦊', rating: 4.8, trades: 47, location: '서울 마포구' },
    raffle: { totalSlots: 50, currentEntries: 38, remainingSeconds: 8 * 3600 + 24 * 60 + 31, urgent: true },
    specs: [
      { key: '모델', val: 'iPhone 14 Pro A2890' },
      { key: '저장용량', val: '256GB' },
      { key: '배터리', val: '91% (양호)' },
      { key: '색상', val: '스페이스 블랙' },
      { key: '개통 여부', val: '자급제 (미개통 가능)' },
    ],
    relatedProducts: [
      { id: 'notebook', title: '맥북 에어 M2 256GB', price: '850,000원', emoji: '💻', views: 112, wishes: 24, badge: '🎟 응모 중' },
      { id: 'notebook', title: '에어팟 맥스 실버', price: '320,000원', emoji: '🎧', views: 67, wishes: 14, badge: '🎟 응모 중' },
      { id: 'notebook', title: '애플워치 SE 2세대', price: '180,000원', emoji: '⌚', views: 43, wishes: 9, badge: '판매 완료', sold: true },
      { id: 'notebook', title: '아이패드 Pro 11인치', price: '560,000원', emoji: '🖥️', views: 79, wishes: 18, badge: '🎟 응모 중' },
    ],
    meta: { chats: 9, wishes: 21, views: 88, time: '5시간 전' },
    thumbs: ['/images/iphone14pro.jpg', null, null, null],
    modalIcon: '📱',
    relatedLabel: '판매자의 다른 상품',
  },
]

export function getProduct(id: string): Product | undefined {
  return products.find(p => p.id === id)
}
