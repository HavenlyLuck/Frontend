'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardTextIcon, CoinsIcon, PencilSimpleIcon } from '@phosphor-icons/react'
import { verifyAdmin, ApiError } from '@/lib/api'
import { getValidSession, clearAuth } from '@/lib/auth'
import { TODAY } from '@/lib/adminStats'
import {
  EXPENSE_RECORDS, addExpenseRecord, removeExpenseRecord,
  getPeriodSummary, getExpensesForPeriod, type Period, type ExpenseRecord,
} from '@/lib/finance'

const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '9px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'day', label: '일별' },
  { key: 'week', label: '주별' },
  { key: 'month', label: '월별' },
  { key: 'year', label: '년도별' },
]

function todayMonth() { return TODAY.slice(0, 7) }
function todayYear() { return TODAY.slice(0, 4) }

export default function AdminFinancePage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace('/login')
        return
      }
      verifyAdmin(session.token)
        .then(() => {
          if (!cancelled) setAuthChecked(true)
        })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            clearAuth()
          }
          router.replace('/')
        })
    })
    return () => {
      cancelled = true
    }
  }, [router])

  const [tab, setTab] = useState<Period>('day')
  const [dayKey, setDayKey] = useState(TODAY)
  const [weekKey, setWeekKey] = useState(TODAY)
  const [monthKey, setMonthKey] = useState(todayMonth())
  const [yearKey, setYearKey] = useState(todayYear())

  // records mirrors the shared EXPENSE_RECORDS store; its only job is to force a re-render
  // (getPeriodSummary/getExpensesForPeriod read the store directly, not this state).
  const [, setRecords] = useState<ExpenseRecord[]>(() => [...EXPENSE_RECORDS])
  const [form, setForm] = useState({ date: TODAY, label: '', amount: '' })

  const key = tab === 'day' ? dayKey : tab === 'week' ? weekKey : tab === 'month' ? monthKey : yearKey
  const summary = getPeriodSummary(tab, key)
  const periodExpenses = getExpensesForPeriod(tab, key)

  const handleAdd = () => {
    if (!form.label.trim()) return
    const amount = Number(form.amount.replace(/[^0-9]/g, '')) || 0
    if (amount <= 0) return
    const record: ExpenseRecord = { id: `${Date.now()}`, date: form.date, label: form.label.trim(), amount }
    addExpenseRecord(record)
    setRecords(prev => [record, ...prev])
    setForm({ date: form.date, label: '', amount: '' })
  }

  const handleRemove = (id: string) => {
    removeExpenseRecord(id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  if (!authChecked) return null

  return (
    <div>
      <div className="home-container" style={{ maxWidth: 960 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CoinsIcon size={23} weight="fill" color="var(--gold)" /> 자금 관리
          </h1>
        </div>

        {/* 기간 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {PERIOD_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
              border: `1px solid ${tab === t.key ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
              background: tab === t.key ? 'var(--accent-tint)' : 'var(--surface)',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: tab === t.key ? 700 : 400,
            }}>{t.label}</button>
          ))}

          <div style={{ marginLeft: 'auto' }}>
            {tab === 'day' && (
              <input type="date" value={dayKey} onChange={e => setDayKey(e.target.value)} style={{ ...lightInput, width: 'auto' }} />
            )}
            {tab === 'week' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>주 종료일</span>
                <input type="date" value={weekKey} onChange={e => setWeekKey(e.target.value)} style={{ ...lightInput, width: 'auto' }} />
              </div>
            )}
            {tab === 'month' && (
              <input type="month" value={monthKey} onChange={e => setMonthKey(e.target.value)} style={{ ...lightInput, width: 'auto' }} />
            )}
            {tab === 'year' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => setYearKey(y => String(Number(y) - 1))} style={{ background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text-secondary)' }}>‹</button>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', width: 56, textAlign: 'center' }}>{yearKey}년</span>
                <button onClick={() => setYearKey(y => String(Number(y) + 1))} style={{ background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text-secondary)' }}>›</button>
              </div>
            )}
          </div>
        </div>

        {/* 요약 */}
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: '총 매출 (자동)', value: `${summary.revenue.toLocaleString()}원`, color: 'var(--accent)' },
              { label: '총 원가 (자동)', value: `${summary.cost.toLocaleString()}원`, color: 'var(--text-secondary)' },
              { label: '마진', value: `${summary.margin.toLocaleString()}원`, color: summary.margin >= 0 ? 'var(--success)' : 'var(--danger)' },
              { label: '부대비용', value: `${summary.expenses.toLocaleString()}원`, color: 'var(--gold)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 16, fontWeight: 800 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 10, background: 'var(--gold-tint)', border: '1px solid var(--gold-tint-border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              마진 {summary.margin.toLocaleString()}원 − 부대비용 {summary.expenses.toLocaleString()}원
            </div>
            <div style={{ color: summary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 22, fontWeight: 800 }}>
              순이익 {summary.netProfit.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 부대비용 기입 */}
        <div style={card}>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><PencilSimpleIcon size={16} weight="fill" color="var(--accent)" /> 부대비용 기입</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>날짜</div>
              <input type="date" style={lightInput} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div style={{ flex: '2 1 200px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>항목명</div>
              <input style={lightInput} placeholder="예: 택배비, 유통비용" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>금액</div>
              <input style={lightInput} placeholder="예: 3,000원" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!form.label.trim() || !form.amount.trim()}
            style={{
              padding: '11px 20px', borderRadius: 10, border: 'none',
              background: form.label.trim() && form.amount.trim() ? 'var(--accent)' : 'var(--border)',
              color: form.label.trim() && form.amount.trim() ? '#ffffff' : 'var(--text-tertiary)',
              fontSize: 14, fontWeight: 700, cursor: form.label.trim() && form.amount.trim() ? 'pointer' : 'default',
            }}
          >
            기록하기
          </button>
        </div>

        {/* 기간 내 부대비용 목록 */}
        <div style={card}>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardTextIcon size={17} weight="fill" color="var(--accent)" /> 선택 기간 부대비용 내역</div>
          {periodExpenses.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>기록된 부대비용이 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {periodExpenses.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 12, flexShrink: 0 }}>{r.date}</span>
                  <span style={{ flex: 1, color: 'var(--text)', fontSize: 14 }}>{r.label}</span>
                  {r.auto && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px solid var(--accent-tint-border)', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>🌾 쌀포인트 자동</span>
                  )}
                  <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{r.amount.toLocaleString()}원</span>
                  {r.auto ? (
                    <span style={{ width: 28, flexShrink: 0 }} />
                  ) : (
                    <button onClick={() => handleRemove(r.id)} style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>삭제</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
