'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STORAGE_ITEMS } from '@/lib/storage'
import { ADDRESSES, addAddress, type Address } from '@/lib/address'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1px solid #e2e2e4', background: '#ffffff', color: '#181818',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#767676', marginBottom: 5 }
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 400, padding: 16,
}
const modalCard: React.CSSProperties = {
  width: '100%', maxWidth: 420, background: '#ffffff', borderRadius: 16,
  padding: '24px 24px 20px', maxHeight: '85vh', overflowY: 'auto',
  boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
}

const EMPTY_ADDR_FORM = { label: '', recipient: '', phone: '', zipCode: '', address1: '', address2: '' }

export default function StoragePage() {
  const [items, setItems] = useState(STORAGE_ITEMS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')

  const [addresses, setAddresses] = useState<Address[]>(() => [...ADDRESSES])
  const [showAddrModal, setShowAddrModal] = useState(false)
  const [newAddr, setNewAddr] = useState(EMPTY_ADDR_FORM)

  const [showShipModal, setShowShipModal] = useState(false)
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null)

  const readyItems = items.filter(i => i.status === 'ready')
  const allSelected = readyItems.length > 0 && readyItems.every(i => selected.has(i.id))

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(readyItems.map(i => i.id)))
  }

  const openShipModal = () => {
    if (selected.size === 0) return
    setSelectedAddrId(addresses.find(a => a.isDefault)?.id ?? addresses[0]?.id ?? null)
    setShowShipModal(true)
  }

  const confirmShipping = () => {
    if (!selectedAddrId) return
    setItems(prev => prev.map(i => (selected.has(i.id) ? { ...i, status: 'requested' } : i)))
    setSelected(new Set())
    setShowShipModal(false)
    showToast('📦 택배 신청이 접수되었습니다!')
  }

  const handleAddAddress = () => {
    if (!newAddr.recipient.trim() || !newAddr.phone.trim() || !newAddr.address1.trim()) return
    const addr: Address = {
      id: String(Date.now()),
      label: newAddr.label.trim() || '배송지',
      recipient: newAddr.recipient.trim(),
      phone: newAddr.phone.trim(),
      zipCode: newAddr.zipCode.trim(),
      address1: newAddr.address1.trim(),
      address2: newAddr.address2.trim(),
      isDefault: addresses.length === 0,
    }
    addAddress(addr)
    setAddresses(prev => [addr, ...prev])
    setSelectedAddrId(addr.id)
    setNewAddr(EMPTY_ADDR_FORM)
    setShowAddrModal(false)
    showToast('✅ 배송지가 등록되었습니다.')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f7', padding: '48px 16px 120px' }}>
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link href="/mypage" style={{ color: '#767676', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#181818' }}>📦 보관함</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24, marginLeft: 32 }}>
          <p style={{ fontSize: 13, color: '#767676', margin: 0 }}>
            당첨되거나 구매한 상품이 보관돼요. 받고 싶은 상품을 선택해서 한 번에 택배로 받아보세요.
          </p>
          <button
            onClick={() => setShowAddrModal(true)}
            style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: '1px solid #bfe3fb', background: '#eaf6fd', color: '#1477b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            🚚 배송지 등록
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => {
            const isSelected = selected.has(item.id)
            const isReady = item.status === 'ready'
            return (
              <div
                key={item.id}
                onClick={() => isReady && toggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: '#ffffff',
                  border: `1px solid ${isSelected ? '#4fa8e888' : '#ececec'}`,
                  borderRadius: 12, padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  cursor: isReady ? 'pointer' : 'default',
                  opacity: isReady ? 1 : 0.6,
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isReady}
                  onChange={() => toggle(item.id)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 18, height: 18, accentColor: '#4fa8e8', flexShrink: 0, cursor: isReady ? 'pointer' : 'default' }}
                />
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f5f6f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                  {item.img != null ? (
                    <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    item.emoji ?? '📦'
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#181818', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: '#9a9a9a' }}>
                    <span>{item.source === '당첨' ? '🎉 당첨' : '🎰 구매'}</span>
                    <span>📅 {item.date}</span>
                    <span>{item.value}</span>
                  </div>
                </div>
                {isReady ? (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1477b8', background: '#eaf6fd', border: '1px solid #bfe3fb', borderRadius: 20, padding: '4px 12px', flexShrink: 0 }}>
                    보관 중
                  </span>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#767676', background: '#f5f6f7', border: '1px solid #e2e2e4', borderRadius: 20, padding: '4px 12px', flexShrink: 0 }}>
                    배송 신청됨
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9a9a9a', fontSize: 14 }}>
            보관함이 비어 있어요.
          </div>
        )}
      </div>

      {readyItems.length > 0 && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          background: '#ffffff', borderTop: '1px solid #ececec',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', padding: '14px 16px', zIndex: 100,
        }}>
          <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#454545', cursor: 'pointer', flexShrink: 0 }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 17, height: 17, accentColor: '#4fa8e8' }} />
              전체선택
            </label>
            <span style={{ fontSize: 13, color: '#9a9a9a', flex: 1 }}>{selected.size}개 선택됨</span>
            <button
              onClick={openShipModal}
              disabled={selected.size === 0}
              style={{
                padding: '12px 20px', borderRadius: 10, border: 'none',
                background: selected.size === 0 ? '#e2e2e4' : '#181818',
                color: selected.size === 0 ? '#9a9a9a' : '#ffffff',
                fontSize: 14, fontWeight: 700,
                cursor: selected.size === 0 ? 'default' : 'pointer',
              }}
            >
              선택 상품 배송 신청{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
          </div>
        </div>
      )}

      {/* 배송지 선택 모달 */}
      {showShipModal && (
        <div style={overlayStyle} onClick={() => setShowShipModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181818' }}>🚚 배송지 선택</div>
              <button onClick={() => setShowShipModal(false)} style={{ border: 'none', background: 'none', color: '#9a9a9a', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9a9a9a', fontSize: 13 }}>
                등록된 배송지가 없어요.<br />배송지를 먼저 등록해주세요.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {addresses.map(addr => {
                  const isSel = selectedAddrId === addr.id
                  return (
                    <label
                      key={addr.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                        borderRadius: 10, border: `1px solid ${isSel ? '#4fa8e888' : '#ececec'}`,
                        background: isSel ? '#eaf6fd' : '#ffffff', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name="ship-address"
                        checked={isSel}
                        onChange={() => setSelectedAddrId(addr.id)}
                        style={{ width: 16, height: 16, accentColor: '#4fa8e8', marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#181818' }}>{addr.label}</span>
                          {addr.isDefault && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#1477b8', background: '#eaf6fd', border: '1px solid #bfe3fb', borderRadius: 20, padding: '1px 8px' }}>기본</span>
                          )}
                          <span style={{ fontSize: 12, color: '#454545' }}>{addr.recipient}</span>
                          <span style={{ fontSize: 12, color: '#9a9a9a' }}>{addr.phone}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#767676' }}>
                          ({addr.zipCode}) {addr.address1} {addr.address2}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => setShowAddrModal(true)}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px dashed #d3ecfb', background: '#f5fbfe', color: '#1477b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
            >
              + 새 배송지 추가
            </button>

            <button
              onClick={confirmShipping}
              disabled={!selectedAddrId}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: selectedAddrId ? '#181818' : '#e2e2e4',
                color: selectedAddrId ? '#ffffff' : '#9a9a9a',
                fontSize: 14, fontWeight: 700, cursor: selectedAddrId ? 'pointer' : 'default',
              }}
            >
              이 배송지로 신청하기
            </button>
          </div>
        </div>
      )}

      {/* 배송지 등록 모달 */}
      {showAddrModal && (
        <div style={overlayStyle} onClick={() => setShowAddrModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181818' }}>🚚 배송지 등록</div>
              <button onClick={() => setShowAddrModal(false)} style={{ border: 'none', background: 'none', color: '#9a9a9a', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
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
                <div style={labelStyle}>우편번호</div>
                <input style={inputStyle} placeholder="예: 06134" value={newAddr.zipCode} onChange={e => setNewAddr(p => ({ ...p, zipCode: e.target.value }))} />
              </div>
              <div>
                <div style={labelStyle}>주소 *</div>
                <input style={inputStyle} placeholder="도로명 주소" value={newAddr.address1} onChange={e => setNewAddr(p => ({ ...p, address1: e.target.value }))} />
              </div>
              <div>
                <div style={labelStyle}>상세 주소</div>
                <input style={inputStyle} placeholder="동, 호수 등" value={newAddr.address2} onChange={e => setNewAddr(p => ({ ...p, address2: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                onClick={handleAddAddress}
                disabled={!newAddr.recipient.trim() || !newAddr.phone.trim() || !newAddr.address1.trim()}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                  background: newAddr.recipient.trim() && newAddr.phone.trim() && newAddr.address1.trim() ? '#181818' : '#e2e2e4',
                  color: newAddr.recipient.trim() && newAddr.phone.trim() && newAddr.address1.trim() ? '#ffffff' : '#9a9a9a',
                  fontSize: 14, fontWeight: 700,
                  cursor: newAddr.recipient.trim() && newAddr.phone.trim() && newAddr.address1.trim() ? 'pointer' : 'default',
                }}
              >
                등록하기
              </button>
              <button
                onClick={() => { setShowAddrModal(false); setNewAddr(EMPTY_ADDR_FORM) }}
                style={{ padding: '11px 24px', borderRadius: 10, border: '1px solid #e2e2e4', background: '#f5f6f7', color: '#767676', fontSize: 14, cursor: 'pointer' }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', left: '50%', bottom: readyItems.length > 0 ? 90 : 24, transform: 'translateX(-50%)',
        background: '#181818', color: '#ffffff', fontSize: 13, fontWeight: 600,
        padding: '12px 20px', borderRadius: 10, opacity: toast ? 1 : 0,
        pointerEvents: 'none', transition: 'opacity 0.25s, bottom 0.25s', zIndex: 500,
      }}>
        {toast || ' '}
      </div>
    </div>
  )
}
