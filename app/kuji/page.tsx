'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChatCircleIcon, EyeIcon, GiftIcon, HeartIcon } from '@phosphor-icons/react'
import { isLoggedIn } from '@/lib/auth'

const ITEMS = [
  { href: '/kuji/naoya', img: '/images/naoya.jpg', alt: '나오야 젠인 쿠지', badge: '쿠지 진행 중', title: '주술회전 나오야 젠인 쿠지', price: '10,000 운포인트 / 1장', pct: 60, count: 60, max: 100, views: 51, wishes: 9, chats: 2 },
  { href: '/kuji/onepiece', img: '/images/demo-5.jpg', alt: '원피스 쿠지', badge: '쿠지 진행 중', title: '원피스 A상 루피 쿠지', price: '10,000 운포인트 / 1장', pct: 45, count: 45, max: 100, views: 77, wishes: 18, chats: 6 },
  { href: '/kuji/kimetsu', img: '/images/demo-6.jpg', alt: '귀멸의 칼날 쿠지', badge: '쿠지 진행 중', title: '귀멸의 칼날 최애의 쿠지', price: '10,000 운포인트 / 1장', pct: 30, count: 30, max: 100, views: 33, wishes: 5, chats: 1 },
  { href: '/kuji/dragonball', img: '/images/demo-7.jpg', alt: '드래곤볼 쿠지', badge: '쿠지 진행 중', title: '드래곤볼 갓 오브 데스티니 쿠지', price: '10,000 운포인트 / 1장', pct: 55, count: 55, max: 100, views: 62, wishes: 14, chats: 4 },
  { href: '/kuji/conan', img: '/images/demo-8.jpg', alt: '명탐정 코난 쿠지', badge: '쿠지 진행 중', title: '명탐정 코난 랜덤 쿠지', price: '10,000 운포인트 / 1장', pct: 18, count: 18, max: 100, views: 24, wishes: 3, chats: 1 },
  { href: '/kuji/sanrio', img: '/images/demo-9.jpg', alt: '산리오 쿠지', badge: '쿠지 진행 중', title: '산리오 캐릭터즈 쿠지', price: '10,000 운포인트 / 1장', pct: 65, count: 65, max: 100, views: 58, wishes: 16, chats: 5 },
]

const SORTS = ['최신순', '마감임박순', '참여율 높은순', '참여율 낮은순']

export default function KujiPage() {
  const router = useRouter()
  const [sort, setSort] = useState('최신순')

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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div className="section-title"><GiftIcon size={18} weight="fill" color="var(--accent)" /> 쿠지상품</div>
          <a href="/guide#쿠지" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', background: 'var(--bg-subtle)' }}>
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
                border: `1px solid ${sort === s ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
                background: sort === s ? 'var(--accent-tint)' : 'var(--surface)',
                color: sort === s ? 'var(--accent)' : 'var(--text-secondary)',
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
            <Link key={i} className="product-card-home" href={item.href} onClick={requireLogin}>
              <div className="card-img">
                <img src={item.img} alt={item.alt} />
              </div>
              <div className="card-body">
                <div className="card-raffle-badge"><GiftIcon size={11} weight="fill" /> {item.badge}</div>
                <div className="card-title">{item.title}</div>
                <div className="card-price">{item.price}</div>
                <div className="card-progress-row">
                  <div className="card-progress-bar">
                    <div className="card-progress-fill" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="card-progress-pct">{item.pct}%</span>
                </div>
                <div className="card-progress-label">
                  <span>총 {item.max}장 중 <span className="cnt">{item.count}장</span> 소진</span>
                </div>
                <div className="card-stats">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><EyeIcon size={12} /> {item.views}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><HeartIcon size={12} /> {item.wishes}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><ChatCircleIcon size={12} /> {item.chats}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
