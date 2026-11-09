'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { GrainsIcon } from '@phosphor-icons/react'
import { getMyPointTransactions, type PointTransactionReason, type PointTransactionResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { useMyPoints } from '@/hooks/useMyPoints'
import { parseServerTime } from '@/lib/raffle'
import { formatKstDateTime, kstMonthKey, monthLabel } from '@/lib/date'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 10

const REASON_LABEL: Record<PointTransactionReason, string> = {
  store_purchase: '상점 구매',
  avatar_purchase: '아바타 아이템 구매',
  raffle_consolation: '낙첨 보상',
  admin_grant: '포인트 지급',
}

type Filter = 'all' | 'earn' | 'spend'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'earn', label: '적립' },
  { id: 'spend', label: '사용' },
]
const EMPTY_TEXT: Record<Filter, string> = {
  all: '아직 쌀포인트 내역이 없어요.',
  earn: '적립된 쌀포인트가 없어요.',
  spend: '사용한 쌀포인트가 없어요.',
}

export default function PointHistoryPage() {
  const { ssalPoint } = useMyPoints()
  const [transactions, setTransactions] = useState<PointTransactionResponse[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (!session || cancelled) return
      getMyPointTransactions(session.token)
        .then((list) => { if (!cancelled) setTransactions(list) })
        .catch(() => { if (!cancelled) setFailed(true) })
        .finally(() => { if (!cancelled) setLoaded(true) })
    })
    return () => { cancelled = true }
  }, [])

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => parseServerTime(b.created_at) - parseServerTime(a.created_at)),
    [transactions],
  )
  const earned = sorted.filter(t => t.amount > 0).reduce((n, t) => n + t.amount, 0)
  const spent = sorted.filter(t => t.amount < 0).reduce((n, t) => n - t.amount, 0)

  const filtered = useMemo(
    () => sorted.filter(t => filter === 'all' || (filter === 'earn' ? t.amount > 0 : t.amount < 0)),
    [sorted, filter],
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)

  // 10건씩 나눠 보여주고, 그 페이지 안에서 다시 월별로 묶는다
  const groups = useMemo(() => {
    const map = new Map<string, PointTransactionResponse[]>()
    for (const t of filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)) {
      const key = kstMonthKey(t.created_at)
      map.set(key, [...(map.get(key) ?? []), t])
    }
    return Array.from(map.entries())
  }, [filtered, currentPage])

  return (
    <>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><GrainsIcon size={17} weight="fill" color="var(--accent)" /> 쌀포인트 내역</div>
      </div>

      <div className="points-summary" style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <div className="summary-card" style={{ flex: 1, textAlign: 'center', cursor: 'default' }}>
          <div className="summary-value" style={{ color: 'var(--gold)' }}>{ssalPoint.toLocaleString()}<span>P</span></div>
          <div className="summary-label">보유 쌀포인트</div>
        </div>
        <div className="summary-card" style={{ flex: 1, textAlign: 'center', cursor: 'default' }}>
          <div className="summary-value">{earned.toLocaleString()}<span>P</span></div>
          <div className="summary-label">총 적립</div>
        </div>
        <div className="summary-card" style={{ flex: 1, textAlign: 'center', cursor: 'default' }}>
          <div className="summary-value">{spent.toLocaleString()}<span>P</span></div>
          <div className="summary-label">총 사용</div>
        </div>
      </div>

      <div className="entry-filter-tabs" role="tablist" aria-label="쌀포인트 내역 보기">
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`entry-filter-tab${filter === f.id ? ' active' : ''}`}
            onClick={() => { setFilter(f.id); setPage(1) }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loaded ? null : failed ? (
        <div className="coming-soon-box">
          <div className="desc">쌀포인트 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="coming-soon-box">
          <div className="desc">{EMPTY_TEXT[filter]}</div>
          {filter !== 'earn' && sorted.length === 0 && (
            <Link href="/shop" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: 'var(--accent)' }}>쌀포인트 상점 둘러보기 →</Link>
          )}
        </div>
      ) : (
        groups.map(([key, list]) => (
          <section key={key} className="purchase-month-group">
            <div className="purchase-month-header">
              <span className="purchase-month-title">{monthLabel(key)}</span>
            </div>
            <div className="entry-list">
              {list.map(t => {
                const earn = t.amount > 0
                return (
                  <div key={t.transaction_id} className="entry-item" style={{ cursor: 'default' }}>
                    <div className="entry-emoji" style={{ color: earn ? 'var(--gold)' : 'var(--text-tertiary)' }}>
                      <GrainsIcon size={22} weight="fill" />
                    </div>
                    <div className="entry-info">
                      <div className="entry-title">{t.description || REASON_LABEL[t.reason]}</div>
                      <div className="entry-meta">
                        <span>{REASON_LABEL[t.reason]}</span>
                        <span>{formatKstDateTime(t.created_at)}</span>
                      </div>
                    </div>
                    <div className="entry-status">
                      <div style={{ fontSize: 15, fontWeight: 700, color: earn ? 'var(--gold)' : 'var(--text)' }}>
                        {earn ? '+' : '−'}{Math.abs(t.amount).toLocaleString()}P
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        잔액 {t.balance_after.toLocaleString()}P
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} label="쌀포인트 내역 페이지" />
    </>
  )
}
