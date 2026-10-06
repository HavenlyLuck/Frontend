'use client'

import { useEffect, useState } from 'react'
import { TicketIcon } from '@phosphor-icons/react'
import type { RaffleProductResponse } from '@/lib/api'
import RaffleCard from '@/components/RaffleCard'
import { getListedRaffles, isListedRaffleVisible } from '@/lib/raffle'

interface RaffleWithDeadline extends RaffleProductResponse {
  deadlineAt: number
}

export default function EungmoPage() {
  const [products, setProducts] = useState<RaffleWithDeadline[]>([])
  const [loaded, setLoaded] = useState(false)
  const [, forceTick] = useState(0)

  useEffect(() => {
    getListedRaffles()
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

  const openProducts = products.filter(p => isListedRaffleVisible(p, Math.floor((p.deadlineAt - Date.now()) / 1000)))

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
            {openProducts.map(p => (
              <RaffleCard
                key={p.raffle_product_id}
                product={p}
                secondsLeft={Math.max(0, Math.floor((p.deadlineAt - Date.now()) / 1000))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
