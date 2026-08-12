'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { isLoggedIn } from '@/lib/auth'

const EUNG_ITEMS = [
  { href: '/shop/sticker-set', img: '/images/demo-1.jpg', alt: '굿즈 스티커 세트', badge: '🎰 운포인트 상점', title: '캐릭터 굿즈 스티커 세트', price: '12,000 운포인트', views: 19, wishes: 2, chats: 0, stock: 15 },
  { href: '/shop/acrylic-stand', img: '/images/demo-2.jpg', alt: '아크릴 스탠드', badge: '🎰 운포인트 상점', title: '인기 캐릭터 아크릴 스탠드', price: '18,000 운포인트', views: 31, wishes: 6, chats: 1, stock: 8 },
  { href: '/shop/mini-figure', img: '/images/demo-4.jpg', alt: '미니 피규어', badge: '🎰 운포인트 상점', title: '데스크용 미니 피규어', price: '25,000 운포인트', views: 27, wishes: 4, chats: 0, stock: 0 },
  { href: '/shop/ps5-controller', img: '/images/ps5.jpg', alt: 'PS5 무선 컨트롤러', badge: '🎰 운포인트 상점', title: 'PS5 듀얼센스 무선 컨트롤러', price: '78,000 운포인트', views: 45, wishes: 11, chats: 3, stock: 4 },
  { href: '/shop/iphone-case', img: '/images/iphone14pro.jpg', alt: '아이폰 케이스', badge: '🎰 운포인트 상점', title: '아이폰 14 Pro 투명 케이스', price: '15,000 운포인트', views: 22, wishes: 3, chats: 0, stock: 12 },
  { href: '/shop/figure-case', img: '/images/demo-3.jpg', alt: '피규어 진열 케이스', badge: '🎰 운포인트 상점', title: '피규어 먼지방지 진열 케이스', price: '9,000 운포인트', views: 16, wishes: 1, chats: 0, stock: 5 },
]

const SSAL_ITEMS = [
  { href: '/shop/rice-special', emoji: '🌾', badge: '🌾 쌀포인트 상점', title: '쌀포인트 특별 상품', price: '10,000 쌀포인트', views: 5, wishes: 1, chats: 0 },
]

const SORTS = ['최신순', '낮은 가격순', '높은 가격순', '인기순']

type StoreTab = '운포인트' | '쌀포인트'

export default function ShopPage() {
  const router = useRouter()
  const [sort, setSort] = useState('최신순')
  const [storeTab, setStoreTab] = useState<StoreTab>('운포인트')

  const requireLogin = (e: React.MouseEvent) => {
    if (!isLoggedIn()) {
      e.preventDefault()
      alert('로그인 후 이용해주세요.')
      router.push('/login')
    }
  }

  return (
    <div>
      <div className="home-container">

        {/* 상점 타이틀 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div className="section-title"><span className="emoji">🏪</span> 상점</div>
          <a href="/guide#상점" style={{ fontSize: 12, color: '#767676', textDecoration: 'none', border: '1px solid #e2e2e4', borderRadius: 8, padding: '4px 12px', background: '#f5f6f7' }}>
            도움이 필요하다면?
          </a>
        </div>

        {/* 상점 탭 + 정렬 버튼 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(['운포인트', '쌀포인트'] as StoreTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setStoreTab(tab)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  border: `1px solid ${storeTab === tab ? '#4fa8e888' : '#e2e2e4'}`,
                  background: storeTab === tab ? '#eaf6fd' : '#ffffff',
                  color: storeTab === tab ? '#1477b8' : '#767676',
                  fontSize: 14,
                  fontWeight: storeTab === tab ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab === '운포인트' ? '🎰 운포인트 상점' : '🌾 쌀포인트 상점'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SORTS.map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${sort === s ? '#4fa8e888' : '#e2e2e4'}`,
                  background: sort === s ? '#eaf6fd' : '#ffffff',
                  color: sort === s ? '#1477b8' : '#767676',
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
        </div>

        {/* 운포인트 상점 */}
        {storeTab === '운포인트' && (
          <div className="product-grid-home">
            {EUNG_ITEMS.map((item, i) => (
              <Link
                key={i}
                className="product-card-home"
                href={item.stock === 0 ? '#' : item.href}
                onClick={e => {
                  if (item.stock === 0) { e.preventDefault(); return }
                  requireLogin(e)
                }}
              >
                <div className="card-img" style={{ position: 'relative' }}>
                  <img src={item.img} alt={item.alt} style={{ filter: item.stock === 0 ? 'blur(3px) brightness(0.45)' : undefined }} />
                  {item.stock === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: 3, padding: '5px 14px', borderRadius: 6, border: '2px solid #ffffff66', background: 'rgba(0,0,0,0.5)', textShadow: '0 0 12px #fff8' }}>SOLD OUT</span>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <div className="card-raffle-badge">{item.badge}</div>
                  <div className="card-title" style={{ color: item.stock === 0 ? '#b0b0b0' : undefined }}>{item.title}</div>
                  <div className="card-price" style={{ color: item.stock === 0 ? '#c8c8c8' : undefined }}>{item.price}</div>
                  <div className="card-stats">
                    <span>👁 {item.views}</span>
                    <span>🤍 {item.wishes}</span>
                    <span>💬 {item.chats}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 쌀포인트 상점 */}
        {storeTab === '쌀포인트' && (
          <div className="product-grid-home">
            {SSAL_ITEMS.map((item, i) => (
              <Link key={i} className="product-card-home" href={item.href} onClick={requireLogin}>
                <div className="card-img" style={{ fontSize: 72 }}>
                  {item.emoji}
                </div>
                <div className="card-body">
                  <div className="card-raffle-badge">{item.badge}</div>
                  <div className="card-title">{item.title}</div>
                  <div className="card-price">{item.price}</div>
                  <div className="card-stats">
                    <span>👁 {item.views}</span>
                    <span>🤍 {item.wishes}</span>
                    <span>💬 {item.chats}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
