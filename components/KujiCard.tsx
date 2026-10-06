'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GiftIcon } from '@phosphor-icons/react'
import { isLoggedIn } from '@/lib/auth'
import CardImage from '@/components/CardImage'
import type { KujiListItem } from '@/lib/kujiList'

// 쿠지 카드 (쿠지 목록 · 검색 결과) — 로그인 안 했으면 상세로 들어가지 않고 로그인으로 보낸다
export default function KujiCard({ item }: { item: KujiListItem }) {
  const router = useRouter()

  const requireLogin = (e: React.MouseEvent) => {
    if (!isLoggedIn()) {
      e.preventDefault()
      alert('로그인 후 이용해주세요.')
      router.push('/login')
    }
  }

  return (
    <Link className="product-card-home" href={item.href} onClick={requireLogin}>
      <div className="card-img">
        <CardImage src={item.img} alt={item.alt} />
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
      </div>
    </Link>
  )
}
