'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/data'

function formatCountdown(seconds: number, urgent: boolean): string {
  if (seconds <= 0) return '마감'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (urgent || d === 0) return `🔥 ${pad(h)}:${pad(m)}:${pad(s)} 남음`
  return `⏱ ${d}일 ${pad(h)}:${pad(m)}:${pad(s)} 남음`
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProduct(params.id)
  if (!product) notFound()

  const [ticketCount, setTicketCount] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [entryCount, setEntryCount] = useState(product.raffle.currentEntries)
  const [remaining, setRemaining] = useState(product.raffle.remainingSeconds)
  const [activeThumb, setActiveThumb] = useState(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setRemaining(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  const progressPct = Math.min(100, Math.round((entryCount / product.raffle.totalSlots) * 100))
  const winRate = entryCount > 0 ? ((1 / entryCount) * 100).toFixed(1) : '0.0'
  const countdownText = formatCountdown(remaining, product.raffle.urgent)

  const changeTicket = (delta: number) =>
    setTicketCount(prev => Math.min(5, Math.max(1, prev + delta)))

  const submitRaffle = () => {
    setModalOpen(false)
    setEntryCount(prev => prev + ticketCount)
    setShowToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowToast(false), 3500)
  }

  const thumbEmojis = ['💻', '🖥️', '⌨️']

  return (
    <div className="home-neon">
      <div className="container">
        <div className="breadcrumb">
          <span><Link href="/">홈</Link></span>
          <span>{product.category}</span>
          <span>{product.subcategory}</span>
        </div>

        <div className="product-layout">
          {/* 왼쪽: 이미지 + 셀러 */}
          <div className="image-area">
            <div className="main-image">
              {product.image ? (
                <img src={product.image} alt={product.title.replace('\n', ' ')} />
              ) : (
                <div className="image-placeholder">
                  <span className="cam">{product.emoji}</span>
                  <span style={{ fontSize: '14px', color: '#8a8a8a' }}>
                    {product.title.replace('\n', ' ')}
                  </span>
                </div>
              )}
            </div>

            <div className="thumb-row">
              {product.thumbs.map((thumb, i) => (
                <div
                  key={i}
                  className={`thumb ${activeThumb === i ? 'active' : ''}`}
                  onClick={() => setActiveThumb(i)}
                >
                  {thumb ? (
                    <img src={thumb} alt="" />
                  ) : (
                    thumbEmojis[i] ?? product.emoji
                  )}
                </div>
              ))}
            </div>

            <div className="seller-card">
              <div className="seller-avatar">{product.seller.avatar}</div>
              <div className="seller-info">
                <div className="seller-name">{product.seller.name}</div>
                <div className="seller-meta">
                  <span>📦 거래 {product.seller.trades}회</span>
                  <span>📍 {product.seller.location}</span>
                </div>
              </div>
              <div className="seller-rating">⭐ {product.seller.rating}</div>
            </div>
          </div>

          {/* 오른쪽: 상품 정보 */}
          <div className="info-panel">
            <div className="status-row">
              <span className="badge on-sale">판매 중</span>
              <span className="badge raffle">🎟 응모 진행 중</span>
              {product.raffle.urgent && <span className="badge urgent">🔥 마감 임박</span>}
            </div>

            <div className="product-title">{product.title}</div>
            <div className="price">{product.price}</div>
            <div className="price-sub">응모 마감 후 추첨으로 1명에게 판매됩니다</div>

            <div className="divider" />

            <div className="description">{product.description}</div>

            {product.specs && (
              <div className="spec-list">
                {product.specs.map(spec => (
                  <div key={spec.key} className="spec-item">
                    <span className="spec-key">{spec.key}</span>
                    <span className="spec-val">{spec.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 응모 현황 */}
            <div className="raffle-section">
              <div className="raffle-header">
                <div className="raffle-title">🎟 응모 현황</div>
                <div className={`raffle-countdown ${product.raffle.urgent ? 'urgent-cd' : ''}`}>
                  {countdownText}
                </div>
              </div>

              <div className="progress-wrap">
                <div className="progress-label">
                  <span>참여자 <span className="count">{entryCount}명</span></span>
                  <span>최대 {product.raffle.totalSlots}명</span>
                </div>
                <div className="progress-bar-row">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="progress-pct">{progressPct}%</span>
                </div>
              </div>

              <div className="raffle-stats">
                <div className="stat-item">
                  <div className="stat-value">{entryCount}</div>
                  <div className="stat-label">응모자 수</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">1</div>
                  <div className="stat-label">당첨 인원</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{winRate}%</div>
                  <div className="stat-label">당첨 확률</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="cta-row">
              <button className="btn-raffle" onClick={() => setModalOpen(true)}>
                🎟 응모하기
              </button>
              <button
                className={`btn-wish ${isLiked ? 'liked' : ''}`}
                onClick={() => setIsLiked(prev => !prev)}
              >
                <span className="heart">{isLiked ? '❤️' : '🤍'}</span>
              </button>
            </div>

            <div className="meta-stats">
              <span>💬 채팅 {product.meta.chats}</span>
              <span>🤍 관심 {product.meta.wishes}</span>
              <span>👁 조회 {product.meta.views}</span>
              <span>📅 {product.meta.time}</span>
            </div>
          </div>
        </div>

        {/* 판매자 다른 상품 */}
        <div className="more-section">
          <div className="section-header">
            <div className="section-title">{product.relatedLabel}</div>
            <div className="see-all">전체보기 →</div>
          </div>

          <div className="product-grid">
            {product.relatedProducts.map((rp, i) => (
              <Link key={i} href={`/products/${rp.id}`} className="product-card">
                <div className="card-image">{rp.emoji}</div>
                <div className="card-body-sm">
                  <div className="card-title-sm">{rp.title}</div>
                  <div className="card-price-sm">{rp.price}</div>
                  <div className="card-meta-sm">
                    <span>👁 {rp.views}</span>
                    <span>🤍 {rp.wishes}</span>
                  </div>
                  <div className={`card-badge ${rp.sold ? 'sold' : ''}`}>{rp.badge}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 응모 모달 */}
      <div
        className={`modal-overlay ${modalOpen ? 'open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
      >
        <div className="modal">
          <div className="modal-icon">{product.modalIcon}</div>
          <div className="modal-title">응모권 선택</div>
          <div className="modal-sub">
            {product.title.replace('\n', ' ')}<br />
            응모권 1장당{' '}
            <strong style={{ color: '#181818' }}>1,000원</strong>이며 추첨일에 당첨자를 발표합니다.
          </div>

          <div className="ticket-count">
            <div className="ticket-label">응모권 수량</div>
            <div className="ticket-selector">
              <button className="ticket-btn" onClick={() => changeTicket(-1)}>−</button>
              <div className="ticket-num">{ticketCount}</div>
              <button className="ticket-btn" onClick={() => changeTicket(1)}>+</button>
            </div>
            <div className="ticket-info">
              <span>최대 5장까지 구매 가능</span>
              <span className="total">총 {(ticketCount * 1000).toLocaleString()}원</span>
            </div>
          </div>

          <div className="modal-notice">
            응모권 구매 후 취소 및 환불이 불가합니다. 추첨 결과는 마감일 기준 24시간 이내에 알림으로 발송됩니다.
          </div>

          <div className="modal-btn-row">
            <button className="btn-cancel" onClick={() => setModalOpen(false)}>취소</button>
            <button className="btn-confirm" onClick={submitRaffle}>응모하기 🎟</button>
          </div>
        </div>
      </div>

      {/* 토스트 */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        🎉 응모가 완료되었습니다! 당첨을 기다려주세요.
      </div>
    </div>
  )
}
