'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HeartIcon } from '@phosphor-icons/react'
import { getWishlistItems, removeWishlistItem, type WishlistItem } from '@/lib/wishlist'

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>(() => getWishlistItems())

  const remove = (id: string) => {
    removeWishlistItem(id)
    setItems(getWishlistItems().slice())
  }

  return (
    <div className="home-container">
      <div className="section-title" style={{ marginBottom: 24 }}>
        <HeartIcon size={18} weight="fill" color="var(--danger)" /> 찜한 상품
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
          아직 찜한 상품이 없어요.
          <br />
          상품 페이지에서 하트를 눌러보세요.
        </div>
      ) : (
        <div className="product-grid-home">
          {items.map(item => (
            <div key={item.id} className="product-card-home" style={{ position: 'relative' }}>
              <button
                onClick={() => remove(item.id)}
                aria-label="찜 해제"
                style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 2,
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,0.55)', color: 'var(--danger)', fontSize: 15,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <HeartIcon size={16} weight="fill" />
              </button>
              <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card-img">
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, background: 'var(--bg-subtle)' }}>
                      {item.emoji ?? '🛍️'}
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <div className="card-title">{item.title}</div>
                  <div className="card-price">{item.subtitle}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
