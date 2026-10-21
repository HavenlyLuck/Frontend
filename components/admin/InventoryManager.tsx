'use client'

import { useEffect, useMemo, useState } from 'react'
import { CaretDownIcon, MagnifyingGlassIcon, PackageIcon, PlusIcon } from '@phosphor-icons/react'
import { ApiError, type InventoryReceiptResponse as InventoryReceipt } from '@/lib/api'
import {
  PRODUCT_TYPE_LABEL, addInventoryReceipt, averageCost, editInventoryReceipt, fetchInventoryItem, fetchInventoryItems, removeInventoryReceipt,
  type InventoryItem, type InventoryItemDetail,
} from '@/lib/inventory'

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }
const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const label: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }

const won = (n: number) => `${n.toLocaleString()}원`
const today = () => new Date().toISOString().slice(0, 10)

// 재고 · 판매 중 · 판매 완료 색 (목록 막대와 숫자가 같이 쓴다)
const STOCK_COLOR = { available: 'var(--success)', reserved: 'var(--gold)', sold: 'var(--text-tertiary)' }

type Filter = 'all' | 'available' | 'out'

// 재고 관리 — 떼 온 물건을 입고 기록으로 쌓고, 품목마다 재고 · 판매 중 · 판매 완료 수량과 평균 원가를 본다
// (재고·자금 관리 페이지의 "재고" 탭 — 관리자 확인은 페이지가 하고, 확인된 토큰을 받아 그린다)
export default function InventoryManager({ token: adminToken }: { token: string }) {
  const [items, setItems] = useState<InventoryItem[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [formItemId, setFormItemId] = useState<number | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)

  const load = async (token: string) => {
    try {
      setItems(await fetchInventoryItems(token))
      setLoadError('')
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : '재고를 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    load(adminToken)
  }, [adminToken])

  const counts = useMemo(() => ({
    all: items?.length ?? 0,
    available: items?.filter(i => i.available > 0).length ?? 0,
    out: items?.filter(i => i.available === 0).length ?? 0,
  }), [items])

  const visible = useMemo(() => {
    const q = query.replace(/\s+/g, '').toLowerCase()
    return (items ?? [])
      .filter(i => filter === 'all' || (filter === 'available' ? i.available > 0 : i.available === 0))
      .filter(i => !q || i.name.replace(/\s+/g, '').toLowerCase().includes(q))
  }, [items, query, filter])

  // 아직 상품에 안 올린 재고의 원가 합계 = 지금 창고에 묶여 있는 돈
  const stockValue = (items ?? []).reduce((n, i) => n + i.available * i.avg_unit_cost, 0)
  const reservedValue = (items ?? []).reduce((n, i) => n + i.reserved * i.avg_unit_cost, 0)

  const openForm = (itemId: number | null) => {
    setFormItemId(itemId)
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 220, fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          물건을 떼 오면 여기에 입고로 적어 두세요. 상품을 등록할 때 이 재고에서 골라 쓰고, 팔리면 자동으로 빠지면서 원가가 손익에 잡혀요.
        </div>
        {!formOpen && (
          <button
            onClick={() => openForm(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            <PlusIcon size={15} weight="bold" /> 입고 등록
          </button>
        )}
      </div>

      {formOpen && (
        <ReceiptForm
          items={items ?? []}
          initialItemId={formItemId}
          onCancel={() => setFormOpen(false)}
          onSubmit={async (payload) => {
            await addInventoryReceipt(adminToken, payload)
            setFormOpen(false)
            setOpenId(null)
            await load(adminToken)
          }}
        />
      )}

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        <SummaryTile title="품목" value={`${counts.all}개`} sub={`재고가 남은 품목 ${counts.available}개`} />
        <SummaryTile title="재고 원가" value={won(stockValue)} sub="아직 상품에 안 올린 물건" />
        <SummaryTile title="판매 중 원가" value={won(reservedValue)} sub="응모·쿠지·상점에 올린 물건" />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div className="admin-sale-toggle" role="tablist" aria-label="재고 상태" style={{ marginBottom: 0 }}>
          {([['all', '전체'], ['available', '재고 있음'], ['out', '재고 없음']] as const).map(([key, text]) => (
            <button key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>
              {text} <span className="count">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <MagnifyingGlassIcon size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input style={{ ...lightInput, paddingLeft: 32 }} placeholder="품목 이름으로 찾기" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      <StockLegend />

      {loadError && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{loadError}</div>}

      {items === null ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : visible.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          {items.length === 0 ? '아직 입고한 물건이 없어요. 오른쪽 위 "입고 등록"으로 시작하세요.' : '조건에 맞는 품목이 없어요.'}
        </div>
      ) : (
        visible.map(item => (
          <ItemRow
            key={item.item_id}
            item={item}
            token={adminToken}
            open={openId === item.item_id}
            onToggle={() => setOpenId(openId === item.item_id ? null : item.item_id)}
            onRestock={() => openForm(item.item_id)}
            onChanged={() => load(adminToken)}
          />
        ))
      )}
    </div>
  )
}

function SummaryTile({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div style={{ ...card, marginBottom: 0, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function StockLegend() {
  const dot = (color: string) => <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{dot(STOCK_COLOR.available)} 재고 — 아직 상품에 안 올린 것</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{dot(STOCK_COLOR.reserved)} 판매 중 — 응모·쿠지·상점에 올린 것</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{dot(STOCK_COLOR.sold)} 판매 완료</span>
    </div>
  )
}

// 재고 · 판매 중 · 판매 완료를 한 줄 막대로
function StockBar({ item }: { item: InventoryItem }) {
  const total = Math.max(1, item.total_received)
  const seg = (n: number, color: string) => n > 0 && <div style={{ width: `${(n / total) * 100}%`, background: color }} />
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--border)' }}>
      {seg(item.available, STOCK_COLOR.available)}
      {seg(item.reserved, STOCK_COLOR.reserved)}
      {seg(item.sold, STOCK_COLOR.sold)}
    </div>
  )
}

// 입고 기록 한 줄 — 수정(같은 자리에서 고치기) · 삭제
// 이미 상품에 올렸거나 팔린 수량보다 입고 합계가 적어지면 막힌다
function ReceiptRow({ receipt: r, token, onChanged }: {
  receipt: InventoryReceipt
  token: string
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ received_at: r.received_at, quantity: String(r.quantity), unit_cost: String(r.unit_cost), supplier: r.supplier ?? '', memo: r.memo ?? '', tax_invoice: r.tax_invoice })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const cell: React.CSSProperties = { padding: '6px 8px', verticalAlign: 'middle' }
  const small: React.CSSProperties = { ...lightInput, padding: '5px 8px', fontSize: 13 }
  const textBtn = (color: string): React.CSSProperties => ({ border: 'none', background: 'none', color, fontSize: 12, fontWeight: 600, cursor: busy ? 'default' : 'pointer', padding: '2px 4px' })

  const startEdit = () => {
    setDraft({ received_at: r.received_at, quantity: String(r.quantity), unit_cost: String(r.unit_cost), supplier: r.supplier ?? '', memo: r.memo ?? '', tax_invoice: r.tax_invoice })
    setError('')
    setEditing(true)
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      setEditing(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리 중 오류가 발생했어요.')
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    const quantity = Number(draft.quantity.replace(/[^0-9]/g, '')) || 0
    const unitCost = Number(draft.unit_cost.replace(/[^0-9]/g, '')) || 0
    if (quantity <= 0 || unitCost <= 0) return setError('수량과 단가를 확인해 주세요.')
    run(() => editInventoryReceipt(token, r.receipt_id, {
      received_at: draft.received_at, quantity, unit_cost: unitCost,
      supplier: draft.supplier.trim() || null, memo: draft.memo.trim() || null, tax_invoice: draft.tax_invoice,
    }))
  }

  const remove = () => {
    if (!confirm(`${r.received_at} 입고 ${r.quantity}개(${won(r.quantity * r.unit_cost)})를 지울까요?`)) return
    run(() => removeInventoryReceipt(token, r.receipt_id))
  }

  if (!editing) {
    return (
      <>
        <tr style={{ color: 'var(--text-secondary)' }}>
          <td style={cell}>{r.received_at}</td>
          <td style={cell}>{r.quantity}개</td>
          <td style={cell}>{won(r.unit_cost)}</td>
          <td style={{ ...cell, color: 'var(--text)', fontWeight: 600 }}>{won(r.unit_cost * r.quantity)}</td>
          <td style={cell}>{r.supplier ?? '-'}{r.memo && <span style={{ color: 'var(--text-tertiary)' }}> · {r.memo}</span>}</td>
          <td style={{ ...cell, color: r.tax_invoice ? 'var(--success)' : 'var(--text-tertiary)' }}>{r.tax_invoice ? '받음' : '없음'}</td>
          <td style={{ ...cell, whiteSpace: 'nowrap', textAlign: 'right' }}>
            <button onClick={startEdit} disabled={busy} style={textBtn('var(--text-secondary)')}>수정</button>
            <button onClick={remove} disabled={busy} style={textBtn('var(--danger)')}>삭제</button>
          </td>
        </tr>
        {error && (
          <tr><td colSpan={7} style={{ ...cell, color: 'var(--danger)', fontSize: 12 }}>{error}</td></tr>
        )}
      </>
    )
  }

  return (
    <>
      <tr style={{ background: 'var(--surface)' }}>
        <td style={cell}><input type="date" style={{ ...small, width: 132 }} value={draft.received_at} onChange={e => setDraft(d => ({ ...d, received_at: e.target.value }))} /></td>
        <td style={cell}><input inputMode="numeric" aria-label="수량" style={{ ...small, width: 64 }} value={draft.quantity} onChange={e => setDraft(d => ({ ...d, quantity: e.target.value }))} /></td>
        <td style={cell}><input inputMode="numeric" aria-label="단가" style={{ ...small, width: 88 }} value={draft.unit_cost} onChange={e => setDraft(d => ({ ...d, unit_cost: e.target.value }))} /></td>
        <td style={{ ...cell, color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {won((Number(draft.quantity.replace(/[^0-9]/g, '')) || 0) * (Number(draft.unit_cost.replace(/[^0-9]/g, '')) || 0))}
        </td>
        <td style={cell}>
          <div style={{ display: 'flex', gap: 4 }}>
            <input aria-label="거래처" placeholder="거래처" style={{ ...small, minWidth: 90 }} value={draft.supplier} onChange={e => setDraft(d => ({ ...d, supplier: e.target.value }))} />
            <input aria-label="메모" placeholder="메모" style={{ ...small, minWidth: 90 }} value={draft.memo} onChange={e => setDraft(d => ({ ...d, memo: e.target.value }))} />
          </div>
        </td>
        <td style={cell}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={draft.tax_invoice} onChange={e => setDraft(d => ({ ...d, tax_invoice: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} /> 받음
          </label>
        </td>
        <td style={{ ...cell, whiteSpace: 'nowrap', textAlign: 'right' }}>
          <button onClick={save} disabled={busy} style={textBtn('var(--accent-fg)')}>{busy ? '저장 중' : '저장'}</button>
          <button onClick={() => { setEditing(false); setError('') }} disabled={busy} style={textBtn('var(--text-tertiary)')}>취소</button>
        </td>
      </tr>
      {error && (
        <tr><td colSpan={7} style={{ ...cell, color: 'var(--danger)', fontSize: 12 }}>{error}</td></tr>
      )}
    </>
  )
}

function ItemRow({ item, token, open, onToggle, onRestock, onChanged }: {
  item: InventoryItem
  token: string
  open: boolean
  onToggle: () => void
  onRestock: () => void
  onChanged: () => void
}) {
  const [detail, setDetail] = useState<InventoryItemDetail | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetchInventoryItem(token, item.item_id).then(d => { if (!cancelled) setDetail(d) })
    return () => { cancelled = true }
  }, [open, token, item])

  const num = (n: number, color: string, text: string) => (
    <div style={{ textAlign: 'center', minWidth: 56 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color }}>{n}</div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{text}</div>
    </div>
  )

  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, width: '100%', padding: 16, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
      >
        {item.image_url
          ? <img src={item.image_url} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--bg-subtle)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}><PackageIcon size={22} /></div>}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
            평균 원가 <b style={{ color: 'var(--text-secondary)' }}>{won(item.avg_unit_cost)}</b> · 총 입고 {item.total_received}개
            {item.last_received_at && ` · 최근 입고 ${item.last_received_at}`}
          </div>
          <StockBar item={item} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {num(item.available, item.available > 0 ? STOCK_COLOR.available : 'var(--danger)', '재고')}
          {num(item.reserved, STOCK_COLOR.reserved, '판매 중')}
          {num(item.sold, STOCK_COLOR.sold, '판매 완료')}
        </div>
        <CaretDownIcon size={16} style={{ color: 'var(--text-tertiary)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 16, background: 'var(--bg-subtle)' }}>
          {!detail ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>불러오는 중...</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>입고 기록</div>
                <button
                  onClick={onRestock}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <PlusIcon size={12} weight="bold" /> 추가 입고
                </button>
              </div>
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
                  <thead>
                    <tr style={{ color: 'var(--text-tertiary)', textAlign: 'left' }}>
                      {['매입일', '수량', '단가', '합계', '거래처 · 메모', '증빙', ''].map(h => (
                        <th key={h} style={{ fontWeight: 500, padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.receipts.map(r => (
                      <ReceiptRow key={r.receipt_id} receipt={r} token={token} onChanged={onChanged} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>어디에 쓰였나</div>
              {detail.allocations.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>아직 어느 상품에도 쓰지 않았어요.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detail.allocations.map(a => (
                    <div key={`${a.product_type}-${a.product_id}-${a.product_name}`} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-fg)', border: '1px solid var(--accent-tint-border)', background: 'var(--accent-tint)', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
                        {PRODUCT_TYPE_LABEL[a.product_type]}
                      </span>
                      <span style={{ flex: 1, color: 'var(--text)' }}>{a.product_name}</span>
                      {a.reserved > 0 && <span style={{ color: STOCK_COLOR.reserved }}>판매 중 {a.reserved}</span>}
                      {a.sold > 0 && <span style={{ color: 'var(--text-tertiary)' }}>판매 완료 {a.sold}</span>}
                    </div>
                  ))}
                </div>
              )}
              {item.memo && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>메모: {item.memo}</div>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// 입고 등록 — 새 품목이면 이름·사진, 이미 있는 품목이면 골라서 추가 입고
function ReceiptForm({ items, initialItemId, onCancel, onSubmit }: {
  items: InventoryItem[]
  initialItemId: number | null
  onCancel: () => void
  onSubmit: (payload: Parameters<typeof addInventoryReceipt>[1]) => Promise<void>
}) {
  const [mode, setMode] = useState<'new' | 'existing'>(initialItemId != null ? 'existing' : 'new')
  const [itemId, setItemId] = useState<number | null>(initialItemId)
  const [name, setName] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [receivedAt, setReceivedAt] = useState(today())
  const [supplier, setSupplier] = useState('')
  const [taxInvoice, setTaxInvoice] = useState(true)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialItemId != null) {
      setMode('existing')
      setItemId(initialItemId)
    }
  }, [initialItemId])

  const qty = Number(quantity.replace(/[^0-9]/g, '')) || 0
  const cost = Number(unitCost.replace(/[^0-9]/g, '')) || 0
  const selected = items.find(i => i.item_id === itemId)
  // 추가 입고하면 평균 원가가 어떻게 바뀌는지 미리 보여준다
  const nextAvg = selected && qty > 0 && cost > 0
    ? averageCost([{ quantity: selected.total_received, unit_cost: selected.avg_unit_cost }, { quantity: qty, unit_cost: cost }])
    : null

  const submit = async () => {
    if (mode === 'new' && !name.trim()) return setError('품목 이름을 적어주세요.')
    if (mode === 'existing' && itemId == null) return setError('추가 입고할 품목을 골라주세요.')
    if (qty <= 0) return setError('수량을 적어주세요.')
    if (cost <= 0) return setError('1개당 매입 단가를 적어주세요.')
    setError('')
    setSaving(true)
    try {
      await onSubmit({
        ...(mode === 'existing' ? { item_id: itemId! } : { name: name.trim(), image: image ?? undefined }),
        quantity: qty,
        unit_cost: cost,
        received_at: receivedAt,
        supplier: supplier.trim() || undefined,
        tax_invoice: taxInvoice,
        memo: memo.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '입고 등록 중 오류가 발생했어요.')
      setSaving(false)
    }
  }

  const modeBtn = (key: 'new' | 'existing', text: string) => (
    <button
      type="button"
      onClick={() => setMode(key)}
      style={{
        padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
        border: `1px solid ${mode === key ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
        background: mode === key ? 'var(--accent-tint)' : 'var(--surface)',
        color: mode === key ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: mode === key ? 700 : 400,
      }}
    >
      {text}
    </button>
  )

  return (
    <div style={{ ...card, border: '1px solid var(--accent-tint-border)', marginBottom: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>입고 등록</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {modeBtn('new', '새 품목')}
        {modeBtn('existing', '기존 품목에 추가')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {mode === 'new' ? (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={label}>품목 이름 *</div>
              <input style={lightInput} placeholder="예: 원피스 루피 기어5 피규어" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={label}>사진 (선택 — 상품 등록할 때 그대로 가져다 써요)</div>
              <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] ?? null)} style={{ fontSize: 13, color: 'var(--text-secondary)' }} />
            </div>
          </>
        ) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={label}>품목 *</div>
            <select style={lightInput} value={itemId ?? ''} onChange={e => setItemId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">품목을 골라주세요</option>
              {items.map(i => <option key={i.item_id} value={i.item_id}>{i.name} (재고 {i.available}개 · 평균 {won(i.avg_unit_cost)})</option>)}
            </select>
          </div>
        )}

        <div>
          <div style={label}>수량 *</div>
          <input style={lightInput} inputMode="numeric" placeholder="예: 10" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>
        <div>
          <div style={label}>1개당 매입 단가 (원, 부가세 포함) *</div>
          <input style={lightInput} inputMode="numeric" placeholder="예: 24000" value={unitCost} onChange={e => setUnitCost(e.target.value)} />
        </div>
        <div>
          <div style={label}>매입일</div>
          <input type="date" style={lightInput} value={receivedAt} onChange={e => setReceivedAt(e.target.value)} />
        </div>
        <div>
          <div style={label}>거래처</div>
          <input style={lightInput} placeholder="예: 도매꾹 ○○상사" value={supplier} onChange={e => setSupplier(e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={label}>메모</div>
          <input style={lightInput} placeholder="예: 정품 인증서 동봉, 박스 손상 1개" value={memo} onChange={e => setMemo(e.target.value)} />
        </div>
        <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={taxInvoice} onChange={e => setTaxInvoice(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
          세금계산서 · 현금영수증 받음 (원가 처리 증빙)
        </label>
      </div>

      <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-subtle)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <span>매입 합계 <b style={{ color: 'var(--text)' }}>{won(qty * cost)}</b></span>
        {selected && nextAvg != null && (
          <span>평균 원가 {won(selected.avg_unit_cost)} → <b style={{ color: 'var(--text)' }}>{won(nextAvg)}</b></span>
        )}
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={onCancel} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
          취소
        </button>
        <button onClick={submit} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? '저장 중...' : '입고 등록'}
        </button>
      </div>
    </div>
  )
}
