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


interface TierSeed {
  grade: string
  title: string
  count: number
  image?: string
}

// 상위상·하위상 구성으로 제비판을 만든다 (등급은 시드로 섞어서, 같은 id면 항상 같은 배치)
function buildProduct(
  id: string,
  title: string,
  banner: string,
  description: string,
  topPrizes: TierSeed[],
  lowerTiers: TierSeed[],
  lastOne?: KujiLastOne,
): KujiProduct {
  const tiers: KujiTier[] = [
    ...topPrizes.map(t => ({ grade: t.grade, title: t.title, image: t.image ?? null, count: t.count, isTop: true })),
    ...lowerTiers.map(t => ({ grade: t.grade, title: t.title, image: t.image ?? null, count: t.count, isTop: false })),
  ]

  const bag: string[] = []
  tiers.forEach(t => {
    for (let i = 0; i < t.count; i++) bag.push(t.grade)
  })

  const shuffledGrades = shuffle(bag, mulberry32(hashSeed(id)))
  const tickets: KujiTicket[] = shuffledGrades.map((grade, i) => ({ id: i + 1, grade, status: 'available' }))

  return { id, title, banner, description, pricePerTicket: 10000, totalTickets: bag.length, tiers, tickets, lastOne }
}

/*
 * 쿠지 목록 — 실제 쿠지는 백엔드 쿠지 API에서 받아온다(연결 예정).
 * 지금 남은 건 뽑기·결과 연출을 화면에서 확인하기 위한 테스트 쿠지 하나 (kujiList.ts에도 있음).
 * TODO(backend): 쿠지 API가 연결되면 이 파일은 테스트 쿠지만 남기거나 통째로 정리한다
 */
export const kujiProducts: KujiProduct[] = [
  buildProduct(
    'test5',
    '[테스트] 5장 쿠지',
    '/images/demo-1.jpg',
    '뽑기와 결과 연출을 빠르게 확인하기 위한 테스트 쿠지예요. A상 1장, 하위상 4장으로 총 5장입니다.',
    [{ grade: 'A', title: '테스트 A상 피규어', image: '/images/demo-1.jpg', count: 1 }],
    [
      { grade: 'C', title: '캔뱃지', count: 2 },
      { grade: 'D', title: '스티커', count: 2 },
    ],
    { title: '테스트 라스트원 피규어', image: '/images/demo-3.jpg' },
  ),
]

export function getKujiProduct(id: string): KujiProduct | undefined {
  return kujiProducts.find(p => p.id === id)
}

// 제비판 조회·뽑기 확정은 lib/kujiBoard.ts (서버 API 자리)에서 한다