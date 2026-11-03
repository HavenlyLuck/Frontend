'use client'

import { useEffect, useMemo, useState } from 'react'
import { MagnifyingGlassIcon, ReceiptIcon, ShoppingBagIcon, SquaresFourIcon, TicketIcon, XIcon } from '@phosphor-icons/react'
import { getMyPayments, type MyPaymentResponse, type PaymentOrderType } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { parseServerTime } from '@/lib/raffle'
import { formatKstDateTime, kstMonthKey as monthKey, monthLabel } from '@/lib/date'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 10

interface MonthGroup {
  key: string
  entries: MyPaymentResponse[]
}

// 결제 종류별 표시 — 아이콘 · 이름 · 수량 단위
const ORDER_KIND: Record<PaymentOrderType, { label: string; unit: string; Icon: typeof TicketIcon }> = {
  raffle_entry: { label: '응모권', unit: '장', Icon: TicketIcon },
  kuji_draw: { label: '쿠지', unit: '장', Icon: SquaresFourIcon },
  store_purchase: { label: '상점', unit: '개', Icon: ShoppingBagIcon },
}

// 내 카드 결제 내역 (응모권 · 쿠지 · 결제 상점, 환불된 것 포함)
function useMyPayments() {
  const [entries, setEntries] = useState<MyPaymentResponse[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    getValidSession().then(session => {
      if (!session) return
      getMyPayments(session.token)
        .then(res => { setEntries(res); setLoaded(true) })
        .catch(() => setLoaded(true))
    })
  }, [])
  return { entries, loaded }
}

export default function PurchaseHistoryPage() {
  const { entries, loaded } = useMyPayments()
  const [query, setQuery] = useState('')
  // 아무것도 안 고르면 이번 달만. 검색어가 있으면 고른 달과 상관없이 전체 기간에서 찾는다
  const thisMonth = useMemo(() => monthKey(new Date().toISOString()), [])
  const [pickedMonth, setPickedMonth] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const month = query.trim() ? 'all' : (pickedMonth ?? thisMonth)

  const sorted = useMemo(
    () => [...entries].sort((a, b) => parseServerTime(b.paid_at) - parseServerTime(a.paid_at)),
    [entries],
  )
  const months = useMemo(
    () => Array.from(new Set([thisMonth, ...sorted.map(e => monthKey(e.paid_at))])).sort().reverse(),
    [sorted, thisMonth],
  )

  const keyword = query.trim().toLowerCase()
  const filtered = useMemo(
    () => sorted.filter(e =>
      (month === 'all' || monthKey(e.paid_at) === month) &&
      (!keyword || e.product_name.toLowerCase().includes(keyword))),
    [sorted, month, keyword],
  )
  // 월 제목 옆 건수·합계는 그 달 전체 기준 (지금 페이지에 보이는 것만이 아니라)
  const monthTotals = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    for (const e of filtered) {
      const key = monthKey(e.paid_at)
      const t = map.get(key) ?? { count: 0, total: 0 }
      t.count += 1
      // 환불된 결제는 건수에는 넣되 합계에서는 뺀다
      if (e.status === 'paid') t.total += e.amount
      map.set(key, t)
    }
    return map
  }, [filtered])

  // 10건씩 나눠 보여주고, 그 페이지 안에서 다시 월별로 묶는다
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const groups = useMemo(() => {
    const map = new Map<string, MonthGroup>()
    for (const e of filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)) {
      const key = monthKey(e.paid_at)
      const group = map.get(key) ?? { key, entries: [] }
      group.entries.push(e)
      map.set(key, group)
    }
    return Array.from(map.values())
  }, [filtered, currentPage])

  const matchCount = filtered.length
  const filtering = keyword !== '' || pickedMonth !== null

  return (
    <>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><ReceiptIcon size={17} weight="fill" color="var(--accent)" /> 구매 내역</div>
      </div>

      {sorted.length === 0 ? (
        loaded && (
          <div className="coming-soon-box">
            <div className="desc">아직 구매 내역이 없어요.</div>
          </div>
        )
      ) : (
        <>
          <div className="purchase-toolbar">
            <label className="purchase-search">
              <MagnifyingGlassIcon size={15} color="var(--text-tertiary)" />
              <input
                type="search"
                placeholder="상품 이름으로 검색"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1) }}
              />
              {query && (
                <button type="button" aria-label="검색어 지우기" onClick={() => { setQuery(''); setPage(1) }}>
                  <XIcon size={14} />
                </button>
              )}
            </label>
            <select className="purchase-month" value={month} onChange={e => { setPickedMonth(e.target.value); setQuery(''); setPage(1) }} aria-label="월 선택">
              <option value="all">전체 기간</option>
              {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </div>

          {filtering && (
            <div className="purchase-result-count">
              {keyword ? <>‘{query.trim()}’ 검색 결과 </> : null}{matchCount}건
            </div>
          )}

          {groups.length === 0 ? (
            <div className="coming-soon-box">
              <div className="desc">{filtering ? '조건에 맞는 구매 내역이 없어요.' : '이번 달 구매 내역이 없어요.'}</div>
            </div>
          ) : (
            groups.map(group => (
              <section key={group.key} className="purchase-month-group">
                <div className="purchase-month-header">
                  <span className="purchase-month-title">{monthLabel(group.key)}</span>
                  <span className="purchase-month-summary">{monthTotals.get(group.key)?.count ?? 0}건 · {(monthTotals.get(group.key)?.total ?? 0).toLocaleString()}원</span>
                </div>
                <div className="entry-list">
                  {group.entries.map(entry => {
                    const kind = ORDER_KIND[entry.order_type]
                    const refunded = entry.status === 'refunded'
                    return (
                      <div key={entry.payment_id} className="entry-item" style={{ cursor: 'default' }}>
                        <div className="entry-emoji">
                          {entry.image_url ? <img src={entry.image_url} alt={entry.product_name} /> : <kind.Icon size={22} />}
                        </div>
                        <div className="entry-info">
                          <div className="entry-title">{entry.product_name}</div>
                          <div className="entry-meta">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <kind.Icon size={12} /> {kind.label} {entry.quantity}{kind.unit}
                            </span>
                            <span>{formatKstDateTime(entry.paid_at)}</span>
                          </div>
                        </div>
                        <div className="entry-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span
                            className={`status-badge ${refunded ? 'lose' : 'waiting'}`}
                            style={refunded ? { textDecoration: 'line-through' } : undefined}
                          >
                            {entry.amount.toLocaleString()}원
                          </span>
                          {refunded && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>환불됨</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))
          )}

          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} label="구매 내역 페이지" />
        </>
      )}
    </>
  )
}
