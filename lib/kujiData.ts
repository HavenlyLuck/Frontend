export interface KujiTier {
  grade: string
  title: string
  image: string | null
  count: number
  isTop: boolean
}

export interface KujiTicket {
  id: number
  grade: string
  status: 'available' | 'drawn'
}

export interface KujiProduct {
  id: string
  title: string
  banner: string
  description: string
  pricePerTicket: number
  totalTickets: number
  tiers: KujiTier[]
  tickets: KujiTicket[]
  // 라스트원상 — 판의 마지막 제비를 뽑은 사람에게 추가로 주는 상 (상위상이 다 나가도 남은 판에 메리트를 준다)
  lastOne?: KujiLastOne
}

export interface KujiLastOne {
  title: string
  image: string
}

// 시드 기반 의사난수 (상품마다 항상 같은 배치가 나오도록)
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0
  return h
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const LOWER_TIER_TEMPLATE: { grade: string; title: string; count: number }[] = [
  { grade: 'C', title: '미니 아크릴 스탠드', count: 5 },
  { grade: 'D', title: '캔뱃지 세트', count: 8 },
  { grade: 'E', title: '포스트카드 세트', count: 12 },
  { grade: 'F', title: '클리어파일', count: 15 },
  { grade: 'G', title: '스티커 세트', count: 18 },
  { grade: 'H', title: '코스터', count: 19 },
  { grade: 'I', title: '미니 파우치', count: 20 },
]

interface TopPrizeSeed {
  grade: string
  title: string
  image: string
  count: number
}

function buildProduct(
  id: string,
  title: string,
  banner: string,
  description: string,
  topPrizes: TopPrizeSeed[],
  preDrawnRatio: number,
  forceTopDrawn: { grade: string; drawnCount: number }[] = [],
  lowerTiers: { grade: string; title: string; count: number }[] = LOWER_TIER_TEMPLATE
): KujiProduct {
  const tiers: KujiTier[] = [
    ...topPrizes.map(t => ({ grade: t.grade, title: t.title, image: t.image, count: t.count, isTop: true })),
    ...lowerTiers.map(t => ({ grade: t.grade, title: t.title, image: null, count: t.count, isTop: false })),
  ]

  const bag: string[] = []
  tiers.forEach(t => {
    for (let i = 0; i < t.count; i++) bag.push(t.grade)
  })
  // 상품 구성 장수의 합 (기본 구성은 상위상 3 + 하위상 97 = 100장)
  const totalTickets = bag.length

  const rand = mulberry32(hashSeed(id))
  const shuffledGrades = shuffle(bag, rand)
  const drawOrder = shuffle(
    Array.from({ length: totalTickets }, (_, i) => i + 1),
    rand
  )

  const tickets: KujiTicket[] = shuffledGrades.map((grade, i) => ({
    id: i + 1,
    grade,
    status: 'available',
  }))

  const preDrawnCount = Math.round(totalTickets * preDrawnRatio)
  drawOrder.slice(0, preDrawnCount).forEach(ticketId => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) ticket.status = 'drawn'
  })

  forceTopDrawn.forEach(({ grade, drawnCount }) => {
    const gradeTickets = tickets.filter(t => t.grade === grade)
    gradeTickets.forEach(t => (t.status = 'available'))
    gradeTickets.slice(0, drawnCount).forEach(t => (t.status = 'drawn'))
  })

  return { id, title, banner, description, pricePerTicket: 10000, totalTickets, tiers, tickets }
}

