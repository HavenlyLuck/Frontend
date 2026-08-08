'use client'

import Link from 'next/link'
import { useState } from 'react'

const ITEMS = [
  { href: '/products/iphone', img: '/images/naoya.jpg', alt: '나오야 젠인 피규어', badge: '🎟 응모 진행 중', title: '주술회전 나오야 젠인 피규어', price: '120,000원', pct: 76, count: 38, max: 50, time: '⏱ 8시간 남음', views: 88, wishes: 21, chats: 9 },
  { href: '/products/notebook', img: '/images/ps5.jpg', alt: '플레이스테이션 5', badge: '🎟 응모 진행 중', title: '플레이스테이션 5 디스크 에디션', price: '450,000원', pct: 92, count: 46, max: 50, time: '⏱ 12시간 남음', views: 134, wishes: 33, chats: 14 },
  { href: '/products/notebook', img: '/images/demo-4.jpg', alt: '에어팟 프로 2세대', badge: '🎟 응모 진행 중', title: '에어팟 프로 2세대', price: '180,000원', pct: 22, count: 11, max: 50, time: '⏱ 5일 남음', views: 55, wishes: 8, chats: 2 },
  { href: '/products/notebook', img: '/images/demo-5.jpg', alt: '닌텐도 스위치 OLED', badge: '🎟 응모 진행 중', title: '닌텐도 스위치 OLED', price: '280,000원', pct: 65, count: 32, max: 50, time: '⏱ 23시간 남음', views: 72, wishes: 19, chats: 6 },
  { href: '/products/notebook', img: '/images/demo-6.jpg', alt: '갤럭시 워치 6 클래식', badge: '🎟 응모 진행 중', title: '갤럭시 워치 6 클래식', price: '220,000원', pct: 48, count: 24, max: 50, time: '⏱ 3일 남음', views: 61, wishes: 10, chats: 4 },
  { href: '/products/notebook', img: '/images/demo-7.jpg', alt: '소니 WH-1000XM5', badge: '🎟 응모 진행 중', title: '소니 WH-1000XM5', price: '250,000원', pct: 56, count: 28, max: 50, time: '⏱ 4일 남음', views: 73, wishes: 15, chats: 5 },
  { href: '/products/notebook', img: '/images/demo-8.jpg', alt: '아이패드 Air 5세대', badge: '🎟 응모 진행 중', title: '아이패드 Air 5세대 64GB', price: '480,000원', pct: 30, count: 15, max: 50, time: '⏱ 6일 남음', views: 47, wishes: 11, chats: 3 },
  { href: '/products/notebook', img: '/images/demo-9.jpg', alt: '소니 ZV-E10 미러리스', badge: '🎟 응모 진행 중', title: '소니 ZV-E10 미러리스', price: '380,000원', pct: 14, count: 7, max: 50, time: '⏱ 7일 남음', views: 29, wishes: 6, chats: 1 },
]

const SORTS = ['최신순', '마감임박순', '참여율 높은순', '참여율 낮은순']

export default function EungmoPage() {
  const [sort, setSort] = useState('최신순')

  return (
    <div>
      <div className="home-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="section-title"><span className="emoji">🎟</span> 응모상품</div>
          <a href="/guide#응모" style={{ fontSize: 12, color: '#767676', textDecoration: 'none', border: '1px solid #e2e2e4', borderRadius: 8, padding: '4px 12px', background: '#f5f6f7' }}>
            도움이 필요하다면?
          </a>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 28 }}>
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
                <div className="card-time-badge">{item.time}</div>
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
