export interface ShopRelatedProduct {
  id: string
  title: string
  price: string
  image: string | null
  emoji?: string
  views: number
  wishes: number
  soldOut?: boolean
}

export interface ShopProduct {
  id: string
  title: string
  category: string
  subcategory: string
  description: string
  image: string | null
  emoji?: string
  currency: '운포인트' | '쌀포인트'
  price: number
  stock: number
  meta: { views: number; wishes: number; chats: number; time: string }
  relatedProducts: ShopRelatedProduct[]
}

export const shopProducts: ShopProduct[] = [
  {
    id: 'sticker-set',
    title: '캐릭터 굿즈 스티커 세트',
    category: '운포인트 상점',
    subcategory: '굿즈',
    description: '인기 캐릭터 스티커 12종 세트입니다. 방수 코팅 처리되어 있어 텀블러, 노트북 등에 붙이기 좋습니다.',
    image: '/images/demo-1.jpg',
    currency: '운포인트',
    price: 12000,
    stock: 15,
    meta: { views: 19, wishes: 2, chats: 0, time: '1일 전' },
    relatedProducts: [],
  },
  {
    id: 'acrylic-stand',
    title: '인기 캐릭터 아크릴 스탠드',
    category: '운포인트 상점',
    subcategory: '굿즈',
    description: '고화질 인쇄의 아크릴 스탠드입니다. 전용 받침대가 포함되어 있어 바로 장식할 수 있습니다.',
    image: '/images/demo-2.jpg',
    currency: '운포인트',
    price: 18000,
    stock: 8,
    meta: { views: 31, wishes: 6, chats: 1, time: '2일 전' },
    relatedProducts: [],
  },
  {
    id: 'mini-figure',
    title: '데스크용 미니 피규어',
    category: '운포인트 상점',
    subcategory: '피규어',
    description: '책상 위에 두기 좋은 미니 사이즈 피규어입니다. 높이 약 8cm, PVC 재질입니다.',
    image: '/images/demo-4.jpg',
    currency: '운포인트',
    price: 25000,
    stock: 0,
    meta: { views: 27, wishes: 4, chats: 0, time: '3일 전' },
    relatedProducts: [],
  },
  {
    id: 'ps5-controller',
    title: 'PS5 듀얼센스 무선 컨트롤러',
    category: '운포인트 상점',
    subcategory: '게임기기',
    description: '정품 미개봉 PS5 듀얼센스 무선 컨트롤러입니다. 정식 수입 제품이며 KC 인증을 받았습니다.',
    image: '/images/ps5.jpg',
    currency: '운포인트',
    price: 78000,
    stock: 3,
    meta: { views: 45, wishes: 11, chats: 3, time: '5시간 전' },
    relatedProducts: [],
  },
  {
    id: 'iphone-case',
    title: '아이폰 14 Pro 투명 케이스',
    category: '운포인트 상점',
    subcategory: '액세서리',
    description: '아이폰 14 Pro 전용 투명 젤리 케이스입니다. 카메라 보호 턱이 있어 렌즈 스크래치를 방지합니다.',
    image: '/images/iphone14pro.jpg',
    currency: '운포인트',
    price: 15000,
    stock: 12,
    meta: { views: 22, wishes: 3, chats: 0, time: '1일 전' },
    relatedProducts: [],
  },
  {
    id: 'figure-case',
    title: '피규어 먼지방지 진열 케이스',
    category: '운포인트 상점',
    subcategory: '진열용품',
    description: '피규어를 먼지와 자외선으로부터 보호하는 투명 아크릴 진열 케이스입니다.',
    image: '/images/demo-3.jpg',
    currency: '운포인트',
    price: 9000,
    stock: 5,
    meta: { views: 16, wishes: 1, chats: 0, time: '4일 전' },
    relatedProducts: [],
  },
  {
    id: 'rice-special',
    title: '쌀포인트 특별 상품',
    category: '쌀포인트 상점',
    subcategory: '특별상품',
    description: '쌀포인트로만 구매할 수 있는 특별 상품입니다.',
    image: null,
    emoji: '🌾',
    currency: '쌀포인트',
    price: 10000,
    stock: 20,
    meta: { views: 5, wishes: 1, chats: 0, time: '1주일 전' },
    relatedProducts: [],
  },
]

shopProducts.forEach(p => {
  p.relatedProducts = shopProducts
    .filter(o => o.id !== p.id && o.currency === p.currency)
    .slice(0, 4)
    .map(o => ({
      id: o.id,
      title: o.title,
      price: `${o.price.toLocaleString()} ${o.currency}`,
      image: o.image,
      emoji: o.emoji,
      views: o.meta.views,
      wishes: o.meta.wishes,
      soldOut: o.stock === 0,
    }))
})

export function getShopProduct(id: string): ShopProduct | undefined {
  return shopProducts.find(p => p.id === id)
}
