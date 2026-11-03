'use client'

import { useEffect, useState } from 'react'
import { CalendarIcon, ConfettiIcon, MapPinIcon, PackageIcon, ShoppingBagIcon, TruckIcon } from '@phosphor-icons/react'
import { useStorage } from '@/hooks/useStorage'
import ParcelTrackingModal from '@/components/ParcelTrackingModal'
import { getValidSession } from '@/lib/auth'
import { getMyAddresses, type AddressResponse, type StorageItemResponse } from '@/lib/api'
import { formatKstDate } from '@/lib/date'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 10

// 발송(shipped) 후 배송 조회에서 배송완료가 확인되면(delivered_at) 배송 완료, 그 전에는 배송중
type ShippingStatus = 'requested' | 'in_transit' | 'delivered'
type Filter = 'all' | ShippingStatus

const STATUS_LABEL: Record<ShippingStatus, string> = { requested: '배송 신청됨', in_transit: '배송중', delivered: '배송 완료' }
const STATUS_BADGE: Record<ShippingStatus, string> = { requested: 'waiting', in_transit: 'ongoing', delivered: 'win' }
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'requested', label: '배송 신청됨' },
  { id: 'in_transit', label: '배송중' },
  { id: 'delivered', label: '배송 완료' },
]

function shippingStatus(item: StorageItemResponse): ShippingStatus {
  if (item.status !== 'shipped') return 'requested'
  return item.delivered_at ? 'delivered' : 'in_transit'
}

// 화면에 보이는 한 줄 — 발송된 상품은 같은 송장(택배사+송장번호)끼리 한 상자로 묶고, 발송 전 상품은 하나씩
interface Parcel {
  key: string
  items: StorageItemResponse[]
  status: ShippingStatus
}

function groupParcels(items: StorageItemResponse[]): Parcel[] {
  const parcels = new Map<string, Parcel>()
  for (const item of items) {
    const key = item.status === 'shipped' && item.tracking_number
      ? `t|${item.carrier}|${item.tracking_number}`
      : `i|${item.storage_item_id}`
    const parcel = parcels.get(key)
    if (parcel) parcel.items.push(item)
    else parcels.set(key, { key, items: [item], status: shippingStatus(item) })
  }
  return Array.from(parcels.values())
}

function parcelTitle(parcel: Parcel) {
  const first = itemTitle(parcel.items[0])
  return parcel.items.length > 1 ? `${first} 외 ${parcel.items.length - 1}개` : first
}

function itemTitle(item: StorageItemResponse) {
  return item.quantity > 1 ? `${item.product_name} x${item.quantity}` : item.product_name
}

export default function ShippingHistoryPage() {
  const { items, loaded, reload } = useStorage()
  // 배송 조회 팝업에 띄울 상품
  const [tracking, setTracking] = useState<Parcel | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
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
  const parcels = groupParcels(shippingItems)
  const visible = filter === 'all' ? parcels : parcels.filter(p => p.status === filter)
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const countOf = (f: Filter) => (f === 'all' ? parcels.length : parcels.filter(p => p.status === f).length)
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
              onClick={() => { setFilter(f.id); setPage(1) }}
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
        {pageItems.map(parcel => {
          const item = parcel.items[0]
          const title = parcelTitle(parcel)
          const status = parcel.status
          const grouped = parcel.items.length > 1
          const addr = item.address_id != null ? addressById.get(item.address_id) : undefined
          return (
            <div key={parcel.key} className="entry-item" style={{ cursor: 'default' }}>
              <div className="entry-emoji" style={{ position: 'relative' }}>
                {item.image_url != null ? <img src={item.image_url} alt={title} /> : '📦'}
                {grouped && <span className="parcel-count">{parcel.items.length}</span>}
              </div>
              <div className="entry-info">
                <div className="entry-title">{title}</div>
                <div className="entry-meta">
                  {grouped ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <PackageIcon size={12} /> 한 상자에 {parcel.items.length}개
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      {item.source === 'store' ? <ShoppingBagIcon size={12} /> : <ConfettiIcon size={12} color="var(--gold)" />} {item.source === 'store' ? '구매' : item.source === 'kuji' ? '쿠지 당첨' : '당첨'}
                    </span>
                  )}
                  {item.requested_at && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> {formatKstDate(item.requested_at)} 신청</span>
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
                {grouped && (
                  <ul className="parcel-items">
                    {parcel.items.map(i => <li key={i.storage_item_id}>{itemTitle(i)}</li>)}
                  </ul>
                )}
              </div>
              <div className="entry-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className={`status-badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
                {item.carrier && item.tracking_number && (
                  <button type="button" className="entry-cancel-btn" onClick={() => setTracking(parcel)}>
                    배송 조회
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} label="배송 내역 페이지" />

      {tracking && tracking.items[0].carrier && tracking.items[0].tracking_number && (
        <ParcelTrackingModal
          carrier={tracking.items[0].carrier}
          trackingNumber={tracking.items[0].tracking_number}
          productName={parcelTitle(tracking)}
          onClose={() => setTracking(null)}
          onDelivered={() => { if (tracking.status !== 'delivered') reload() }}
        />
      )}

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
