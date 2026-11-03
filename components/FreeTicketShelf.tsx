'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GiftIcon, TicketIcon, UsersThreeIcon } from '@phosphor-icons/react'
import { getMyFreeTickets, type FreeTicketResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { formatKstDate } from '@/lib/date'

const KIND = {
  first_purchase: { label: '첫 구매 선물 응모권', Icon: GiftIcon, from: (n: string | null) => (n ? `${n}님의 추천으로 받았어요` : '첫 구매 선물') },
  referral: { label: '추천 응모권', Icon: UsersThreeIcon, from: (n: string | null) => (n ? `${n}님이 첫 응모를 했어요` : '추천 보상') },
} as const

// 보관함 맨 위 — 아직 쓰지 않은 무료 응모권. 응모 상품에서 결제 대신 쓸 수 있다
export default function FreeTicketShelf() {
  const [tickets, setTickets] = useState<FreeTicketResponse[] | null>(null)

  useEffect(() => {
    getValidSession().then(session => {
      if (!session) return
      getMyFreeTickets(session.token).then(setTickets).catch(() => setTickets([]))
    })
  }, [])

  if (!tickets || tickets.length === 0) return null

  return (
    <section className="free-ticket-shelf">
      <div className="free-ticket-shelf-head">
        <span><TicketIcon size={15} weight="fill" color="var(--accent)" /> 내 응모권 <b>{tickets.length}장</b></span>
        <Link href="/eungmo" className="free-ticket-shelf-link">응모하러 가기 →</Link>
      </div>
      <div className="free-ticket-list">
        {tickets.map(t => {
          const kind = KIND[t.kind]
          return (
            <div key={t.free_ticket_id} className={`free-ticket ${t.kind}`}>
              <kind.Icon size={20} weight="fill" className="free-ticket-icon" />
              <div style={{ minWidth: 0 }}>
                <div className="free-ticket-title">{kind.label}</div>
                <div className="free-ticket-desc">{kind.from(t.related_nickname)} · {formatKstDate(t.created_at)}</div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="free-ticket-note">응모 상품에서 결제 대신 1장당 응모권 1장으로 응모할 수 있어요. 무료 응모권은 낙첨돼도 쌀포인트가 지급되지 않아요.</p>
    </section>
  )
}
