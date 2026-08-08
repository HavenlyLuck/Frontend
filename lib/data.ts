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
    title: '주술회전 나오야 젠인 피규어',
    price: '120,000원',
    category: '피규어/굿즈',
    subcategory: '피규어',
    description: '미개봉 새제품입니다. 정품 박스 그대로 보관하였으며, 파손 없이 안전 포장하여 발송합니다.',
    image: '/images/naoya.jpg',
    emoji: '🎎',
    raffle: { totalSlots: 50, currentEntries: 38, remainingSeconds: 8 * 3600 + 24 * 60 + 31, urgent: true },
    specs: [
      { key: '시리즈', val: '주술회전' },
      { key: '캐릭터', val: '나오야 젠인' },
      { key: '재질', val: 'PVC' },
      { key: '높이', val: '약 25cm' },
      { key: '박스 상태', val: '미개봉' },
    ],
    relatedProducts: [
      { id: 'notebook', title: '귀멸의 칼날 렌고쿠 피규어', price: '135,000원', emoji: '🎎', views: 112, wishes: 24, badge: '🎟 응모 중' },
      { id: 'notebook', title: '원피스 루피 기어5 피규어', price: '98,000원', emoji: '🎎', views: 67, wishes: 14, badge: '🎟 응모 중' },
      { id: 'notebook', title: '원신 라이덴 쇼군 피규어', price: '150,000원', emoji: '🎎', views: 43, wishes: 9, badge: '판매 완료', sold: true },
      { id: 'notebook', title: '체인소맨 파워 피규어', price: '110,000원', emoji: '🎎', views: 79, wishes: 18, badge: '🎟 응모 중' },
    ],
    meta: { chats: 9, wishes: 21, views: 88, time: '5시간 전' },
    thumbs: ['/images/naoya.jpg', null, null],
    modalIcon: '🎎',
    relatedLabel: '이런 상품은 어때요',
  },
]

export function getProduct(id: string): Product | undefined {
  return products.find(p => p.id === id)
}
