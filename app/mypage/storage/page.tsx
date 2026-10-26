'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArchiveIcon, CalendarIcon, ConfettiIcon, MagnifyingGlassIcon, MapPinIcon, PackageIcon, ShoppingBagIcon, TrashIcon, TruckIcon, XIcon } from '@phosphor-icons/react'
import { useStorage } from '@/hooks/useStorage'
import { notifyStorageUpdated } from '@/lib/storage'
import { getValidSession } from '@/lib/auth'
import {
  ApiError,
  cancelStorePurchase,
  createAddress,
  deleteAddress,
  getMyAddresses,
  MAX_ADDRESSES,
  requestShipping,
  searchAddress,
  setDefaultAddress,
  type AddressResponse,
  type AddressSearchItem,
  type StorageItemResponse,
} from '@/lib/api'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 400, padding: 16,
}
const modalCard: React.CSSProperties = {
  width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 16,
  padding: '24px 24px 20px', maxHeight: '85vh', overflowY: 'auto',
  boxShadow: 'var(--shadow-lg)',
}

const headerBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
  border: '1px solid var(--accent-tint-border)', background: 'var(--accent-tint)', color: 'var(--accent-fg)',
  fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
}

const EMPTY_ADDR_FORM = { label: '', recipient: '', phone: '', zipCode: '', address1: '', address2: '', isDefault: false }

function itemTitle(item: StorageItemResponse) {
  return item.quantity > 1 ? `${item.product_name} x${item.quantity}` : item.product_name
}

function itemValue(item: StorageItemResponse) {
  if (item.source === 'raffle') return item.price_krw != null ? `정가 ${item.price_krw.toLocaleString()}원` : ''
  if (item.amount_spent != null && item.pay_type) {
    return item.pay_type === 'cash' ? `${item.amount_spent.toLocaleString()}원` : `${item.amount_spent.toLocaleString()} 쌀포인트`
  }
  return ''
}

function errorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : '요청 처리 중 오류가 발생했습니다.'
}