export const kujiProducts: KujiProduct[] = [
  buildProduct(
    'naoya',
    '주술회전 나오야 젠인 쿠지',
    '/images/naoya.jpg',
    '주술회전 나오야 젠인 쿠지입니다. 총 100장 중 A상 1장, B상 2장의 프리미엄 피규어가 들어있습니다.',
    [
      { grade: 'A', title: '나오야 젠인 프리미엄 피규어', image: '/images/naoya.jpg', count: 1 },
      { grade: 'B', title: '고죠 사토루 피규어', image: '/images/demo-3.jpg', count: 2 },
    ],
    0.6,
    [{ grade: 'A', drawnCount: 1 }, { grade: 'B', drawnCount: 1 }]
  ),
  buildProduct(
    'onepiece',
    '원피스 A상 루피 쿠지',
    '/images/demo-5.jpg',
    '원피스 쿠지입니다. A상 루피 기어5 피규어, B상 조로 피규어가 준비되어 있습니다.',
    [
      { grade: 'A', title: '루피 기어5 피규어', image: '/images/demo-5.jpg', count: 1 },
      { grade: 'B', title: '조로 엔마 피규어', image: '/images/demo-4.jpg', count: 2 },
    ],
    0.45
  ),
  buildProduct(
    'kimetsu',
    '귀멸의 칼날 최애의 쿠지',
    '/images/demo-6.jpg',
    '귀멸의 칼날 쿠지입니다. A상 렌고쿠 쿄쥬로, B상 네즈코 피규어가 들어있습니다.',
    [
      { grade: 'A', title: '렌고쿠 쿄쥬로 피규어', image: '/images/demo-6.jpg', count: 1 },
      { grade: 'B', title: '네즈코 피규어', image: '/images/demo-7.jpg', count: 2 },
    ],
    0.3
  ),
  buildProduct(
    'dragonball',
    '드래곤볼 갓 오브 데스티니 쿠지',
    '/images/demo-7.jpg',
    '드래곤볼 쿠지입니다. A상 손오공 초사이어인, B상 베지터 피규어가 준비되어 있습니다.',
    [
      { grade: 'A', title: '손오공 초사이어인 피규어', image: '/images/demo-7.jpg', count: 1 },
      { grade: 'B', title: '베지터 피규어', image: '/images/demo-8.jpg', count: 2 },
    ],
    0.55
  ),
  buildProduct(
    'conan',
    '명탐정 코난 랜덤 쿠지',
    '/images/demo-8.jpg',
    '명탐정 코난 쿠지입니다. A상 코난 피규어, B상 괴도 키드 피규어가 들어있습니다.',
    [
      { grade: 'A', title: '코난 피규어', image: '/images/demo-8.jpg', count: 1 },
      { grade: 'B', title: '괴도 키드 피규어', image: '/images/demo-9.jpg', count: 2 },
    ],
    0.18
  ),
  buildProduct(
    'sanrio',
    '산리오 캐릭터즈 쿠지',
    '/images/demo-9.jpg',
    '산리오 캐릭터즈 쿠지입니다. A상 쿠로미 피규어, B상 시나모롤 피규어가 준비되어 있습니다.',
    [
      { grade: 'A', title: '쿠로미 피규어', image: '/images/demo-9.jpg', count: 1 },
      { grade: 'B', title: '시나모롤 피규어', image: '/images/demo-1.jpg', count: 2 },
    ],
    0.65
  ),
  // TODO: 뽑기·결과 연출 확인용 임시 쿠지 (상위상 1 + 하위상 4 = 5장) — 확인 끝나면 지운다 (kujiList.ts에도 있음)
  buildProduct(
    'test5',
    '[테스트] 5장 쿠지',
    '/images/demo-1.jpg',
    '뽑기와 결과 연출을 빠르게 확인하기 위한 테스트 쿠지예요. A상 1장, 하위상 4장으로 총 5장입니다.',
    [{ grade: 'A', title: '테스트 A상 피규어', image: '/images/demo-1.jpg', count: 1 }],
    0,
    [],
    [
      { grade: 'C', title: '캔뱃지', count: 2 },
      { grade: 'D', title: '스티커', count: 2 },
    ]
  ),
]

// 판별 라스트원상 (보통 좋은 피규어로 구성)
const LAST_ONES: Record<string, KujiLastOne> = {
  naoya: { title: '나오야 젠인 라스트원 스페셜 컬러 피규어', image: '/images/naoya.jpg' },
  onepiece: { title: '루피 기어5 라스트원 메탈릭 피규어', image: '/images/demo-5.jpg' },
  kimetsu: { title: '렌고쿠 쿄쥬로 라스트원 화염 이펙트 피규어', image: '/images/demo-6.jpg' },
  dragonball: { title: '손오공 라스트원 초사이어인 블루 피규어', image: '/images/demo-7.jpg' },
  conan: { title: '코난 & 괴도 키드 라스트원 세트 피규어', image: '/images/demo-8.jpg' },
  sanrio: { title: '쿠로미 라스트원 스페셜 피규어', image: '/images/demo-9.jpg' },
  test5: { title: '테스트 라스트원 피규어', image: '/images/demo-3.jpg' },
}
kujiProducts.forEach(p => { p.lastOne = LAST_ONES[p.id] })

export function getKujiProduct(id: string): KujiProduct | undefined {
  return kujiProducts.find(p => p.id === id)
}

// 제비판 조회·뽑기 확정은 lib/kujiBoard.ts (서버 API 자리)에서 한다
