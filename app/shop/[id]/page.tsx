'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStoreProducts, type StoreProductResponse } from '@/lib/api'
import { isWished, toggleWishlist } from '@/lib/wishlist'
import StoreProductCard, { POINT_LABEL, PointTypeIcon } from '@/components/StoreProductCard'

// 상점 상품 상세 — 백엔드에 단건 조회 API가 없어서 목록을 받아 id로 찾는다.
// TODO(backend): GET /store-products/{id} 가 생기면 단건 조회로 교체
export default function ShopProductPage({ params }: { params: { id: string } }) {
  const productId = Number(params.id)
  const [products, setProducts] = useState<StoreProductResponse[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    getStoreProducts()
      .then(list => { if (!cancelled) setProducts(list) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  const product = products?.find(p => p.store_product_id === productId)
  const wishId = `shop-${productId}`
  const [isLiked, setIsLiked] = useState(() => isWished(wishId))

  if (failed || (products && !product)) {
    return (
      <div className="container">
        <div className="coming-soon-box large" style={{ marginTop: 40 }}>
          <div className="title">{failed ? '상품을 불러오지 못했어요' : '찾을 수 없는 상품이에요'}</div>
          <div className="desc">{failed ? '잠시 후 다시 시도해주세요.' : '판매가 끝났거나 삭제된 상품일 수 있어요.'}</div>
          <Link href="/shop" className="hero-cta" style={{ marginTop: 20, display: 'inline-block' }}>상점으로 돌아가기</Link>
        </div>
      </div>
    )
  }

  if (!product) return <div className="container" style={{ minHeight: '60vh' }} />

  const label = POINT_LABEL[product.point_type]
  const soldOut = product.stock === 0
  const related = (products ?? [])
    .filter(p => p.store_product_id !== product.store_product_id && p.point_type === product.point_type)
    .slice(0, 4)

  return (
    <div>
      <div className="container">
        <div className="breadcrumb">
          <span><Link href="/">홈</Link></span>
          <span><Link href="/shop">상점</Link></span>
          <span>{label} 상점</span>
        </div>

        <div className="product-layout">
          <div className="image-area">
            <div className="main-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.product_name} />
              ) : (
                <div className="image-placeholder"><PointTypeIcon type={product.point_type} size={64} /></div>
              )}
            </div>
          </div>

          <div className="info-panel">
            <div className="status-row">
              <span className="badge on-sale" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <PointTypeIcon type={product.point_type} size={12} /> {label} 상점
              </span>
              {soldOut && <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>품절</span>}
            </div>

            <div className="product-title">{product.product_name}</div>
            <div className="price">{product.price.toLocaleString()} {label}</div>
            <div className="price-sub">{soldOut ? '현재 품절된 상품입니다' : `재고 ${product.stock}개 남음`}</div>

            {product.description && (
              <>
                <div className="divider" />
                <div className="description">{product.description}</div>
              </>
            )}

            <div className="cta-row" style={{ marginTop: 24 }}>
              {/* TODO(backend): 상점 구매 API가 생기면 수량 선택 + 구매 확인 모달 + 포인트 차감으로 연결 */}
              <button className="btn-raffle" disabled>
                {soldOut ? '품절' : '구매 준비 중'}
              </button>
              <button
                className={`btn-wish ${isLiked ? 'liked' : ''}`}
                aria-label={isLiked ? '찜 해제' : '찜하기'}
                onClick={() => setIsLiked(toggleWishlist({
                  id: wishId,
                  href: `/shop/${product.store_product_id}`,
                  title: product.product_name,
                  image: product.image_url,
                  subtitle: `${product.price.toLocaleString()} ${label}`,
                }))}
              >
                <span className="heart">{isLiked ? '❤️' : '🤍'}</span>
              </button>
            </div>
            {!soldOut && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>
                상점 구매 기능을 준비하고 있어요. 조금만 기다려주세요!
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="more-section">
            <div className="section-header">
              <div className="section-title">함께 보면 좋은 상품</div>
            </div>
            <div className="product-grid-home">
              {related.map(p => <StoreProductCard key={p.store_product_id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
