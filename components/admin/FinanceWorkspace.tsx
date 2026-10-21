'use client'

import { useEffect, useState } from 'react'
import { ArrowRightIcon, ClipboardTextIcon, PencilSimpleIcon } from '@phosphor-icons/react'
import InventoryManager from '@/components/admin/InventoryManager'
import { AdminPageHeader } from '@/components/admin/AdminShell'
import {
  EXPENSE_RECORDS, addExpenseRecord, removeExpenseRecord, todayKey,
  getExpensesForPeriod, getPeriodSummary, getSalesForPeriod,
  type ExpenseRecord, type Period,
} from '@/lib/finance'

const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '9px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }
const sectionTitle: React.CSSProperties = { color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }

const won = (n: number) => `${n.toLocaleString()}원`

export type WorkspaceTab = 'overview' | 'inventory' | 'expenses'

const TABS: { key: WorkspaceTab; label: string }[] = [
  { key: 'overview', label: '한눈에' },
  { key: 'inventory', label: '재고' },
  { key: 'expenses', label: '부대비용' },
]

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'day', label: '일별' },
  { key: 'week', label: '주별' },
  { key: 'month', label: '월별' },
  { key: 'year', label: '년도별' },
]

// 재고·자금 관리 — 손익(한눈에) · 재고 · 부대비용을 한 화면에서. 관리자 확인은 AdminShell이 하고 토큰을 받는다.
export default function FinanceWorkspace({ token, initialTab = 'overview' }: { token: string; initialTab?: WorkspaceTab }) {
  const [tab, setTab] = useState<WorkspaceTab>(initialTab)
  const today = todayKey()
  const [period, setPeriod] = useState<Period>('month')
  const [keys, setKeys] = useState<Record<Period, string>>({ day: today, week: today, month: today.slice(0, 7), year: today.slice(0, 4) })
  const periodKey = keys[period]
  const setKey = (v: string) => setKeys(k => ({ ...k, [period]: v }))

  // 주소에 탭을 남겨 새로고침·공유해도 같은 탭이 열리게
  const changeTab = (t: WorkspaceTab) => {
    setTab(t)
    window.history.replaceState(null, '', t === 'overview' ? '/admin/finance' : `/admin/finance?tab=${t}`)
  }

  return (
    <div>
      <AdminPageHeader title="재고·자금" description="물건 입고와 재고, 매출 · 원가 · 부대비용 · 순이익을 한곳에서 봐요." />

      <div className="admin-sale-toggle" role="tablist" aria-label="재고·자금 메뉴" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => changeTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'inventory' && (
        <PeriodPicker period={period} periodKey={periodKey} onPeriod={setPeriod} onKey={setKey} />
      )}

      {tab === 'overview' && <Overview period={period} periodKey={periodKey} onGo={changeTab} />}
      {tab === 'inventory' && <InventoryManager token={token} />}
      {tab === 'expenses' && <Expenses period={period} periodKey={periodKey} />}
    </div>
  )
}

