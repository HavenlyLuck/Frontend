'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CrownIcon, SparkleIcon, TrophyIcon } from '@phosphor-icons/react'
import PixelAvatar from '@/components/PixelAvatar'
import { getCurrentContest, type ContestSeason } from '@/lib/avatarContest'

// 아바타로 즐기는 컨텐츠 모음 — 앞으로 생길 컨텐츠도 여기에 카드로 추가한다
export default function ContentsPage() {
  const [contest, setContest] = useState<ContestSeason | null>(null)

  useEffect(() => {
    getCurrentContest().then(setContest).catch(() => {})
  }, [])

  const leader = contest ? [...contest.entries].sort((a, b) => b.votes - a.votes)[0] : null

  return (
    <div className="home-container" style={{ maxWidth: 960 }}>
      <div className="section-title" style={{ marginBottom: 6 }}>
        <SparkleIcon size={18} weight="fill" color="var(--accent)" /> 컨텐츠
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
        내 캐릭터로 즐기는 이벤트예요. 꾸민 만큼 빛나요.
      </p>

      <div className="contents-grid">
        <Link href="/contents/avatar-contest" className="contents-card is-live">
          <div className="contents-card-art">
            {leader ? <PixelAvatar config={leader.avatar_config} size={112} alt="" /> : <TrophyIcon size={48} weight="fill" />}
            <CrownIcon className="contents-card-crown" size={28} weight="fill" />
          </div>
          <div className="contents-card-body">
            <span className="contents-badge is-live">진행 중</span>
            <div className="contents-card-title">아바타 자랑 대회</div>
            <div className="contents-card-desc">
              내 캐릭터를 뽐내고 투표를 받아보세요. 이번 주 1·2·3등에게 수상자 전용 왕관과 쌀 응모권을 드려요.
            </div>
            {contest && (
              <div className="contents-card-meta">참가 {contest.entries.length}명 · 현재 1위 {leader?.nickname}</div>
            )}
          </div>
        </Link>

        <div className="contents-card is-soon" aria-disabled="true">
          <div className="contents-card-art">
            <SparkleIcon size={44} weight="light" />
          </div>
          <div className="contents-card-body">
            <span className="contents-badge">준비 중</span>
            <div className="contents-card-title">새 컨텐츠 준비 중</div>
            <div className="contents-card-desc">캐릭터로 즐길 수 있는 다음 이벤트를 준비하고 있어요.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
