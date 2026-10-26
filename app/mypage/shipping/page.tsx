'use client'

import { useEffect, useState } from 'react'
import { CalendarIcon, ConfettiIcon, MapPinIcon, PackageIcon, ShoppingBagIcon, TruckIcon } from '@phosphor-icons/react'
import { useStorage } from '@/hooks/useStorage'
import { getValidSession } from '@/lib/auth'
import { getMyAddresses, type AddressResponse, type StorageItemResponse } from '@/lib/api'

type ShippingStatus = 'requested' | 'shipped'
type Filter = 'all' | ShippingStatus

const STATUS_LABEL: Record<ShippingStatus, string> = { requested: '배송 신청됨', shipped: '배송 완료' }
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'requested', label: '배송 신청됨' },
  { id: 'shipped', label: '배송 완료' },
]

function itemTitle(item: StorageItemResponse) {
  return item.quantity > 1 ? `${item.product_name} x${item.quantity}` : item.product_name
}

export default function ShippingHistoryPage() {
  const { items, loaded } = useStorage()
  const [filter, setFilter] = useState<Filter>('all')
  const [addresses, setAddresses] = useState<AddressResponse[]>([])

  useEffect(() => {
    let cancelled = false
    getValidSession().then(session => {
      if (!session) return
      getMyAddresses(session.token)
        .then(data => { if (!cancelled) setAddresses(data) })
        .catch(() => {})
    })
    return () => { cancelled = true }
  }, [])

  // 보관함에서 배송 신청한 상품만 — 최근에 신청한 순
  const shippingItems = items
    .filter(i => i.status !== 'ready')
    .sort((a, b) => ((a.requested_at ?? '') < (b.requested_at ?? '') ? 1 : -1))
  const visible = filter === 'all' ? shippingItems : shippingItems.filter(i => i.status === filter)
  const countOf = (f: Filter) => (f === 'all' ? shippingItems.length : shippingItems.filter(i => i.status === f).length)
  const addressById = new Map(addresses.map(a => [a.address_id, a]))

  return (
    <div>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><PackageIcon size={17} weight="fill" color="var(--accent)" /> 배송 내역</div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
        보관함에서 배송 신청한 상품의 진행 상황을 확인할 수 있어요.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${active ? 'var(--accent-tint-border)' : 'var(--border)'}`,
                background: active ? 'var(--accent-tint)' : 'var(--surface)',
                color: active ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              {f.label} {countOf(f.id)}
            </button>
          )
        })}
      </div>

      <div className="entry-list">
        {visible.map(item => {
          const title = itemTitle(item)
          const status = item.status as ShippingStatus
          const addr = item.address_id != null ? addressById.get(item.address_id) : undefined
          return (
            <div key={item.storage_item_id} className="entry-item" style={{ cursor: 'default' }}>
              <div className="entry-emoji">
                {item.image_url != null ? <img src={item.image_url} alt={title} /> : '📦'}
              </div>
              <div className="entry-info">
                <div className="entry-title">{title}</div>
                <div className="entry-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    {item.source === 'store' ? <ShoppingBagIcon size={12} /> : <ConfettiIcon size={12} color="var(--gold)" />} {item.source === 'store' ? '구매' : item.source === 'kuji' ? '쿠지 당첨' : '당첨'}
                  </span>
                  {item.requested_at && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> {item.requested_at.slice(0, 10)} 신청</span>
                  )}
                  {addr && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPinIcon size={12} /> {addr.label || addr.recipient}</span>
                  )}
                  {item.tracking_number && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <TruckIcon size={12} /> {item.carrier} {item.tracking_number}
                    </span>
                  )}
                </div>
              </div>
              <div className="entry-status">
                <span className={`status-badge ${status === 'shipped' ? 'win' : 'ongoing'}`}>{STATUS_LABEL[status]}</span>
              </div>
            </div>
          )
        })}
      </div>

      {loaded && visible.length === 0 && (
        <div className="coming-soon-box">
          <div className="desc">
            {filter === 'all' ? '아직 배송 신청한 상품이 없어요.' : `${STATUS_LABEL[filter]} 상품이 없어요.`}
          </div>
        </div>
      )}
    </div>
  )
}
