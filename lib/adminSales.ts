import { getLedger, type LedgerOutflow, type LedgerRound, type LedgerSale } from './api'
import { shiftDate, todayKey } from './sales'

/*
 * 관리자 판매 현황 — 판매 기록(결제 1건 = 한 줄), 상품별 팔린 개수, 등록 상품별 남은 재고.
 *
 * 서버의 재고 품목 계산(GET /inventory/items의 sold · available)은 예전 "재고 연결" 방식만 세서,
 * 게시할 때 등록 상품을 고르는 지금 방식(상품의 catalog_item_id)으로 올린 상품은 팔려도 0으로 나온다.
 * 그래서 주간 장부 API(GET /admin/ledger)의 기록으로 직접 센다 — 장부는 두 방식을 모두 본다.
 *   나간 수(등록 상품별) = outflows의 quantity 합 (응모 당첨 · 쿠지 · 상점 판매 · 쌀포인트 상점,
 *                          구매 취소 반품과 보관 기한 전환은 음수라 다시 재고로 돌아온다)
 *   상점 상품 팔린 개수   = rounds의 store-{id} tickets_sold
 *   판매 기록            = sales 중 확정된 것(환불 · 구매 취소 제외)
 * TODO(백엔드): 서버 재고 계산이 catalog_item_id도 세게 되면 재고는 /inventory/items만 쓰면 된다.
 */

// 서비스 준비를 시작한 뒤부터 센다 (장부 API는 한 번에 1년까지만 줘서 나눠 부른다)
const SALES_START = '2026-09-01'
const MAX_SPAN_DAYS = 365

// 판매완료 탭 한 줄 — 같은 상품이 또 팔려도 합치지 않고 결제마다 따로
export interface SaleLogEntry {
  id: string
  at: string                 // UTC
  kind: 'kuji' | 'store_cash' | 'store_ssal'
  productId: number | null   // 쿠지 세트 id / 상점 상품 id
  title: string
  quantity: number           // 쿠지: 뽑은 장수, 상점: 산 개수
  amountKrw: number
  amountSsal: number
  prizes: string[]           // 쿠지: 이 결제로 나간 상 ("B상 1", "쌀포인트 상 2", "라스트원상")
}

export interface SalesSnapshot {
  outByCatalog: Map<number, number>     // 등록 상품 id → 지금까지 나간 개수
  storeSold: Map<number, number>        // 상점 상품 id → 팔린 개수
  log: SaleLogEntry[]                   // 최신순
}

async function fetchAll(token: string) {
  const today = todayKey()
  const sales: LedgerSale[] = []
  const outflows: LedgerOutflow[] = []
  const rounds = new Map<string, LedgerRound>()
  for (let from = SALES_START; from <= today; from = shiftDate(from, MAX_SPAN_DAYS + 1)) {
    const end = shiftDate(from, MAX_SPAN_DAYS)
    const data = await getLedger(token, from, end < today ? end : today)
    sales.push(...data.sales)
    outflows.push(...data.outflows)
    // 회차 숫자(팔린 개수 등)는 기간과 상관없이 지금 값이라 나중 것으로 덮어도 같다
    for (const r of data.rounds) rounds.set(r.round_id, r)
  }
  return { sales, outflows, rounds: [...rounds.values()] }
}

const roundNumber = (roundId: string | null, prefix: string) =>
  roundId?.startsWith(`${prefix}-`) ? Number(roundId.slice(prefix.length + 1)) : null

// 쿠지 결제마다 나간 상 — 상은 결제가 확정되는 순간 보관함에 들어가므로, 같은 판에서 시각이 가장 가까운 결제에 붙인다.
// 쌀포인트 상은 실물이 아니라 장부의 "물건 나감"에 없다 → 뽑은 장수 − 실물 상 개수
function kujiPrizes(kujiSales: LedgerSale[], outflows: LedgerOutflow[]): Map<string, string[]> {
  const won = new Map<string, Map<string, number>>()
  const ms = (s: string) => new Date(s).getTime()
  for (const o of outflows) {
    if (o.reason !== 'kuji_prize' && o.reason !== 'kuji_last_one') continue
    let best: LedgerSale | null = null
    for (const s of kujiSales) {
      if (s.round_id !== o.round_id) continue
      if (!best || Math.abs(ms(s.at) - ms(o.at)) < Math.abs(ms(best.at) - ms(o.at))) best = s
    }
    if (!best || Math.abs(ms(best.at) - ms(o.at)) > 10 * 60 * 1000) continue
    const grade = o.reason === 'kuji_last_one' ? '라스트원상' : o.item_name.split(' ')[0]
    const counts = won.get(best.id) ?? new Map<string, number>()
    counts.set(grade, (counts.get(grade) ?? 0) + o.quantity)
    won.set(best.id, counts)
  }
  const out = new Map<string, string[]>()
  for (const s of kujiSales) {
    const counts = won.get(s.id) ?? new Map<string, number>()
    const lastOne = counts.get('라스트원상') ?? 0
    counts.delete('라스트원상')
    const physical = [...counts.values()].reduce((n, v) => n + v, 0)
    const labels = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([g, n]) => `${g} ${n}`)
    if (s.tickets > physical) labels.push(`쌀포인트 상 ${s.tickets - physical}`)
    if (lastOne > 0) labels.push('라스트원상')
    out.set(s.id, labels)
  }
  return out
}

export async function fetchSalesSnapshot(token: string): Promise<SalesSnapshot> {
  const { sales, outflows, rounds } = await fetchAll(token)

  const outByCatalog = new Map<number, number>()
  for (const o of outflows) {
    if (o.catalog_item_id == null) continue
    outByCatalog.set(o.catalog_item_id, (outByCatalog.get(o.catalog_item_id) ?? 0) + o.quantity)
  }

  const storeSold = new Map<number, number>()
  for (const r of rounds) {
    const id = roundNumber(r.round_id, 'store')
    if (id != null) storeSold.set(id, r.tickets_sold)
  }

  const done = sales.filter(s => s.status !== 'refunded')
  const kujiSales = done.filter(s => s.kind === 'kuji')
  const prizes = kujiPrizes(kujiSales, outflows)
  const log: SaleLogEntry[] = done
    .filter((s): s is LedgerSale & { kind: SaleLogEntry['kind'] } => s.kind === 'kuji' || s.kind === 'store_cash' || s.kind === 'store_ssal')
    .map(s => ({
      id: s.id,
      at: s.at,
      kind: s.kind,
      productId: roundNumber(s.round_id, s.kind === 'kuji' ? 'kuji' : 'store'),
      title: s.title,
      quantity: s.tickets,
      amountKrw: s.amount_krw,
      amountSsal: s.amount_ssal,
      prizes: prizes.get(s.id) ?? [],
    }))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))

  return { outByCatalog, storeSold, log }
}

// 판매 시각을 한국 시간 "11/28 14:03"으로 (서버 시각은 UTC, 시간대 표시 없이 올 수 있다)
export function formatSaleTime(at: string): string {
  const utc = /Z$|[+-]\d\d:?\d\d$/.test(at) ? at : `${at}Z`
  const d = new Date(new Date(utc).getTime() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}
