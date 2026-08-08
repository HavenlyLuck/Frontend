'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STORAGE_ITEMS } from '@/lib/storage'

export default function StoragePage() {
  const [items, setItems] = useState(STORAGE_ITEMS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState(false)

  const readyItems = items.filter(i => i.status === 'ready')
  const allSelected = readyItems.length > 0 && readyItems.every(i => selected.has(i.id))

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

  const requestShipping = () => {
    if (selected.size === 0) return
    setItems(prev => prev.map(i => (selected.has(i.id) ? { ...i, status: 'requested' } : i)))
    setSelected(new Set())
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f7', padding: '48px 16px 120px' }}>
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link href="/mypage" style={{ color: '#767676', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#181818' }}>📦 보관함</h2>
        </div>
        <p style={{ fontSize: 13, color: '#767676', marginBottom: 24, marginLeft: 32 }}>
          당첨되거나 구매한 상품이 보관돼요. 받고 싶은 상품을 선택해서 한 번에 택배로 받아보세요.
        </p>

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
              onClick={requestShipping}
              disabled={selected.size === 0}
              style={{
                padding: '12px 20px', borderRadius: 10, border: 'none',
                background: selected.size === 0 ? '#e2e2e4' : '#181818',
                color: selected.size === 0 ? '#9a9a9a' : '#ffffff',
                fontSize: 14, fontWeight: 700,
                cursor: selected.size === 0 ? 'default' : 'pointer',
              }}
            >
              선택 상품 택배 신청{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', left: '50%', bottom: readyItems.length > 0 ? 90 : 24, transform: 'translateX(-50%)',
        background: '#181818', color: '#ffffff', fontSize: 13, fontWeight: 600,
        padding: '12px 20px', borderRadius: 10, opacity: toast ? 1 : 0,
        pointerEvents: 'none', transition: 'opacity 0.25s, bottom 0.25s', zIndex: 200,
      }}>
        📦 택배 신청이 접수되었습니다!
      </div>
    </div>
  )
}