function PeriodPicker({ period, periodKey, onPeriod, onKey }: {
  period: Period
  periodKey: string
  onPeriod: (p: Period) => void
  onKey: (k: string) => void
}) {
  return (
    <div className="admin-toolbar">
      <div className="admin-sale-toggle" role="tablist" aria-label="기간">
        {PERIOD_TABS.map(t => (
          <button key={t.key} role="tab" aria-selected={period === t.key} className={period === t.key ? 'active' : ''} onClick={() => onPeriod(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div>
        {period === 'day' && <input type="date" value={periodKey} onChange={e => onKey(e.target.value)} style={{ ...lightInput, width: 'auto' }} />}
        {period === 'week' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>주 종료일</span>
            <input type="date" value={periodKey} onChange={e => onKey(e.target.value)} style={{ ...lightInput, width: 'auto' }} />
          </div>
        )}
        {period === 'month' && <input type="month" value={periodKey} onChange={e => onKey(e.target.value)} style={{ ...lightInput, width: 'auto' }} />}
        {period === 'year' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => onKey(String(Number(periodKey) - 1))} style={{ background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text-secondary)' }}>‹</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', width: 56, textAlign: 'center' }}>{periodKey}년</span>
            <button onClick={() => onKey(String(Number(periodKey) + 1))} style={{ background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text-secondary)' }}>›</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 한눈에: 손익 + 기간 판매 내역 ──
function Overview({ period, periodKey, onGo }: { period: Period; periodKey: string; onGo: (t: WorkspaceTab) => void }) {
  const summary = getPeriodSummary(period, periodKey)
  const sales = getSalesForPeriod(period, periodKey)
  const [shown, setShown] = useState(20)
  useEffect(() => { setShown(20) }, [period, periodKey])

  const marginRate = summary.revenue > 0 ? Math.round((summary.margin / summary.revenue) * 100) : 0

  return (
    <>
      {/* 손익 — 위에서 아래로 빼 나가는 순서 */}
      <div style={card}>
        <div style={sectionTitle}>손익</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <PlRow label="매출" hint="카드 결제 금액 (쌀포인트 결제 제외)" value={summary.revenue} />
          <PlRow
            label="− 판매 원가"
            hint={summary.ssalCost > 0
              ? `나간 물건의 재고 평균 원가 (자동) · 그중 쌀포인트로 나간 물건 ${won(summary.ssalCost)}`
              : '나간 물건의 재고 평균 원가 (자동)'}
            value={-summary.cost}
            muted
          />
          <PlRow label="= 마진" hint={summary.revenue > 0 ? `마진율 ${marginRate}%` : undefined} value={summary.margin} strong />
          <PlRow
            label="− 부대비용"
            hint="택배비·광고비처럼 직접 적은 비용"
            value={-summary.expenses}
            muted
            action={<button onClick={() => onGo('expenses')} style={linkBtn}>부대비용 적기 <ArrowRightIcon size={12} /></button>}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '16px 18px', borderRadius: 10, background: 'var(--gold-tint)', border: '1px solid var(--gold-tint-border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>순이익</div>
          <div style={{ color: summary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 24, fontWeight: 800 }}>
            {won(summary.netProfit)}
          </div>
        </div>
        {/* 손익과 별개 — 물건을 많이 사 둔 달엔 순이익이 나도 통장 돈이 줄어드는 이유 */}
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.6 }}>
          이 기간 물건 사는 데 쓴 돈(입고) <b style={{ color: 'var(--text-secondary)' }}>{won(summary.purchases)}</b> · 손익에는 안 들어가고 팔릴 때 원가가 돼요.{' '}
          <button onClick={() => onGo('inventory')} style={linkBtn}>재고 보기 <ArrowRightIcon size={12} /></button>
        </div>
      </div>

      {/* 기간 판매 내역 */}
      <div style={card}>
        <div style={sectionTitle}>판매 내역 <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-tertiary)' }}>{summary.salesCount}건</span></div>
        {sales.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>이 기간 판매 내역이 없어요.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
              <thead>
                <tr style={{ color: 'var(--text-tertiary)', textAlign: 'left' }}>
                  {['날짜', '구분', '상품', '매출', '원가', '마진'].map((h, i) => (
                    <th key={h} style={{ fontWeight: 500, padding: '6px 8px', borderBottom: '1px solid var(--border)', textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, shown).map(s => (
                  <tr key={s.id} style={{ color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{s.date.slice(5)}</td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{s.pay === 'ssal' ? '쌀포인트' : s.type}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text)' }}>{s.title}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{s.pay === 'ssal' ? `${s.ssalPrice.toLocaleString()}P` : won(s.revenue)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{won(s.cost)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: s.revenue - s.cost >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {won(s.revenue - s.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length > shown && (
              <button onClick={() => setShown(n => n + 20)} style={{ ...linkBtn, marginTop: 12, fontSize: 13 }}>
                더 보기 ({sales.length - shown}건 남음)
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

const linkBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 3, border: 'none', background: 'none', padding: 0, color: 'var(--accent-fg)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }

function PlRow({ label, hint, value, muted, strong, action }: {
  label: string
  hint?: string
  value: number
  muted?: boolean
  strong?: boolean
  action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderTop: strong ? '1px solid var(--border)' : undefined }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: strong ? 700 : 500, color: muted ? 'var(--text-secondary)' : 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{hint}</div>}
        {action && <div style={{ marginTop: 4 }}>{action}</div>}
      </div>
      <div style={{ fontSize: strong ? 18 : 16, fontWeight: 800, color: muted ? 'var(--text-secondary)' : value < 0 ? 'var(--danger)' : 'var(--text)', whiteSpace: 'nowrap' }}>
        {won(value === 0 ? 0 : value) /* -0원 방지 */}
      </div>
    </div>
  )
}

// ── 부대비용: 기입 + 기간 내역 ──
function Expenses({ period, periodKey }: { period: Period; periodKey: string }) {
  // EXPENSE_RECORDS를 직접 읽으므로 이 state는 다시 그리기용
  const [, setRecords] = useState<ExpenseRecord[]>(() => [...EXPENSE_RECORDS])
  const [form, setForm] = useState({ date: todayKey(), label: '', amount: '' })
  const list = getExpensesForPeriod(period, periodKey)
  const total = list.reduce((n, r) => n + r.amount, 0)
  const canAdd = form.label.trim() !== '' && (Number(form.amount.replace(/[^0-9]/g, '')) || 0) > 0

  const add = () => {
    if (!canAdd) return
    const record: ExpenseRecord = { id: `${Date.now()}`, date: form.date, label: form.label.trim(), amount: Number(form.amount.replace(/[^0-9]/g, '')) }
    addExpenseRecord(record)
    setRecords(prev => [record, ...prev])
    setForm(f => ({ ...f, label: '', amount: '' }))
  }

  const remove = (id: string) => {
    removeExpenseRecord(id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return (
    <>
      <div style={card}>
        <div style={sectionTitle}><PencilSimpleIcon size={16} weight="fill" color="var(--accent)" /> 부대비용 적기</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14, lineHeight: 1.6 }}>
          택배비, 포장재, 광고비, 서버비처럼 물건 값이 아닌 돈을 적어요. 물건을 사 온 돈은 "재고" 탭에서 입고로 적어 주세요. 쌀포인트로 나간 물건은 따로 안 적어도 판매 원가에 자동으로 들어가요.
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>날짜</div>
            <input type="date" style={lightInput} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>항목</div>
            <input style={lightInput} placeholder="예: 택배비, 인스타 광고" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>금액 (원)</div>
            <input style={lightInput} inputMode="numeric" placeholder="예: 3000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') add() }} />
          </div>
        </div>
        <button
          onClick={add}
          disabled={!canAdd}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700,
            background: canAdd ? 'var(--accent)' : 'var(--border)',
            color: canAdd ? '#ffffff' : 'var(--text-tertiary)',
            cursor: canAdd ? 'pointer' : 'default',
          }}
        >
          기록하기
        </button>
      </div>

      <div style={card}>
        <div style={{ ...sectionTitle, justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardTextIcon size={17} weight="fill" color="var(--accent)" /> 선택 기간 부대비용</span>
          <span style={{ fontSize: 15, color: 'var(--gold)' }}>{won(total)}</span>
        </div>
        {list.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>이 기간에 기록된 부대비용이 없어요.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 12, flexShrink: 0 }}>{r.date}</span>
                <span style={{ flex: 1, color: 'var(--text)', fontSize: 14 }}>{r.label}</span>
                <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{won(r.amount)}</span>
                <button onClick={() => remove(r.id)} style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>삭제</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
