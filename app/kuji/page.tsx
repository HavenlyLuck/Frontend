'use client'

import Link from 'next/link'
import { useState } from 'react'

const ITEMS = [
  { href: '/kuji/naoya', img: '/images/naoya.jpg', alt: '나오야 젠인 쿠지', badge: '🎁 쿠지 진행 중', title: '주술회전 나오야 젠인 쿠지', price: '10,000 운포인트 / 1장', pct: 60, count: 60, max: 100, views: 51, wishes: 9, chats: 2 },
  { href: '/kuji/onepiece', img: '/images/demo-5.jpg', alt: '원피스 쿠지', badge: '🎁 쿠지 진행 중', title: '원피스 A상 루피 쿠지', price: '10,000 운포인트 / 1장', pct: 45, count: 45, max: 100, views: 77, wishes: 18, chats: 6 },
  { href: '/kuji/kimetsu', img: '/images/demo-6.jpg', alt: '귀멸의 칼날 쿠지', badge: '🎁 쿠지 진행 중', title: '귀멸의 칼날 최애의 쿠지', price: '10,000 운포인트 / 1장', pct: 30, count: 30, max: 100, views: 33, wishes: 5, chats: 1 },
  { href: '/kuji/dragonball', img: '/images/demo-7.jpg', alt: '드래곤볼 쿠지', badge: '🎁 쿠지 진행 중', title: '드래곤볼 갓 오브 데스티니 쿠지', price: '10,000 운포인트 / 1장', pct: 55, count: 55, max: 100, views: 62, wishes: 14, chats: 4 },
  { href: '/kuji/conan', img: '/images/demo-8.jpg', alt: '명탐정 코난 쿠지', badge: '🎁 쿠지 진행 중', title: '명탐정 코난 랜덤 쿠지', price: '10,000 운포인트 / 1장', pct: 18, count: 18, max: 100, views: 24, wishes: 3, chats: 1 },
  { href: '/kuji/sanrio', img: '/images/demo-9.jpg', alt: '산리오 쿠지', badge: '🎁 쿠지 진행 중', title: '산리오 캐릭터즈 쿠지', price: '10,000 운포인트 / 1장', pct: 65, count: 65, max: 100, views: 58, wishes: 16, chats: 5 },
]

const SORTS = ['최신순', '마감임박순', '참여율 높은순', '참여율 낮은순']

export default function KujiPage() {
  const [sort, setSort] = useState('최신순')

  return (
    <div>
      <div className="home-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div className="section-title"><span className="emoji">🎁</span> 쿠지상품</div>
          <a href="/guide#쿠지" style={{ fontSize: 12, color: '#767676', textDecoration: 'none', border: '1px solid #e2e2e4', borderRadius: 8, padding: '4px 12px', background: '#f5f6f7' }}>
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

        <div className="product-grid-home">
          {ITEMS.map((item, i) => (
            <Link key={i} className="product-card-home" href={item.href}>
              <div className="card-img">
                <img src={item.img} alt={item.alt} />
              </div>
              <div className="card-body">
                <div className="card-raffle-badge">{item.badge}</div>
                <div className="card-title">{item.title}</div>
                <div className="card-price">{item.price}</div>
                <div className="card-progress-row">
                  <div className="card-progress-bar">
                    <div className="card-progress-fill" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="card-progress-pct">{item.pct}%</span>
                </div>
                <div className="card-progress-label">
                  <span><span className="cnt">{item.count}명</span> 참여</span>
                  <span>최대 {item.max}명</span>
                </div>
                <div className="card-stats">
                  <span>👁 {item.views}</span>
                  <span>🤍 {item.wishes}</span>
                  <span>💬 {item.chats}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