export default function StoragePage() {
  const { items, setItems, loaded } = useStorage()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [showAddrModal, setShowAddrModal] = useState(false)
  const [newAddr, setNewAddr] = useState(EMPTY_ADDR_FORM)
  const [showDefaultModal, setShowDefaultModal] = useState(false)

  const [showAddrSearch, setShowAddrSearch] = useState(false)
  const [addrKeyword, setAddrKeyword] = useState('')
  const [addrResults, setAddrResults] = useState<AddressSearchItem[] | null>(null)
  const [addrSearching, setAddrSearching] = useState(false)
  const [addrSearchError, setAddrSearchError] = useState('')

  const [showShipModal, setShowShipModal] = useState(false)
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null)

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

  // 5개가 넘으면 서버가 오래된 배송지를 정리하므로 등록 후엔 목록을 다시 받는다
  const reloadAddresses = async (token: string) => {
    try {
      setAddresses(await getMyAddresses(token))
    } catch {
      // 목록 갱신 실패 시 이전 목록 유지
    }
  }

  // 배송 신청한 상품은 배송 내역으로 옮겨가고, 보관함에는 보관 중인 것만 남는다
  const readyItems = items.filter(i => i.status === 'ready')
  const allSelected = readyItems.length > 0 && readyItems.every(i => selected.has(i.storage_item_id))

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(readyItems.map(i => i.storage_item_id)))
  }

  const openShipModal = () => {
    if (selected.size === 0) return
    setSelectedAddrId(addresses.find(a => a.is_default)?.address_id ?? addresses[0]?.address_id ?? null)
    setShowShipModal(true)
  }

  const confirmShipping = async () => {
    if (!selectedAddrId || submitting) return
    const session = await getValidSession()
    if (!session) return
    setSubmitting(true)
    try {
      setItems(await requestShipping(session.token, Array.from(selected), selectedAddrId))
      setSelected(new Set())
      setShowShipModal(false)
      notifyStorageUpdated()
      showToast('배송 신청이 접수되었어요. 배송 내역에서 확인할 수 있어요.')
    } catch (err) {
      showToast(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const atAddressLimit = addresses.length >= MAX_ADDRESSES
  const oldestRemovable = [...addresses].filter(a => !a.is_default).sort((a, b) => (a.created_at < b.created_at ? -1 : 1))[0]
  const address2Ref = useRef<HTMLInputElement>(null)

  const resetAddrSearch = () => {
    setAddrKeyword('')
    setAddrResults(null)
    setAddrSearchError('')
  }

  const openAddrSearch = () => {
    resetAddrSearch()
    setShowAddrSearch(true)
  }

  const closeAddrModal = () => {
    setShowAddrModal(false)
    setShowAddrSearch(false)
    setNewAddr(EMPTY_ADDR_FORM)
    resetAddrSearch()
  }

  const handleSearchAddress = async () => {
    const keyword = addrKeyword.trim()
    if (keyword.length < 2 || addrSearching) return
    const session = await getValidSession()
    if (!session) return
    setAddrSearching(true)
    setAddrSearchError('')
    try {
      const res = await searchAddress(session.token, keyword)
      setAddrResults(res.items)
    } catch (err) {
      setAddrResults(null)
      setAddrSearchError(errorMessage(err))
    } finally {
      setAddrSearching(false)
    }
  }

  const pickSearchResult = (item: AddressSearchItem) => {
    setNewAddr(p => ({ ...p, zipCode: item.zip_code, address1: item.road_address }))
    setShowAddrSearch(false)
    resetAddrSearch()
    setTimeout(() => address2Ref.current?.focus(), 0)
  }

  const handleAddAddress = async () => {
    if (!newAddr.recipient.trim() || !newAddr.phone.trim() || !newAddr.address1.trim() || submitting) return
    const session = await getValidSession()
    if (!session) return
    setSubmitting(true)
    try {
      const addr = await createAddress(session.token, {
        label: newAddr.label,
        recipient: newAddr.recipient,
        phone: newAddr.phone,
        zip_code: newAddr.zipCode,
        address1: newAddr.address1,
        address2: newAddr.address2,
        is_default: newAddr.isDefault,
      })
      await reloadAddresses(session.token)
      setSelectedAddrId(addr.address_id)
      closeAddrModal()
      showToast('배송지가 등록되었습니다.')
    } catch (err) {
      showToast(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetDefault = async (addressId: number) => {
    if (submitting) return
    const session = await getValidSession()
    if (!session) return
    setSubmitting(true)
    try {
      await setDefaultAddress(session.token, addressId)
      await reloadAddresses(session.token)
      showToast('기본 배송지가 변경되었습니다.')
    } catch (err) {
      showToast(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelPurchase = async (item: StorageItemResponse) => {
    if (submitting) return
    if (!window.confirm(`'${itemTitle(item)}' 구매를 취소할까요?\n카드 결제는 취소되고 환불까지 며칠 걸릴 수 있어요.`)) return
    const session = await getValidSession()
    if (!session) return
    setSubmitting(true)
    try {
      setItems(await cancelStorePurchase(session.token, item.storage_item_id))
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(item.storage_item_id)
        return next
      })
      notifyStorageUpdated()
      showToast('구매가 취소되었어요.')
    } catch (err) {
      showToast(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAddress = async (addr: AddressResponse) => {
    if (submitting) return
    if (!window.confirm(`'${addr.label}' 배송지를 삭제할까요?`)) return
    const session = await getValidSession()
    if (!session) return
    setSubmitting(true)
    try {
      await deleteAddress(session.token, addr.address_id)
      await reloadAddresses(session.token)
      if (selectedAddrId === addr.address_id) setSelectedAddrId(null)
      showToast('배송지가 삭제되었습니다.')
    } catch (err) {
      showToast(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><ArchiveIcon size={17} weight="fill" color="var(--accent)" /> 보관함</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          당첨되거나 구매한 상품이 보관돼요. 받고 싶은 상품을 선택해서 한 번에 택배로 받아보세요.
        </p>
        <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
          <Link href="/mypage/shipping" style={{ ...headerBtnStyle, textDecoration: 'none' }}>
            <PackageIcon size={13} weight="fill" /> 배송 내역
          </Link>
          <button onClick={() => setShowDefaultModal(true)} style={headerBtnStyle}>
            <MapPinIcon size={13} weight="fill" /> 배송지 관리
          </button>
          <button onClick={() => setShowAddrModal(true)} style={headerBtnStyle}>
            <TruckIcon size={13} weight="fill" /> 배송지 등록
          </button>
        </div>
      </div>

      {readyItems.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 17, height: 17, accentColor: 'var(--accent)' }} />
            전체선택
          </label>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{selected.size}개 선택됨</span>
        </div>
      )}

      <div className="entry-list">
        {readyItems.map(item => {
          const isSelected = selected.has(item.storage_item_id)
          const title = itemTitle(item)
          const value = itemValue(item)
          return (
            <div
              key={item.storage_item_id}
              onClick={() => toggle(item.storage_item_id)}
              className="entry-item"
              style={{
                cursor: 'pointer',
                background: isSelected ? 'var(--accent-tint)' : undefined,
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(item.storage_item_id)}
                onClick={e => e.stopPropagation()}
                style={{ width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0, cursor: 'pointer' }}
              />
              <div className="entry-emoji">
                {item.image_url != null ? (
                  <img src={item.image_url} alt={title} />
                ) : (
                  '📦'
                )}
              </div>
              <div className="entry-info">
                <div className="entry-title">{title}</div>
                <div className="entry-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    {item.source === 'store' ? <ShoppingBagIcon size={12} /> : <ConfettiIcon size={12} color="var(--gold)" />} {item.source === 'store' ? '구매' : item.source === 'kuji' ? '쿠지 당첨' : '당첨'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> {item.created_at.slice(0, 10)}</span>
                  {value && <span>{value}</span>}
                </div>
              </div>
              <div className="entry-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className="status-badge waiting">보관 중</span>
                {/* 카드 결제 상점 구매만 취소 가능 — 쌀포인트 구매는 취소 불가 */}
                {item.source === 'store' && item.pay_type === 'cash' && (
                  <button
                    onClick={e => { e.stopPropagation(); handleCancelPurchase(item) }}
                    disabled={submitting}
                    style={{
                      padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)',
                      color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    구매 취소
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {loaded && readyItems.length === 0 && (
        <div className="coming-soon-box">
          <div className="desc">보관함이 비어 있어요.</div>
        </div>
      )}

      {readyItems.length > 0 && (
        <button
          onClick={openShipModal}
          disabled={selected.size === 0}
          style={{
            width: '100%', marginTop: 16, padding: '13px 20px', borderRadius: 10, border: 'none',
            background: selected.size === 0 ? 'var(--border)' : 'var(--accent)',
            color: selected.size === 0 ? 'var(--text-tertiary)' : '#ffffff',
            fontSize: 14, fontWeight: 700,
            cursor: selected.size === 0 ? 'default' : 'pointer',
          }}
        >
          선택 상품 배송 신청{selected.size > 0 ? ` (${selected.size})` : ''}
        </button>
      )}

      {/* 배송지 선택 모달 */}
      {showShipModal && (
        <div style={overlayStyle} onClick={() => setShowShipModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}><TruckIcon size={17} weight="fill" color="var(--accent)" /> 배송지 선택</div>
              <button onClick={() => setShowShipModal(false)} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: 18, cursor: 'pointer', lineHeight: 1, display: 'flex' }}><XIcon size={18} /></button>
            </div>

            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                등록된 배송지가 없어요.<br />배송지를 먼저 등록해주세요.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {addresses.map(addr => {
                  const isSel = selectedAddrId === addr.address_id
                  return (
                    <label
                      key={addr.address_id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                        borderRadius: 10, border: `1px solid ${isSel ? 'var(--accent-tint-border)' : 'var(--border)'}`,
                        background: isSel ? 'var(--accent-tint)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name="ship-address"
                        checked={isSel}
                        onChange={() => setSelectedAddrId(addr.address_id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)', marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{addr.label}</span>
                          {addr.is_default && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-fg)', background: 'var(--accent-tint)', border: '1px solid var(--accent-tint-border)', borderRadius: 20, padding: '1px 8px' }}>기본</span>
                          )}
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{addr.recipient}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{addr.phone}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {addr.zip_code && `(${addr.zip_code}) `}{addr.address1} {addr.address2}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => setShowAddrModal(true)}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px dashed var(--accent-tint-border)', background: 'var(--accent-tint)', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
            >
              + 새 배송지 추가
            </button>

            <button
              onClick={confirmShipping}
              disabled={!selectedAddrId || submitting}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: selectedAddrId ? 'var(--accent)' : 'var(--border)',
                color: selectedAddrId ? '#ffffff' : 'var(--text-tertiary)',
                fontSize: 14, fontWeight: 700, cursor: selectedAddrId ? 'pointer' : 'default',
              }}
            >
              이 배송지로 신청하기
            </button>
          </div>
        </div>
      )}

      {/* 배송지 관리 모달 — 등록된 배송지 목록과 기본 배송지 지정 */}
      {showDefaultModal && (
        <div style={overlayStyle} onClick={() => setShowDefaultModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPinIcon size={17} weight="fill" color="var(--accent)" /> 배송지 관리
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>{addresses.length}/{MAX_ADDRESSES}</span>
              </div>
              <button onClick={() => setShowDefaultModal(false)} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: 18, cursor: 'pointer', lineHeight: 1, display: 'flex' }}><XIcon size={18} /></button>
            </div>

            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                등록된 배송지가 없어요.<br />배송지를 먼저 등록해주세요.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {addresses.map(addr => (
                  <div
                    key={addr.address_id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10,
                      border: `1px solid ${addr.is_default ? 'var(--accent-tint-border)' : 'var(--border)'}`,
                      background: addr.is_default ? 'var(--accent-tint)' : 'var(--surface)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{addr.label}</span>
                        {addr.is_default && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-fg)', background: 'var(--surface)', border: '1px solid var(--accent-tint-border)', borderRadius: 20, padding: '1px 8px' }}>기본</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{addr.recipient} · {addr.phone}</div>
                      <div style={{ fontSize: 12, color: 'var(--text)' }}>
                        {addr.zip_code && `(${addr.zip_code}) `}{addr.address1} {addr.address2}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {!addr.is_default && (
                        <button
                          onClick={() => handleSetDefault(addr.address_id)}
                          disabled={submitting}
                          style={{
                            padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-strong)',
                            background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          기본으로 지정
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr)}
                        disabled={submitting}
                        aria-label={`${addr.label} 배송지 삭제`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8,
                          border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--danger, #e5484d)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <TrashIcon size={12} weight="bold" /> 삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAddrModal(true)}
              style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#ffffff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              + 새 배송지 추가
            </button>
          </div>
        </div>
      )}

      {/* 배송지 등록 모달 */}
      {showAddrModal && (
        <div style={overlayStyle} onClick={closeAddrModal}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}><TruckIcon size={17} weight="fill" color="var(--accent)" /> 배송지 등록</div>
              <button onClick={closeAddrModal} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: 18, cursor: 'pointer', lineHeight: 1, display: 'flex' }}><XIcon size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={labelStyle}>배송지 별칭 (선택)</div>
                <input style={inputStyle} placeholder="예: 집, 회사" value={newAddr.label} onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>받는 사람 *</div>
                  <input style={inputStyle} placeholder="이름" value={newAddr.recipient} onChange={e => setNewAddr(p => ({ ...p, recipient: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>연락처 *</div>
                  <input style={inputStyle} placeholder="010-0000-0000" value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <div style={labelStyle}>주소 *</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    style={{ ...inputStyle, width: 120, flexShrink: 0, cursor: 'pointer' }}
                    placeholder="우편번호"
                    value={newAddr.zipCode}
                    readOnly
                    onClick={openAddrSearch}
                  />
                  <button
                    onClick={openAddrSearch}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 14px', borderRadius: 8, border: 'none',
                      background: 'var(--accent)', color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <MagnifyingGlassIcon size={14} weight="bold" /> 주소 검색
                  </button>
                </div>
                <input
                  style={{ ...inputStyle, cursor: 'pointer', marginBottom: 8 }}
                  placeholder="주소 검색 버튼을 눌러주세요"
                  value={newAddr.address1}
                  readOnly
                  onClick={openAddrSearch}
                />
                <input
                  ref={address2Ref}
                  style={inputStyle}
                  placeholder="상세 주소 (동, 호수 등)"
                  value={newAddr.address2}
                  onChange={e => setNewAddr(p => ({ ...p, address2: e.target.value }))}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newAddr.isDefault || addresses.length === 0}
                  disabled={addresses.length === 0}
                  onChange={e => setNewAddr(p => ({ ...p, isDefault: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                />
                기본 배송지로 지정
              </label>
              {atAddressLimit && oldestRemovable && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                  배송지는 최대 {MAX_ADDRESSES}개까지 저장돼요. 등록하면 가장 오래된 &lsquo;{oldestRemovable.label}&rsquo; 배송지가 삭제돼요.
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                onClick={handleAddAddress}
                disabled={!newAddr.recipient.trim() || !newAddr.phone.trim() || !newAddr.address1.trim()}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                  background: newAddr.recipient.trim() && newAddr.phone.trim() && newAddr.address1.trim() ? 'var(--accent)' : 'var(--border)',
                  color: newAddr.recipient.trim() && newAddr.phone.trim() && newAddr.address1.trim() ? '#ffffff' : 'var(--text-tertiary)',
                  fontSize: 14, fontWeight: 700,
                  cursor: newAddr.recipient.trim() && newAddr.phone.trim() && newAddr.address1.trim() ? 'pointer' : 'default',
                }}
              >
                등록하기
              </button>
              <button
                onClick={closeAddrModal}
                style={{ padding: '11px 24px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주소 검색 모달 (배송지 등록 모달 위에 뜬다) */}
      {showAddrSearch && (
        <div style={{ ...overlayStyle, zIndex: 450 }} onClick={() => setShowAddrSearch(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}><MagnifyingGlassIcon size={17} weight="bold" color="var(--accent)" /> 주소 검색</div>
              <button onClick={() => setShowAddrSearch(false)} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: 18, cursor: 'pointer', lineHeight: 1, display: 'flex' }}><XIcon size={18} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                autoFocus
                style={inputStyle}
                placeholder="도로명, 건물명, 지번 (예: 테헤란로 152)"
                value={addrKeyword}
                onChange={e => setAddrKeyword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSearchAddress() }}
              />
              <button
                onClick={handleSearchAddress}
                disabled={addrKeyword.trim().length < 2 || addrSearching}
                style={{
                  flexShrink: 0, padding: '0 16px', borderRadius: 8, border: 'none',
                  background: addrKeyword.trim().length < 2 ? 'var(--border)' : 'var(--accent)',
                  color: addrKeyword.trim().length < 2 ? 'var(--text-tertiary)' : '#ffffff',
                  fontSize: 13, fontWeight: 700, cursor: addrKeyword.trim().length < 2 ? 'default' : 'pointer',
                }}
              >
                {addrSearching ? '검색 중' : '검색'}
              </button>
            </div>
            {addrSearchError && (
              <div style={{ fontSize: 12, color: 'var(--danger, #e5484d)', marginTop: 8 }}>{addrSearchError}</div>
            )}
            {addrResults === null ? (
              !addrSearchError && (
                <div style={{ padding: '24px 0 8px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
                  도로명 + 건물번호, 건물명, 동/리 + 번지로 검색하세요.
                </div>
              )
            ) : (
              <div style={{ marginTop: 12, maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                {addrResults.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>검색 결과가 없어요.</div>
                ) : addrResults.map((item, i) => (
                  <button
                    key={`${item.zip_code}-${item.road_address}`}
                    onClick={() => pickSearchResult(item)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '11px 12px', border: 'none',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                      <span style={{ color: 'var(--accent-fg)', fontWeight: 700, marginRight: 6 }}>{item.zip_code}</span>
                      {item.road_address}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>지번 {item.jibun_address}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)',
        background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
        padding: '12px 20px', borderRadius: 10, opacity: toast ? 1 : 0,
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'none', transition: 'opacity 0.25s, bottom 0.25s', zIndex: 500,
      }}>
        {toast || ' '}
      </div>
    </div>
  )
}
