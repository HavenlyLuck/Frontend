'use client'

import { useState } from 'react'
import { GiftIcon } from '@phosphor-icons/react'
import KujiCard from '@/components/KujiCard'
import { KUJI_LIST } from '@/lib/kujiList'

const SORTS = ['최신순', '마감임박순', '참여율 높은순', '참여율 낮은순']

export default function KujiPage() {
  const [sort, setSort] = useState('최신순')

  return (
    <div>
      <div className="home-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div className="section-title"><GiftIcon size={18} weight="fill" color="var(--accent)" /> 쿠지상품</div>
          <a href="/guide#쿠지" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', background: 'var(--bg-subtle)' }}>
            도움이 필요하다면?
          </a>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', marginBottom: 28 }}>
          {SORTS.map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${sort === s ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
                background: sort === s ? 'var(--accent-tint)' : 'var(--surface)',
                color: sort === s ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: sort === s ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="product-grid-home">
          {KUJI_LIST.map(item => (
            <KujiCard key={item.href} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
