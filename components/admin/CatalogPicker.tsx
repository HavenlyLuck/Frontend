'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircleIcon, MagnifyingGlassIcon, PackageIcon, XIcon } from '@phosphor-icons/react'
import type { CatalogItem } from '@/lib/catalog'

// 상품 게시 폼의 "등록 상품에서 고르기" — 고르면 상품명 · 사진 · 설명(상품정보제공고시)이 채워진다.
// compact: 쿠지 상 한 줄처럼 좁은 자리에 넣을 때
export default function CatalogPicker({ items, selectedId, onSelect, compact }: {
  items: CatalogItem[] | null
  selectedId: number | null | undefined
  onSelect: (item: CatalogItem | null) => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = items?.find(i => i.id === selectedId) ?? null

  const q = query.replace(/\s+/g, '').toLowerCase()
  const list = (items ?? []).filter(i => !q || i.name.replace(/\s+/g, '').toLowerCase().includes(q))

  if (selected) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
        border: '1px solid var(--success-tint-border)', background: 'var(--success-tint)', color: 'var(--success)',
        borderRadius: 8, padding: compact ? '5px 8px' : '7px 10px', fontSize: 12, fontWeight: 600, maxWidth: '100%',
      }}>
        <CheckCircleIcon size={13} weight="fill" />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {compact ? '등록 상품' : `등록 상품에서 고름 · ${selected.name}`}
        </span>
        <button type="button" aria-label="선택 해제" onClick={() => onSelect(null)} style={{ border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
          <XIcon size={12} weight="bold" />
        </button>
      </span>
    )
  }

  return (
    <span style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)',
          borderRadius: 8, padding: compact ? '7px 9px' : '8px 12px', fontSize: compact ? 12 : 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <PackageIcon size={14} /> {compact ? '고르기' : '등록 상품에서 고르기'}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setOpen(false)} />
          <div style={{
            // 좁은 자리(쿠지 줄 끝)에서는 버튼 오른쪽 끝에 맞춰 열어야 화면 밖으로 안 나간다
            position: 'absolute', top: 'calc(100% + 6px)', ...(compact ? { right: 0 } : { left: 0 }), zIndex: 300, width: 320, maxWidth: '80vw',
            background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 10,
          }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <MagnifyingGlassIcon size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                autoFocus
                placeholder="상품명으로 찾기"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '7px 10px 7px 28px', fontSize: 13, outline: 'none' }}
              />
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items === null ? (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: 10 }}>불러오는 중...</div>
              ) : list.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: 10 }}>
                  {items.length === 0 ? <>등록된 상품이 없어요. <Link href="/admin/catalog" style={{ color: 'var(--accent-fg)' }}>상품 등록</Link>에서 먼저 올려 주세요.</> : '찾는 상품이 없어요.'}
                </div>
              ) : list.map(i => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => { onSelect(i); setOpen(false); setQuery('') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 8, padding: 8, background: 'none', color: 'inherit', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  {i.imageUrl
                    ? <img src={i.imageUrl} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    : <span style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--bg-subtle)', flexShrink: 0 }} />}
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </span>
  )
}
