'use client'

export default function EungmoPage() {
  return (
    <div>
      <div className="home-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div className="section-title"><span className="emoji">🎟</span> 응모상품</div>
          <a href="/guide#응모" style={{ fontSize: 12, color: '#767676', textDecoration: 'none', border: '1px solid #e2e2e4', borderRadius: 8, padding: '4px 12px', background: '#f5f6f7' }}>
            도움이 필요하다면?
          </a>
        </div>

        <div className="coming-soon-box large">
          <div className="emoji">🎟</div>
          <div className="title">상품 준비중</div>
          <div className="desc">응모 상품을 준비하고 있어요. 조금만 기다려주세요!</div>
        </div>
      </div>
    </div>
  )
}
