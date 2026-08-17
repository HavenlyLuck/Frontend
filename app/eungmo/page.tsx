'use client'

import { TicketIcon } from '@phosphor-icons/react'

export default function EungmoPage() {
  return (
    <div>
      <div className="home-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div className="section-title"><TicketIcon size={18} weight="fill" color="var(--accent)" /> 응모상품</div>
          <a href="/guide#응모" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', background: 'var(--bg-subtle)' }}>
            도움이 필요하다면?
          </a>
        </div>

        <div className="coming-soon-box large">
          <div className="emoji"><TicketIcon size={32} weight="light" /></div>
          <div className="title">상품 준비중</div>
          <div className="desc">응모 상품을 준비하고 있어요. 조금만 기다려주세요!</div>
        </div>
      </div>
    </div>
  )
}
