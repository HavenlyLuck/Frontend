'use client'

import { useEffect, useState } from 'react'
import { TicketIcon } from '@phosphor-icons/react'
import type { RaffleProductResponse } from '@/lib/api'
import RaffleCard from '@/components/RaffleCard'
import { useMyPoints } from '@/hooks/useMyPoints'
import { getTestRaffle } from '@/lib/raffleTest'
import { getListedRaffles, isListedRaffleVisible } from '@/lib/raffle'

interface RaffleWithDeadline extends RaffleProductResponse {
  deadlineAt: number
}

export default function EungmoPage() {
  const { ssalTicket, loggedIn } = useMyPoints()
  const [products, setProducts] = useState<RaffleWithDeadline[]>([])
  const [loaded, setLoaded] = useState(false)
  const [, forceTick] = useState(0)

  useEffect(() => {
    getListedRaffles()
      .catch(() => [] as RaffleProductResponse[])
      .then(list => {
        const now = Date.now()
        // 화면 확인용 테스트 응모는 목록 맨 끝에 (홈에는 안 나온다)
        setProducts([...list, getTestRaffle()].map(p => ({ ...p, deadlineAt: now + p.remaining_seconds * 1000 })))
      })
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loggedIn && (
              <span
                className="ssal-ticket-chip"
                title="대회·이벤트 보상으로 받은 무료 응모권이에요. 낙첨돼도 쌀포인트는 환급되지 않아요."
              >
                <TicketIcon size={13} weight="fill" /> 쌀 응모권 <b>{ssalTicket.toLocaleString()}장</b>
              </span>
            )}
            <a href="/guide#응모" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', background: 'var(--bg-subtle)' }}>
              도움이 필요하다면?
            </a>
          </div>
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
