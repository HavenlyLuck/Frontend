'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import { ApiError } from '@/lib/api'
import { EXPENSE_CATEGORIES, addExpense, fetchExpenses, removeExpense, type ExpenseCategory, type ExpenseRecord } from '@/lib/expenses'

const input: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 10px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
const label: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }
const won = (n: number) => `${n.toLocaleString()}원`

const seoulToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
// "2026-11" → 그 달 첫날 · 마지막 날
function monthRange(month: string): [string, string] {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return [`${month}-01`, `${month}-${String(last).padStart(2, '0')}`]
}

type Draft = { date: string; category: ExpenseCategory; item: string; amount: string }
const emptyDraft = (): Draft => ({ date: seoulToday(), category: '택배·배송', item: '', amount: '' })

// ── 비용 기록 ─────────────────────────────────────────────
// 매입 말고 나가는 돈을 날짜별로 남긴다. 주간 장부가 이걸 가져가 운영비로 잡는다.
export default function AdminExpensesPage() {
  const token = useAdminToken()
  const [month, setMonth] = useState(() => seoulToday().slice(0, 7))
  const [records, setRecords] = useState<ExpenseRecord[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => {
    const [from, to] = monthRange(month)
    return fetchExpenses(token, from, to)
      .then(r => { setRecords(r); setListError(null) })
      .catch(err => setListError(err instanceof ApiError ? err.message : '비용 기록을 불러오지 못했어요.'))
  }
  useEffect(() => { setRecords(null); load() }, [token, month]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const amount = Number(draft.amount.replace(/[^0-9]/g, ''))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return setFormError('날짜를 골라 주세요.')
    if (!(amount > 0)) return setFormError('금액을 입력해 주세요.')
    setSaving(true)
    setFormError(null)
    try {
      await addExpense(token, { date: draft.date, category: draft.category, item: draft.item, amount })
      // 같은 구분으로 이어서 적는 경우가 많아서 구분 · 날짜는 남긴다
      setDraft(d => ({ ...d, item: '', amount: '' }))
      if (draft.date.slice(0, 7) !== month) setMonth(draft.date.slice(0, 7))
      else await load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '저장 중 오류가 발생했어요.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(r: ExpenseRecord) {
    if (!confirm(`${r.date} ${r.category} · ${r.item} ${won(r.amount)}을 지울까요?`)) return
    setBusyId(r.id)
    try {
      await removeExpense(token, r.id)
      setRecords(prev => prev?.filter(x => x.id !== r.id) ?? prev)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '삭제 중 오류가 발생했어요.')
    } finally {
      setBusyId(null)
    }
  }

  const total = (records ?? []).reduce((n, r) => n + r.amount, 0)
  const byCategory = EXPENSE_CATEGORIES
    .map(c => ({ c, sum: (records ?? []).filter(r => r.category === c).reduce((n, r) => n + r.amount, 0) }))
    .filter(x => x.sum > 0)

  return (
    <div>
      <AdminPageHeader
        title="비용"
        description="상품 매입 말고 나가는 돈(택배비 · 마케팅 · 서버 · 포장재 · 수수료 등)을 나간 날짜로 적어 두세요. 주간 장부가 이 기록을 가져가요."
      />

      <div style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', padding: '18px 20px', boxShadow: 'var(--shadow-md)', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <div><div style={label}>날짜 (돈 나간 날)</div><input type="date" style={input} value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} /></div>
          <div>
            <div style={label}>구분</div>
            <select style={input} value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value as ExpenseCategory }))}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><div style={label}>항목</div><input style={input} placeholder="예: CJ 택배 11월분, 인스타 광고" value={draft.item} onChange={e => setDraft(d => ({ ...d, item: e.target.value }))} /></div>
          <div><div style={label}>금액(원)</div><input style={input} inputMode="numeric" placeholder="원" value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') save() }} /></div>
        </div>
        {formError && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{formError}</div>}
        <div style={{ marginTop: 12 }}>
          <button disabled={saving} onClick={save} className="admin-primary-btn">{saving ? '저장 중...' : '+ 비용 기록'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <input type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} style={{ ...input, width: 'auto' }} aria-label="볼 달" />
        {records && (
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            합계 <b style={{ color: 'var(--text)' }}>{won(total)}</b>
            {byCategory.length > 0 && <span style={{ color: 'var(--text-tertiary)' }}> · {byCategory.map(x => `${x.c} ${won(x.sum)}`).join(' · ')}</span>}
          </span>
        )}
      </div>

      {listError && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{listError}</div>}

      {records === null && !listError ? (
        <div style={{ color: 'var(--text-tertiary)', padding: '40px 0', textAlign: 'center' }}>불러오는 중...</div>
      ) : records && records.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>이 달에 적은 비용이 없어요.</div>
      ) : (
        <div className="admin-plist">
          {(records ?? []).map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', fontSize: 14, color: 'var(--text)', borderTop: i > 0 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums', minWidth: 88 }}>{r.date}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 999, padding: '2px 8px' }}>{r.category}</span>
              <span style={{ flex: 1, minWidth: 120 }}>{r.item}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{won(r.amount)}</span>
              <button disabled={busyId === r.id} onClick={() => remove(r)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, border: '1px solid var(--danger-tint-border)', background: 'var(--danger-tint)', color: 'var(--danger)', cursor: 'pointer' }}>
                {busyId === r.id ? '지우는 중...' : '삭제'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
