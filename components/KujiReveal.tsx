'use client'

import { GiftIcon } from '@phosphor-icons/react'
import type { KujiLastOne, KujiTier } from '@/lib/kujiData'

export interface KujiRevealItem {
  ticketId: number
  grade: string
  tier: KujiTier
}

interface Props {
  items: KujiRevealItem[]
  revealed: number[] // 연 제비 번호
  onReveal: (ticketId: number) => void
  // "모두 열기"로 한꺼번에 연 제비 번호(그 순서대로) — 카드마다 조금씩 늦게 뒤집혀 차례로 열리는 느낌을 준다
  skipped: number[]
  // 판의 마지막 제비를 뽑았으면 라스트원상 — 내 카드를 다 연 뒤 번개와 함께 옆에 나타난다
  lastOne?: KujiLastOne | null
  showLastOne?: boolean
}

// 쿠지 뽑기 결과 — 뽑은 제비가 뒤집힌 카드로 깔리고, 하나씩 눌러 연다. 상위상은 뒤집힌 채로도 금빛으로 빛난다.
export default function KujiReveal({ items, revealed, onReveal, skipped, lastOne, showLastOne }: Props) {
  return (
    <div className="kuji-reveal-grid">
      {items.map((item, i) => {
        const open = revealed.includes(item.ticketId)
        const top = item.tier.isTop
        const order = skipped.indexOf(item.ticketId)
        const flipDelay = order >= 0 ? `${order * 110}ms` : '0ms'
        return (
          <button
            key={item.ticketId}
            type="button"
            className={`kuji-card${open ? ' is-open' : ''}${top ? ' is-top' : ''}`}
            style={{ animationDelay: `${i * 70}ms` }}
            onClick={() => { if (!open) onReveal(item.ticketId) }}
            aria-label={open ? `제비 #${item.ticketId}: ${item.grade}상 ${item.tier.title}` : `제비 #${item.ticketId} 열기`}
          >
            <span className="kuji-card-inner" style={{ transitionDelay: flipDelay }}>
              <span className="kuji-card-face kuji-card-back">
                <GiftIcon size={26} weight="fill" />
                <span className="kuji-card-no">#{item.ticketId}</span>
                <span className="kuji-card-hint">눌러서 열기</span>
              </span>
              <span className="kuji-card-face kuji-card-front">
                <span className="kuji-card-img">
                  {item.tier.image
                    ? <img src={item.tier.image} alt="" />
                    : <GiftIcon size={30} weight="fill" />}
                </span>
                <span className="kuji-card-grade">{item.grade}상</span>
                <span className="kuji-card-title">{item.tier.title}</span>
                {top && <span className="kuji-card-shine" aria-hidden="true" />}
              </span>
            </span>
          </button>
        )
      })}

      {lastOne && showLastOne && (
        <div className="kuji-card kuji-card-last" role="status" aria-label={`라스트원상 획득: ${lastOne.title}`}>
          <svg className="kuji-bolt" viewBox="0 0 60 160" aria-hidden="true">
            <polygon points="34,0 14,70 30,70 10,160 50,58 32,58 48,0" />
          </svg>
          <span className="kuji-card-face kuji-card-front is-last">
            <span className="kuji-last-badge">LAST ONE</span>
            <span className="kuji-card-img">
              <img src={lastOne.image} alt="" />
            </span>
            <span className="kuji-card-grade">라스트원상</span>
            <span className="kuji-card-title">{lastOne.title}</span>
          </span>
        </div>
      )}
    </div>
  )
}
