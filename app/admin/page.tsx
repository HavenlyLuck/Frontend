'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CaretRightIcon } from '@phosphor-icons/react'
import { getRaffleProducts, type RaffleProductResponse } from '@/lib/api'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import { fetchShippingBoxes } from '@/lib/adminShipping'
import { fetchPeriodFinance, todayKey, type PeriodFinance } from '@/lib/finance'

const won = (n: number) => `${n.toLocaleString()}원`
const DAY = 86400

// 관리자 홈 — 오늘 처리할 일과 매출을 한눈에. 각 줄을 누르면 그 화면으로 간다.
export default function AdminHomePage() {
  const token = useAdminToken()
  const [shipping, setShipping] = useState<number | null>(null)
  const [raffles, setRaffles] = useState<RaffleProductResponse[] | null>(null)
  const [month, setMonth] = useState<PeriodFinance | null>(null)
  const today = todayKey()

  useEffect(() => {
    fetchShippingBoxes(token, 'requested').then(b => setShipping(b.length)).catch(() => setShipping(0))
    getRaffleProducts('open').then(setRaffles).catch(() => setRaffles([]))
    fetchPeriodFinance(token, 'month', today.slice(0, 7)).then(setMonth).catch(() => setMonth(null))
  }, [token, today])

  const closingSoon = raffles?.filter(r => r.remaining_slots > 0 && r.remaining_seconds > 0 && r.remaining_seconds < DAY) ?? []
  const waitingDraw = raffles?.filter(r => r.remaining_slots <= 0) ?? []
  const todayRevenue = month?.sales.filter(s => s.date === today).reduce((n, s) => n + s.revenue, 0)
  const wonOrDots = (n: number | undefined) => (n == null ? '…' : won(n))

  const tasks = [
    {
      href: '/admin/shipping',
      count: shipping,
      unit: '건',
      label: '배송 대기',
      sub: '고객이 배송 신청한 박스 — 송장번호를 넣어 발송 처리해요',
      urgent: true,
    },
    {
      href: '/admin/products',
      count: raffles ? closingSoon.length : null,
      unit: '개',
      label: '마감 24시간 안 남은 응모',
      sub: closingSoon.length > 0
        ? `${closingSoon.slice(0, 2).map(r => `${r.product_name} ${r.sold_slots}/${r.total_slots}장`).join(' · ')}${closingSoon.length > 2 ? ' …' : ''} — 못 채우면 자동 취소·환불`
        : '못 채우면 자동 취소·환불돼요',
      urgent: true,
    },
    {
      href: '/admin/products',
      count: raffles ? waitingDraw.length : null,
      unit: '개',
      label: '추첨 대기 응모',
      sub: '매진된 응모 — 서버가 매진 1분 뒤 자동으로 추첨해요',
      urgent: false,
    },
  ]

  return (
    <div>
      <AdminPageHeader title="홈" description="오늘 처리할 일과 매출을 한눈에 봐요. 누르면 그 화면으로 가요." />

      <section style={{ marginBottom: 32 }}>
        <h2 className="admin-section-title">처리할 일</h2>
        <div className="admin-task-list">
          {tasks.map(t => {
            const active = (t.count ?? 0) > 0
            return (
              <Link key={t.label} href={t.href} className={`admin-task${active && t.urgent ? ' is-urgent' : ''}`}>
                <span className="admin-task-count" style={{ color: active ? (t.urgent ? 'var(--accent-fg)' : 'var(--text)') : 'var(--text-tertiary)' }}>
                  {t.count == null ? '…' : t.count}
                  <small>{t.unit}</small>
                </span>
                <span className="admin-task-body">
                  <span className="admin-task-label">{t.label}</span>
                  <span className="admin-task-sub">{t.sub}</span>
                </span>
                <CaretRightIcon size={16} className="admin-task-arrow" />
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <h2 className="admin-section-title">매출</h2>
        </div>
        <div className="admin-stat-grid">
          <Stat label="오늘 매출" value={wonOrDots(todayRevenue)} />
          <Stat label="이번 달 매출" value={wonOrDots(month?.summary.revenue)} />
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value" style={{ color: tone === 'good' ? 'var(--success)' : tone === 'bad' ? 'var(--danger)' : 'var(--text)' }}>{value}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </div>
  )
}
