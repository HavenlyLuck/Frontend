/*
 * 판매 기록 — 매출(카드 결제 금액)과 그때 나간 물건의 원가를 한 줄씩 남긴다.
 * 관리자 메인(매출 현황 · 일별 판매 내역)과 재고·자금 관리(손익)가 같이 쓴다.
 *
 *   매출 = 고객이 카드로 결제한 금액(원). 환불된 건은 빠진다. 쌀포인트로 산 건 매출 0.
 *   원가 = 판매 시점의 재고 평균 원가 × 나간 수량 (재고에서 "판매 완료"로 넘어갈 때 기록)
 *   응모는 추첨이 끝나 상품이 나가는 날, 쿠지·상점은 결제한 날로 잡는다.
 *
 * TODO(backend): 판매 기록 API(GET /admin/sales?from=&to=)가 생기면 아래 가짜 데이터를 지우고 서버 값을 쓴다.
 */

export type SaleType = '응모' | '쿠지' | '상점'

export interface SaleRecord {
  id: string
  date: string          // YYYY-MM-DD (한국 시간)
  type: SaleType
  pay: 'cash' | 'ssal'  // 카드 결제 / 쌀포인트
  title: string
  buyer: string
  revenue: number       // 카드 결제 금액(원). 쌀포인트 결제는 0
  ssalPrice: number     // 쌀포인트로 산 경우 쓴 쌀포인트
  cost: number          // 나간 물건의 원가 합계(원)
  itemId: number | null // 재고 품목
}

// 한국 시간 기준 오늘 YYYY-MM-DD
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getSales(): SaleRecord[] {
  return MOCK_SALES
}

// ── 가짜 데이터 (서버 API 생기면 지운다) ──
// 재고 관리 가짜 품목(lib/inventory.ts)과 같은 물건·원가로 맞춰 둠. 날짜마다 같은 결과가 나오게 시드 난수를 쓴다.
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const BUYERS = ['user_2847', 'user_1023', 'user_3391', 'user_0584', 'user_2210', 'user_1748', 'user_3902', 'user_0091']

function buildMockSales(): SaleRecord[] {
  const out: SaleRecord[] = []
  const today = todayKey()
  for (let back = 75; back >= 0; back--) {
    const date = shiftDate(today, -back)
    const rnd = seeded(Number(date.replace(/-/g, '')))
    const buyer = () => BUYERS[Math.floor(rnd() * BUYERS.length)]
    const push = (r: Omit<SaleRecord, 'id' | 'date' | 'buyer'>) => out.push({ ...r, id: `${date}-${out.length}`, date, buyer: buyer() })

    // 쿠지 — 하루 몇 장씩 (1장 10,000원, 하위상 캔뱃지·아크릴)
    const kuji = Math.floor(rnd() * 6)
    for (let i = 0; i < kuji; i++) {
      const acrylic = rnd() < 0.5
      push({ type: '쿠지', pay: 'cash', title: '[쿠지] 주술회전 1장', revenue: 10000, ssalPrice: 0, cost: acrylic ? 2300 : 1800, itemId: acrylic ? 4 : 3 })
    }
    // 결제 상점 — 카드팩
    if (rnd() < 0.45) {
      const qty = 1 + Math.floor(rnd() * 3)
      push({ type: '상점', pay: 'cash', title: `포켓몬 카드 151 부스터팩 ×${qty}`, revenue: 7000 * qty, ssalPrice: 0, cost: 4500 * qty, itemId: 5 })
    }
    // 쌀포인트 상점 — 매출 없이 원가만 나감
    if (rnd() < 0.35) {
      push({ type: '상점', pay: 'ssal', title: '[쌀포인트] 귀멸의 칼날 캔뱃지', revenue: 0, ssalPrice: 10000, cost: 1800, itemId: 3 })
    }
    // 응모 — 가끔 매진 → 추첨 끝나고 상품이 나가는 날 30장(30,000원) 매출
    if (rnd() < 0.12) {
      push({ type: '응모', pay: 'cash', title: '[응모] 원피스 루피 기어5 피규어', revenue: 30000, ssalPrice: 0, cost: 23500, itemId: 1 })
    }
  }
  return out
}

const MOCK_SALES = buildMockSales()
