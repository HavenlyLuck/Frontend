'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { getShopProduct } from '@/lib/shopData'
import { addStorageItem } from '@/lib/storage'
import { isWished, toggleWishlist } from '@/lib/wishlist'
import { isLoggedIn } from '@/lib/auth'

export default function ShopProductPage({ params }: { params: { id: string } }) {
  const product = getShopProduct(params.id)
  if (!product) notFound()

  const router = useRouter()
  useEffect(() => {
    if (!isLoggedIn()) {
      alert('로그인 후 이용해주세요.')
      router.replace('/login')
    }
  }, [router])

  const wishId = `shop-${product.id}`
  const [qty, setQty] = useState(1)
  const [isLiked, setIsLiked] = useState(() => isWished(wishId))
  const [modalOpen, setModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const soldOut = product.stock === 0
  const changeQty = (delta: number) =>
    setQty(prev => Math.min(product.stock, Math.max(1, prev + delta)))

  const confirmPurchase = () => {
    addStorageItem({
      id: `${product.id}-${Date.now()}`,
      img: product.image,
      emoji: product.emoji,
      title: qty > 1 ? `${product.title} x${qty}` : product.title,
      source: '구매',
      date: new Date().toISOString().slice(0, 10),
      value: `${(product.price * qty).toLocaleString()} ${product.currency}`,
      status: 'ready',
    })
    setModalOpen(false)
    setShowToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <div>
      <div className="container">
        <div className="breadcrumb">
          <span><Link href="/">홈</Link></span>
          <span><Link href="/shop">상점</Link></span>
          <span>{product.subcategory}</span>
        </div>

        <div className="product-layout">
          <div className="image-area">
            <div className="main-image">
              {product.image ? (
                <img src={product.image} alt={product.title} />
              ) : (
                <div className="image-placeholder">
                  <span className="cam">{product.emoji}</span>
                </div>
              )}
            </div>
          </div>

          <div className="info-panel">
            <div className="status-row">
              <span className="badge on-sale">{product.category}</span>
              {soldOut && <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>품절</span>}
            </div>

            <div className="product-title">{product.title}</div>
            <div className="price">{product.price.toLocaleString()} {product.currency}</div>
            <div className="price-sub">{soldOut ? '현재 품절된 상품입니다' : `재고 ${product.stock}개 남음`}</div>

            <div className="divider" />

            <div className="description">{product.description}</div>

            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>구매 수량</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 16px' }}>
                  <button
                    onClick={() => changeQty(-1)}
                    disabled={soldOut}
                    style={{ width: 28, height: 28, border: 'none', background: 'none', fontSize: 18, cursor: soldOut ? 'default' : 'pointer', color: 'var(--text-secondary)' }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center', color: 'var(--text)' }}>{qty}</span>
                  <button
                    onClick={() => changeQty(1)}
                    disabled={soldOut}
                    style={{ width: 28, height: 28, border: 'none', background: 'none', fontSize: 18, cursor: soldOut ? 'default' : 'pointer', color: 'var(--text-secondary)' }}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>최대 {product.stock}개까지 구매 가능</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text)' }}>
                총 결제 금액 <strong>{(product.price * qty).toLocaleString()} {product.currency}</strong>
              </div>
            </div>

            <div className="cta-row" style={{ marginTop: 24 }}>
              <button
                className="btn-raffle"
                disabled={soldOut}
                onClick={() => setModalOpen(true)}
                style={soldOut ? { background: 'var(--border)', color: 'var(--text-tertiary)', cursor: 'default' } : undefined}
              >
                {soldOut ? '품절' : '🎰 구매하기'}
              </button>
              <button
                className={`btn-wish ${isLiked ? 'liked' : ''}`}
                onClick={() => setIsLiked(toggleWishlist({
                  id: wishId,
                  href: `/shop/${product.id}`,
                  title: product.title,
                  image: product.image,
                  emoji: product.emoji,
                  subtitle: `${product.price.toLocaleString()} ${product.currency}`,
                }))}
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

        {product.relatedProducts.length > 0 && (
          <div className="more-section">
            <div className="section-header">
              <div className="section-title">함께 보면 좋은 상품</div>
            </div>

            <div className="product-grid">
              {product.relatedProducts.map((rp, i) => (
                <Link key={i} href={`/shop/${rp.id}`} className="product-card">
                  <div className="card-image">
                    {rp.image ? <img src={rp.image} alt={rp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : rp.emoji}
                  </div>
                  <div className="card-body-sm">
                    <div className="card-title-sm">{rp.title}</div>
                    <div className="card-price-sm">{rp.price}</div>
                    <div className="card-meta-sm">
                      <span>👁 {rp.views}</span>
                      <span>🤍 {rp.wishes}</span>
                    </div>
                    {rp.soldOut && <div className="card-badge sold">품절</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={`modal-overlay ${modalOpen ? 'open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
      >
        <div className="modal">
          <div className="modal-icon">🎰</div>
          <div className="modal-title">구매 확인</div>
          <div className="modal-sub">
            {product.title}<br />
            {qty}개 · 총{' '}
            <strong style={{ color: 'var(--text)' }}>{(product.price * qty).toLocaleString()} {product.currency}</strong>
            {' '}가 차감됩니다.
          </div>

          <div className="modal-notice">
            구매 확정 후에는 취소 및 환불이 불가합니다.
          </div>

          <div className="modal-btn-row">
            <button className="btn-cancel" onClick={() => setModalOpen(false)}>취소</button>
            <button className="btn-confirm" onClick={confirmPurchase}>구매하기 🎰</button>
          </div>
        </div>
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`}>
        🎉 구매가 완료되었습니다! 보관함에서 확인해주세요!
      </div>
    </div>
  )
}
