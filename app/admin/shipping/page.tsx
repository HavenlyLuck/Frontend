'use client'

import { useEffect, useState } from 'react'
import { CaretDownIcon, CopyIcon, DownloadSimpleIcon, MagnifyingGlassIcon, PackageIcon, XIcon } from '@phosphor-icons/react'
import { ApiError } from '@/lib/api'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import {
  CARRIERS, boxesToCsv, downloadCsv, fetchShippingBoxes, shipBox,
  type ShippingBox, type ShippingStatus,
} from '@/lib/adminShipping'
import { parseServerTime } from '@/lib/raffle'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 10

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }
const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

const SOURCE_LABEL = { raffle: '응모', kuji: '쿠지', store: '상점' } as const

// 서버 시각은 끝에 Z 없는 UTC라서 parseServerTime으로 읽어야 한국 시간으로 맞게 나온다
const fmt = (iso: string | null) => (iso ? new Date(parseServerTime(iso)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')

// 배송 관리 — 고객이 보관함에서 배송 신청한 상품을 박스 단위로 보고, 송장번호를 넣어 발송 처리한다
export default function AdminShippingPage() {
  const adminToken = useAdminToken()
  const [status, setStatus] = useState<ShippingStatus>('requested')
  const [boxes, setBoxes] = useState<ShippingBox[] | null>(null)
  const [counts, setCounts] = useState<Record<ShippingStatus, number>>({ requested: 0, shipped: 0 })
  const [loadError, setLoadError] = useState('')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')

  const load = async (token: string, s: ShippingStatus) => {
    try {
      const [requested, shipped] = await Promise.all([fetchShippingBoxes(token, 'requested'), fetchShippingBoxes(token, 'shipped')])
      setCounts({ requested: requested.length, shipped: shipped.length })
      // 발송 완료는 최근 것부터
      setBoxes(s === 'requested' ? requested : [...shipped].reverse())
      setLoadError('')
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : '목록을 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    load(adminToken, status)
  }, [adminToken, status])

  // 고객 이름 검색 — 닉네임 또는 받는 사람 이름
  const keyword = query.trim().toLowerCase()
  const shownBoxes = boxes && keyword
    ? boxes.filter(b => b.nickname.toLowerCase().includes(keyword) || (b.address?.recipient ?? '').toLowerCase().includes(keyword))
    : boxes
  const shippedPageCount = Math.max(1, Math.ceil((shownBoxes?.length ?? 0) / PAGE_SIZE))
  const shippedPage = Math.min(page, shippedPageCount)

  return (
    <div>
      <AdminPageHeader
        title="배송"
        description="같은 고객이 같은 배송지로 신청한 상품은 발송 전까지 한 박스로 묶여요. 송장번호를 넣고 발송 처리하면 고객 보관함에도 보여요."
        actions={status === 'requested' && boxes && boxes.length > 0 && (
          <button
            onClick={() => downloadCsv(`배송대기_${new Date().toISOString().slice(0, 10)}.csv`, boxesToCsv(boxes))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <DownloadSimpleIcon size={15} weight="bold" /> 택배 접수용 엑셀
          </button>
        )}
      />

      <div className="admin-sale-toggle" role="tablist" aria-label="배송 상태">
        {([['requested', '배송 대기'], ['shipped', '발송 완료']] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={status === key}
            className={status === key ? 'active' : ''}
            onClick={() => { setStatus(key); setBoxes(null); setPage(1) }}
          >
            {label} <span className="count">{counts[key]}</span>
          </button>
        ))}
      </div>

      <label className="purchase-search" style={{ marginBottom: 16, maxWidth: 360 }}>
        <MagnifyingGlassIcon size={15} color="var(--text-tertiary)" />
        <input
          type="search"
          placeholder="고객 이름 검색 (닉네임·받는 사람)"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1) }}
        />
        {query && (
          <button type="button" aria-label="검색어 지우기" onClick={() => { setQuery(''); setPage(1) }}>
            <XIcon size={14} />
          </button>
        )}
      </label>

      {loadError && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{loadError}</div>}

      {shownBoxes === null ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : shownBoxes.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          {keyword ? `'${query.trim()}' 고객의 ${status === 'requested' ? '배송 대기' : '발송 완료'} 상품이 없어요.` : status === 'requested' ? '보낼 상품이 없어요.' : '발송한 상품이 없어요.'}
        </div>
      ) : (
        // 발송 완료는 접어 둔 채 10개씩 나눠 본다. 배송 대기는 모두 처리해야 하므로 한 번에 다 보여준다
        <>
          {(status === 'shipped' ? shownBoxes.slice((shippedPage - 1) * PAGE_SIZE, shippedPage * PAGE_SIZE) : shownBoxes).map(box => (
            <ShippingBoxCard key={box.key} box={box} collapsible={status === 'shipped'} onShip={async (carrier, tracking) => {
              await shipBox(adminToken, box, carrier, tracking)
              await load(adminToken, status)
            }} />
          ))}
          {status === 'shipped' && (
            <Pagination page={shippedPage} pageCount={shippedPageCount} onChange={setPage} label="발송 완료 페이지" />
          )}
        </>
      )}
    </div>
  )
}

