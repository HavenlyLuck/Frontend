'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  '🏠 전체', '💻 디지털/가전', '👕 패션/의류',
  '⚽ 스포츠/레저', '📚 도서/음반', '🪴 인테리어', '🎁 기타',
]

const HOT_ITEMS = [
  { href: '/products/iphone', img: '/images/iphone14pro.jpg', alt: '아이폰 14 Pro', badge: '⏰ 8시간 남음', title: '아이폰 14 Pro 256GB\n스페이스 블랙', price: '650,000원', pct: 76, count: 38, max: 50 },
  { href: '/products/notebook', img: '/images/ps5.jpg', alt: '플레이스테이션 5', badge: '⏰ 12시간 남음', title: '플레이스테이션 5\n디스크 에디션', price: '450,000원', pct: 92, count: 46, max: 50 },
  { href: '/products/notebook', img: null, emoji: '👟', badge: '⏰ 23시간 남음', title: '나이키 에어맥스 270\n270mm 미착용', price: '95,000원', pct: 65, count: 32, max: 50 },
]

const GRID_ITEMS = [
  { href: '/products/notebook', emoji: '💻', time: '⏱ 2일 남음', badge: '🎟 응모 진행 중', title: '노트북 LG 그램 17인치', price: '200,000원', pct: 38, count: 19, max: 50, views: 42, wishes: 7, chats: 3, img: null },
  { href: '/products/iphone', img: '/images/iphone14pro.jpg', alt: '아이폰 14 Pro', time: '⏱ 8시간 남음', badge: '🎟 응모 진행 중', title: '아이폰 14 Pro 256GB', price: '650,000원', pct: 76, count: 38, max: 50, views: 88, wishes: 21, chats: 9, emoji: '📱' },
  { href: '/products/notebook', emoji: '🎧', time: '⏱ 5일 남음', badge: '🎟 응모 진행 중', title: '에어팟 프로 2세대', price: '180,000원', pct: 22, count: 11, max: 50, views: 55, wishes: 8, chats: 2, img: null },
  { href: '/products/notebook', img: '/images/ps5.jpg', alt: '플레이스테이션 5', time: '⏱ 12시간 남음', badge: '🎟 응모 진행 중', title: '플레이스테이션 5', price: '450,000원', pct: 92, count: 46, max: 50, views: 134, wishes: 33, chats: 14, emoji: '🎮' },
  { href: '/products/notebook', emoji: '⌚', time: '⏱ 3일 남음', badge: '🎟 응모 진행 중', title: '갤럭시 워치 6 클래식', price: '220,000원', pct: 48, count: 24, max: 50, views: 61, wishes: 10, chats: 4, img: null },
  { href: '/products/notebook', emoji: '📷', time: '⏱ 7일 남음', badge: '🎟 응모 진행 중', title: '소니 ZV-E10 미러리스', price: '380,000원', pct: 14, count: 7, max: 50, views: 29, wishes: 6, chats: 1, img: null },
  { href: '/products/notebook', emoji: '🎵', time: '⏱ 4일 남음', badge: '🎟 응모 진행 중', title: '소니 WH-1000XM5', price: '250,000원', pct: 56, count: 28, max: 50, views: 73, wishes: 15, chats: 5, img: null },
  { href: '/products/notebook', emoji: '🖥️', time: '⏱ 6일 남음', badge: '🎟 응모 진행 중', title: '아이패드 Air 5세대 64GB', price: '480,000원', pct: 30, count: 15, max: 50, views: 47, wishes: 11, chats: 3, img: null },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0)
  const productsRef = useRef<HTMLDivElement>(null)

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* 히어로 */}
      <section className="hero">
        <div className="hero-tag">🧧 응모형 중고거래 플랫폼</div>
        <h1>천원으로 행운을,<br /><span>천운</span></h1>
        <p className="hero-sub">
          원하는 중고 상품에 응모하고 추첨으로 득템하세요<br />
          소액으로 고가 상품을 구매할 기회!
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={scrollToProducts}>지금 구경하기 →</button>
          <button className="btn-ghost">서비스 소개</button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value"><span>5,823</span>명</div>
            <div className="hero-stat-label">이용자 수</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value"><span>1,247</span>건</div>
            <div className="hero-stat-label">거래 완료</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">평균 <span>23%</span></div>
            <div className="hero-stat-label">당첨 확률</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value"><span>1,000</span>원~</div>
            <div className="hero-stat-label">최소 응모금액</div>
          </div>
        </div>
      </section>

      {/* 카테고리 탭 */}
      <div className="category-bar">
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat}
            className={`cat-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {cat}
          </div>
        ))}
      </div>

      <div className="home-container">
        {/* 마감 임박 */}
        <div className="section-header" ref={productsRef} style={{ scrollMarginTop: '80px' }}>
          <div className="section-title">🔥 마감 임박</div>
          <div className="see-all">전체보기 →</div>
        </div>

        <div className="hot-grid">
          {HOT_ITEMS.map((item, i) => (
            <Link key={i} className="hot-card" href={item.href}>
              <div className="hot-card-img">
                {item.img ? (
                  <img src={item.img} alt={item.alt} />
                ) : (
                  <span>{item.emoji}</span>
                )}
              </div>
              <div className="hot-card-body">
                <div className="hot-badge">{item.badge}</div>
                <div className="hot-card-title" style={{ whiteSpace: 'pre-line' }}>{item.title}</div>
                <div className="hot-card-price">{item.price}</div>
                <div className="hot-progress-bar">
                  <div className="hot-progress-fill" style={{ width: `${item.pct}%` }} />
                </div>
                <div className="hot-progress-label">
                  <span>{item.count}명 참여</span>
                  <span className="hot-time">최대 {item.max}명</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 전체 상품 */}
        <div className="section-header">
          <div className="section-title">전체 상품</div>
          <div className="see-all">최신순 ▾</div>
        </div>

        <div className="product-grid-home">
          {GRID_ITEMS.map((item, i) => (
            <Link key={i} className="product-card-home" href={item.href}>
              <div className="card-img">
                {item.img ? <img src={item.img} alt={item.alt} /> : item.emoji}
                <div className="card-time-badge">{item.time}</div>
              </div>
              <div className="card-body">
                <div className="card-raffle-badge">{item.badge}</div>
                <div className="card-title">{item.title}</div>
                <div className="card-price">{item.price}</div>
                <div className="card-progress-bar">
                  <div className="card-progress-fill" style={{ width: `${item.pct}%` }} />
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
    </>
  )
}
