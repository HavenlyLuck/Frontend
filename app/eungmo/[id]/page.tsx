'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CalendarIcon,
  CheckCircleIcon,
  ChatCircleIcon,
  ClockIcon,
  EyeIcon,
  FlameIcon,
  HeartIcon,
  TicketIcon,
  WarningIcon,
} from '@phosphor-icons/react'
import { getRaffleProducts, type RaffleProductResponse } from '@/lib/api'
import { isWished, toggleWishlist } from '@/lib/wishlist'
import { isLoggedIn } from '@/lib/auth'

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '마감'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (d === 0) return `${pad(h)}:${pad(m)}:${pad(s)} 남음`
  return `${d}일 ${pad(h)}:${pad(m)}:${pad(s)} 남음`
}

export default function RaffleProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const raffleId = Number(params.id)

  useEffect(() => {
    if (!isLoggedIn()) {
      alert('로그인 후 이용해주세요.')
      router.replace('/login')
    }
  }, [router])

  const [product, setProduct] = useState<RaffleProductResponse | null | undefined>(undefined)
  const [ticketCount, setTicketCount] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getRaffleProducts()
      .then((list) => {
        const found = list.find((rp) => rp.raffle_product_id === raffleId) ?? null
        setProduct(found)
        if (found) {
          setRemaining(found.remaining_seconds)
          setIsLiked(isWished(`raffle-${found.raffle_product_id}`))
        }
      })
      .catch(() => setProduct(null))
  }, [raffleId])

  useEffect(() => {
    if (!product) return
    const timer = setInterval(() => setRemaining((prev) => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [product])

  if (product === undefined) {
    return (
      <div className="home-container">
        <div className="coming-soon-box large">
          <div className="emoji"><TicketIcon size={32} weight="light" /></div>
          <div className="title">불러오는 중이에요</div>
        </div>
      </div>
    )
  }

  if (product === null) {
    return (
      <div className="home-container">
        <div className="coming-soon-box large">
          <div className="emoji"><TicketIcon size={32} weight="light" /></div>
          <div className="title">응모 상품을 찾을 수 없어요</div>
          <div className="desc">마감되었거나 존재하지 않는 상품이에요</div>
        </div>
      </div>
    )
  }

  const urgent = remaining > 0 && remaining < 3600
  const wishId = `raffle-${product.raffle_product_id}`

  // 판매된 응모권 수는 API에서 아직 제공하지 않음(0으로 둠) — 나중에 필드가 추가되면
  // 여기만 실제 판매 수량으로 바꾸면 "남은 응모권만큼만 구매 가능" 로직이 그대로 동작함
  const soldCount = 0
  const maxPurchasable = Math.max(1, product.total_slots - soldCount)

  const changeTicket = (delta: number) =>
    setTicketCount((prev) => Math.min(maxPurchasable, Math.max(1, prev + delta)))

  const submitRaffle = () => {
    setModalOpen(false)
    setShowToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowToast(false), 3500)
  }

  return (
    <div>
      <div className="container">
        <div className="breadcrumb">
          <span><Link href="/">홈</Link></span>
          <span><Link href="/eungmo">응모</Link></span>
          <span>{product.product_name}</span>
        </div>

        <div className="product-layout">
          <div className="image-area">
            <div className="main-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.product_name} />
              ) : (
                <div className="image-placeholder">
                  <TicketIcon size={72} weight="thin" />
                </div>
              )}
            </div>
          </div>

          <div className="info-panel">
            <div className="status-row">
              <span className="badge raffle"><TicketIcon size={12} weight="fill" /> 응모 진행 중</span>
              {urgent && <span className="badge urgent"><FlameIcon size={12} weight="fill" /> 마감 임박</span>}
            </div>

            <div className="product-title">{product.product_name}</div>
            <div className="price-sub">응모 마감 후 추첨으로 1명에게 판매됩니다</div>

            <div className="divider" />

            {product.description && <div className="description">{product.description}</div>}

            <div className="raffle-section">
              <div className="raffle-header">
                <div className="raffle-title"><TicketIcon size={16} weight="fill" /> 응모 현황</div>
                <div className={`raffle-countdown ${urgent ? 'urgent-cd' : ''}`}>
                  {urgent ? <FlameIcon size={14} weight="fill" /> : <ClockIcon size={14} weight="bold" />}
                  {formatCountdown(remaining)}
                </div>
              </div>

              <div className="progress-wrap">
                <div className="progress-label">
                  <span>응모권 판매 현황</span>
                  <span>총 {product.total_slots.toLocaleString()}장</span>
                </div>
                <div className="progress-bar-row">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }} />
                  </div>
                  <span className="progress-pct" style={{ color: 'var(--text-tertiary)' }}>집계 준비 중</span>
                </div>
              </div>

              <div className="raffle-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="stat-item">
                  <div className="stat-value">{product.ticket_price.toLocaleString()}원</div>
                  <div className="stat-label">응모권 가격</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{product.total_slots.toLocaleString()}장</div>
                  <div className="stat-label">총 응모권</div>
                </div>
              </div>
            </div>

            <div className="cta-row">
              <button className="btn-raffle" onClick={() => setModalOpen(true)}>
                <TicketIcon size={17} weight="fill" /> 응모하기
              </button>
              <button
                className={`btn-wish ${isLiked ? 'liked' : ''}`}
                onClick={() => setIsLiked(toggleWishlist({
                  id: wishId,
                  href: `/eungmo/${product.raffle_product_id}`,
                  title: product.product_name,
                  image: product.image_url,
                  subtitle: `${product.ticket_price.toLocaleString()} 운포인트 / 장당`,
                }))}
              >
                <HeartIcon size={19} weight={isLiked ? 'fill' : 'regular'} color={isLiked ? 'var(--danger)' : 'var(--text-tertiary)'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 응모 모달 */}
      <div
        className={`modal-overlay ${modalOpen ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
      >
        <div className="modal">
          <div className="modal-icon"><TicketIcon size={28} weight="fill" color="var(--accent)" /></div>
          <div className="modal-title">응모권 선택</div>
          <div className="modal-sub">
            {product.product_name}<br />
            응모권 1장당{' '}
            <strong style={{ color: 'var(--text)' }}>{product.ticket_price.toLocaleString()}원</strong>이며 추첨일에 당첨자를 발표합니다.
          </div>

          <div className="ticket-count">
            <div className="ticket-label">응모권 수량</div>
            <div className="ticket-selector">
              <button className="ticket-btn" onClick={() => changeTicket(-1)}>−</button>
              <div className="ticket-num">{ticketCount}</div>
              <button className="ticket-btn" onClick={() => changeTicket(1)}>+</button>
            </div>
            <div className="ticket-info">
              <span>최대 {maxPurchasable.toLocaleString()}장까지 구매 가능</span>
              <span className="total">총 {(ticketCount * product.ticket_price).toLocaleString()}원</span>
            </div>
          </div>

          <div className="modal-notice">
            <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>응모권 구매 후 취소 및 환불이 불가합니다. 추첨 결과는 마감일 기준 24시간 이내에 알림으로 발송됩니다.</span>
          </div>

          <div className="modal-btn-row">
            <button className="btn-cancel" onClick={() => setModalOpen(false)}>취소</button>
            <button className="btn-confirm" onClick={submitRaffle}><TicketIcon size={15} weight="fill" /> 응모하기</button>
          </div>
        </div>
      </div>

      {/* 토스트 */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        <CheckCircleIcon size={18} weight="fill" color="var(--success)" /> 응모가 완료되었습니다! 당첨을 기다려주세요.
      </div>
    </div>
  )
}