function ShippingBoxCard({ box, onShip, collapsible = false }: {
  box: ShippingBox
  onShip: (carrier: string, tracking: string) => Promise<void>
  collapsible?: boolean // 발송 완료 목록 — 한 줄로 접어 두고 눌러서 펼친다
}) {
  const [open, setOpen] = useState(false)
  const [carrier, setCarrier] = useState(CARRIERS[0])
  const [tracking, setTracking] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const a = box.address
  const shipped = box.trackingNumber != null
  // 같은 고객이 발송 전에 여러 번 신청한 건 한 박스로 묶여 있다
  const requestCount = new Set(box.items.map(i => i.requested_at)).size
  const fullAddress = a ? [a.zip_code && `(${a.zip_code})`, a.address1, a.address2].filter(Boolean).join(' ') : ''

  const copyAddress = () => {
    if (!a) return
    navigator.clipboard.writeText(`${a.recipient} ${a.phone}\n${fullAddress}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }

  const submit = async () => {
    if (!tracking.trim() || saving) return
    setSaving(true)
    try {
      await onShip(carrier, tracking.trim())
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '발송 처리 중 오류가 발생했어요.')
      setSaving(false)
    }
  }

  if (collapsible && !open) {
    const first = box.items[0]
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        style={{ ...card, width: '100%', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', padding: '14px 20px', marginBottom: 10 }}
      >
        <PackageIcon size={17} weight="fill" color="var(--accent)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
            {box.nickname}
            <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
              {first?.product_name}{box.items.length > 1 ? ` 외 ${box.items.length - 1}종` : ''}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {box.carrier} {box.trackingNumber} · 발송 {fmt(box.shippedAt)}
          </div>
        </div>
        <CaretDownIcon size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
      </button>
    )
  }

  return (
    <div style={card}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, cursor: collapsible ? 'pointer' : undefined }}
        onClick={collapsible ? () => setOpen(false) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? true : undefined}
      >
        <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <PackageIcon size={17} weight="fill" color="var(--accent)" /> {box.nickname}
          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-tertiary)' }}>상품 {box.items.length}종</span>
          {requestCount > 1 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', background: 'var(--gold-tint)', border: '1px solid var(--gold-tint-border)', borderRadius: 20, padding: '2px 8px' }}>
              신청 {requestCount}건 합배송
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {shipped ? `발송 ${fmt(box.shippedAt)}` : `신청 ${fmt(box.requestedAt)}`}
          {collapsible && <CaretDownIcon size={16} style={{ transform: 'rotate(180deg)' }} />}
        </div>
      </div>

      {/* 받는 곳 */}
      <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {a ? (
          <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <div><b style={{ color: 'var(--text)' }}>{a.recipient}</b> · {a.phone}</div>
            <div>{fullAddress}</div>
          </div>
        ) : (
          <div style={{ flex: 1, fontSize: 13, color: 'var(--danger)' }}>배송지 정보가 없어요</div>
        )}
        {a && (
          <button onClick={copyAddress} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-secondary)', borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
            <CopyIcon size={13} /> {copied ? '복사됨' : '복사'}
          </button>
        )}
      </div>

      {/* 박스에 넣을 상품 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {box.items.map(it => (
          <div key={it.storage_item_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {it.image_url
              ? <img src={it.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-subtle)', flexShrink: 0 }} />}
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-fg)', border: '1px solid var(--accent-tint-border)', background: 'var(--accent-tint)', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
              {SOURCE_LABEL[it.source]}
            </span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>{it.product_name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>× {it.quantity}</span>
          </div>
        ))}
      </div>

      {/* 발송 처리 */}
      {shipped ? (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {box.carrier} · <b style={{ color: 'var(--text)' }}>{box.trackingNumber}</b>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <select value={carrier} onChange={e => setCarrier(e.target.value)} style={{ ...lightInput, width: 'auto' }}>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            style={{ ...lightInput, flex: 1, minWidth: 160, width: 'auto' }}
            placeholder="송장번호"
            value={tracking}
            onChange={e => setTracking(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
          <button
            onClick={submit}
            disabled={!tracking.trim() || saving}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 700,
              background: tracking.trim() ? 'var(--accent)' : 'var(--border)',
              color: tracking.trim() ? '#fff' : 'var(--text-tertiary)',
              cursor: tracking.trim() && !saving ? 'pointer' : 'default',
            }}
          >
            {saving ? '처리 중...' : '발송 처리'}
          </button>
        </div>
      )}
    </div>
  )
}
