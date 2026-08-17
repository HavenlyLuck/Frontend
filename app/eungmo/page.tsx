'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TicketIcon } from '@phosphor-icons/react'
import { getRaffleProducts, type RaffleProductResponse } from '@/lib/api'

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

interface RaffleWithDeadline extends RaffleProductResponse {
  deadlineAt: number
}

export default function EungmoPage() {
  const [products, setProducts] = useState<RaffleWithDeadline[]>([])
  const [loaded, setLoaded] = useState(false)
  const [, forceTick] = useState(0)

  useEffect(() => {
    getRaffleProducts('open')
      .then(list => {
        const now = Date.now()
        setProducts(list.map(p => ({ ...p, deadlineAt: now + p.remaining_seconds * 1000 })))
      })
      .catch(() => setProducts([]))
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => forceTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const openProducts = products.filter(p => p.deadlineAt - Date.now() > 0)

  return (
    <div>
      <div className="home-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div className="section-title"><TicketIcon size={18} weight="fill" color="var(--accent)" /> 응모상품</div>
          <a href="/guide#응모" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', background: 'var(--bg-subtle)' }}>
            도움이 필요하다면?
          </a>
        </div>

        {loaded && openProducts.length === 0 && (
          <div className="coming-soon-box large">
            <div className="emoji"><TicketIcon size={32} weight="light" /></div>
            <div className="title">상품 준비중</div>
            <div className="desc">응모 상품을 준비하고 있어요. 조금만 기다려주세요!</div>
          </div>
        )}

        {openProducts.length > 0 && (
          <div className="product-grid-home">
            {openProducts.map(p => {
              const secondsLeft = Math.max(0, Math.floor((p.deadlineAt - Date.now()) / 1000))
              return (
                <Link key={p.raffle_product_id} className="product-card-home" href={`/eungmo/${p.raffle_product_id}`}>
                  <div className="card-img">
                    {p.image_url && <img src={p.image_url} alt={p.product_name} />}
                    <div className="card-time-badge">⏱ {formatCountdown(secondsLeft)}</div>
                  </div>
                  <div className="card-body">
                    <div className="card-raffle-badge"><TicketIcon size={11} weight="fill" /> 응모 진행 중</div>
                    <div className="card-title">{p.product_name}</div>
                    <div className="card-price">{p.ticket_price.toLocaleString()} 운포인트 <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)' }}>/ 장당</span></div>
                    <div className="card-progress-row">
                      <div className="card-progress-bar">
                        <div className="card-progress-fill" style={{ width: '0%' }} />
                      </div>
                    </div>
                    <div className="card-progress-label">
                      <span style={{ color: 'var(--text-tertiary)' }}>집계 준비 중</span>
                      <span>총 {p.total_slots.toLocaleString()}장</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
