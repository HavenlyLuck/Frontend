'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ApiError } from '@/lib/api'
import { addPurchase, fetchPurchases, removePurchase, type PurchaseInput, type PurchaseRecord } from '@/lib/catalog'

const input: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 10px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
const label: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }
const won = (n: number) => `${n.toLocaleString()}원`

const seoulToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
const digits = (s: string) => Number(s.replace(/[^0-9]/g, ''))

// ── 입고 입력 ─────────────────────────────────────────────
export type PurchaseDraft = { date: string; supplier: string; quantity: string; unitCost: string; taxFree: boolean; memo: string }
export const emptyPurchaseDraft = (): PurchaseDraft => ({ date: seoulToday(), supplier: '', quantity: '', unitCost: '', taxFree: false, memo: '' })

export const isPurchaseDraftEmpty = (d: PurchaseDraft) => !d.quantity.trim() && !d.unitCost.trim() && !d.supplier.trim()

// 입력 확인 — 틀리면 안내 문구, 맞으면 서버에 보낼 값
export function parsePurchaseDraft(d: PurchaseDraft): PurchaseInput | string {
  const quantity = digits(d.quantity)
  if (!(quantity > 0)) return '수량은 1개 이상 숫자로 입력해 주세요.'
  if (!d.unitCost.trim()) return '1개당 원가를 입력해 주세요. (공짜로 받았으면 0)'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return '입고일을 골라 주세요.'
  return { date: d.date, supplier: d.supplier, quantity, unitCost: digits(d.unitCost), taxFree: d.taxFree, memo: d.memo }
}

// 입고 입력 칸 (서버에서는 입고 기록 = inventory_receipts)
export function PurchaseFields({ draft, onChange }: { draft: PurchaseDraft; onChange: (d: PurchaseDraft) => void }) {
  const set = (k: 'date' | 'supplier' | 'quantity' | 'unitCost' | 'memo') => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...draft, [k]: e.target.value })
  const q = digits(draft.quantity), u = digits(draft.unitCost)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div><div style={label}>입고일 (돈 낸 날)</div><input type="date" style={input} value={draft.date} onChange={set('date')} /></div>
        <div><div style={label}>거래처</div><input style={input} placeholder="예: 애니메이트, 거래처명, 사이트" value={draft.supplier} onChange={set('supplier')} /></div>
        <div><div style={label}>수량</div><input style={input} inputMode="numeric" placeholder="개" value={draft.quantity} onChange={set('quantity')} /></div>
        <div><div style={label}>{draft.taxFree ? '1개당 원가 (면세)' : '1개당 원가 (부가세 포함)'}</div><input style={input} inputMode="numeric" placeholder="원" value={draft.unitCost} onChange={set('unitCost')} /></div>
        <div><div style={label}>메모</div><input style={input} placeholder="주문번호 등" value={draft.memo} onChange={set('memo')} /></div>
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
        <input type="checkbox" checked={draft.taxFree} onChange={e => onChange({ ...draft, taxFree: e.target.checked })} />
        면세로 떼 온 상품 (부가세 없음)
      </label>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
        {q > 0 && <>입고 금액 {won(q * u)} = {won(u)} × {q}개 · </>}
        배송비 · 수수료 같은 다른 돈은 <Link href="/admin/expenses" style={{ color: 'var(--text-secondary)' }}>비용</Link>에 날짜별로 적어 주세요.
      </div>
    </div>
  )
}

// 등록 상품 한 개의 입고 기록 — 떼 올 때마다 한 줄 (날짜 · 거래처 · 수량 · 원가), 목록 + 추가 + 삭제
export default function PurchasePanel({ token, item, startAdding = false, onChanged, onClose }: { token: string; item: { id: number; name: string }; startAdding?: boolean; onChanged: () => void; onClose?: () => void }) {
  const [records, setRecords] = useState<PurchaseRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<PurchaseDraft>(emptyPurchaseDraft)
  const [adding, setAdding] = useState(startAdding)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => fetchPurchases(token, item.id)
    .then(r => { setRecords(r); setError(null) })
    .catch(err => setError(err instanceof ApiError ? err.message : '입고 기록을 불러오지 못했어요.'))
  useEffect(() => { load() }, [token, item.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const parsed = parsePurchaseDraft(draft)
    if (typeof parsed === 'string') return setError(parsed)
    setSaving(true)
    setError(null)
    try {
      await addPurchase(token, item, parsed)
      setDraft(emptyPurchaseDraft())
      setAdding(false)
      await load()
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '입고 저장 중 오류가 발생했어요.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(r: PurchaseRecord) {
    if (!confirm(`${r.date} 입고 ${r.quantity}개 기록을 지울까요?`)) return
    setBusyId(r.id)
    try {
      await removePurchase(token, item.id, r.id)
      await load()
      onChanged()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '삭제 중 오류가 발생했어요. 이미 게시해 판매 중인 수량보다 적게 만들 수는 없어요.')
    } finally {
      setBusyId(null)
    }
  }

  const totalQty = (records ?? []).reduce((n, r) => n + r.quantity, 0)
  const totalCost = (records ?? []).reduce((n, r) => n + r.quantity * r.unitCost, 0)

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px 16px', background: 'var(--bg-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {item.name} 입고 기록{records && records.length > 0 && <span style={{ fontWeight: 500, color: 'var(--text-tertiary)' }}> · 총 {totalQty}개 · {won(totalCost)}</span>}
        </span>
        {!adding && <button onClick={() => { setAdding(true); setError(null) }} className="admin-primary-btn" style={{ padding: '6px 12px', fontSize: 12 }}>+ 입고</button>}
      </div>

      {adding && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', padding: 14, marginBottom: 12 }}>
          <PurchaseFields draft={draft} onChange={setDraft} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button disabled={saving} onClick={save} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => { setAdding(false); setDraft(emptyPurchaseDraft()); setError(null); if (startAdding && (records ?? []).length === 0) onClose?.() }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      )}

      {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{error}</div>}

      {records === null && !error ? (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>불러오는 중...</div>
      ) : records && records.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>입고 기록이 없어요. 물건을 떼 올 때마다 언제 · 어디서 · 몇 개 · 얼마에 샀는지 남겨 두면 장부에서 원가로 써요.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(records ?? []).map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{r.date}</span>
              <span style={{ fontWeight: 600 }}>{r.supplier || '거래처 없음'}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{won(r.unitCost)} × {r.quantity}개</span>
              <span style={{ fontSize: 11, color: r.taxFree ? 'var(--gold)' : 'var(--text-tertiary)', border: '1px solid var(--border-strong)', borderRadius: 999, padding: '1px 7px' }}>{r.taxFree ? '면세' : '과세'}</span>
              {r.memo && <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{r.memo}</span>}
              <button disabled={busyId === r.id} onClick={() => remove(r)} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, fontSize: 11, border: '1px solid var(--danger-tint-border)', background: 'var(--danger-tint)', color: 'var(--danger)', cursor: 'pointer' }}>
                {busyId === r.id ? '지우는 중...' : '삭제'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
