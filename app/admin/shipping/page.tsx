'use client'

import { useEffect, useState } from 'react'
import { CopyIcon, DownloadSimpleIcon, PackageIcon } from '@phosphor-icons/react'
import { ApiError } from '@/lib/api'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import {
  CARRIERS, boxesToCsv, downloadCsv, fetchShippingBoxes, shipBox,
  type ShippingBox, type ShippingStatus,
} from '@/lib/adminShipping'

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }
const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

const SOURCE_LABEL = { raffle: '응모', kuji: '쿠지', store: '상점' } as const

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')

// 배송 관리 — 고객이 보관함에서 배송 신청한 상품을 박스 단위로 보고, 송장번호를 넣어 발송 처리한다
export default function AdminShippingPage() {
  const adminToken = useAdminToken()
  const [status, setStatus] = useState<ShippingStatus>('requested')
  const [boxes, setBoxes] = useState<ShippingBox[] | null>(null)
  const [counts, setCounts] = useState<Record<ShippingStatus, number>>({ requested: 0, shipped: 0 })
  const [loadError, setLoadError] = useState('')

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

  return (
    <div>
      <AdminPageHeader
        title="배송"
        description="한 번에 배송 신청한 상품끼리 한 박스로 묶여 있어요. 송장번호를 넣고 발송 처리하면 고객 보관함에도 보여요."
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
            onClick={() => { setStatus(key); setBoxes(null) }}
          >
            {label} <span className="count">{counts[key]}</span>
          </button>
        ))}
      </div>

      {loadError && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{loadError}</div>}

      {boxes === null ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : boxes.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          {status === 'requested' ? '보낼 상품이 없어요.' : '발송한 상품이 없어요.'}
        </div>
      ) : (
        boxes.map(box => (
          <ShippingBoxCard key={box.key} box={box} onShip={async (carrier, tracking) => {
            await shipBox(adminToken, box, carrier, tracking)
            await load(adminToken, status)
          }} />
        ))
      )}
    </div>
  )
}

function ShippingBoxCard({ box, onShip }: { box: ShippingBox; onShip: (carrier: string, tracking: string) => Promise<void> }) {
  const [carrier, setCarrier] = useState(CARRIERS[0])
  const [tracking, setTracking] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const a = box.address
  const shipped = box.trackingNumber != null
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

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <PackageIcon size={17} weight="fill" color="var(--accent)" /> {box.nickname}
          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-tertiary)' }}>상품 {box.items.length}종</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {shipped ? `발송 ${fmt(box.shippedAt)}` : `신청 ${fmt(box.requestedAt)}`}
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
