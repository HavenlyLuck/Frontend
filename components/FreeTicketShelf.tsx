'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArchiveIcon, CameraIcon, ConfettiIcon, GiftIcon, LightbulbIcon, StorefrontIcon, TicketIcon, UsersThreeIcon } from '@phosphor-icons/react'
import { getMyFreeTicketGroups, type FreeTicketGroupResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { formatKstDate } from '@/lib/date'

const KIND = {
  first_purchase: { label: '쌀 응모권', Icon: GiftIcon, from: (n: string | null) => (n ? `${n}님을 추천인으로 등록해 받았어요` : '추천인 등록 보상') },
  referral: { label: '쌀 응모권', Icon: UsersThreeIcon, from: (n: string | null) => (n ? `${n}님이 나를 추천인으로 등록했어요` : '친구 추천 보상') },
  signup_event: { label: '쌀 응모권', Icon: ConfettiIcon, from: () => '오픈 이벤트 가입 선물' },
  store_purchase: { label: '쌀 응모권', Icon: StorefrontIcon, from: () => '쌀포인트 상점에서 구매' },
  idea_contest: { label: '쌀 응모권', Icon: LightbulbIcon, from: () => '천운 아바타 아이디어 공모전 수상' },
  storage_convert: { label: '쌀 응모권', Icon: ArchiveIcon, from: () => '보관 기한이 지난 상품에서 바뀌었어요' },
  review_photo: { label: '쌀 응모권', Icon: CameraIcon, from: () => '사진 후기 작성 보상' },
} as const

// 처음에 보여 줄 묶음 수 — 넘으면 "더 보기"로 펼친다
const INITIAL_GROUPS = 4

// 받은 날짜 — 같은 날이면 하루, 다르면 "처음 ~ 마지막"
function dateRange(g: FreeTicketGroupResponse): string {
  const first = g.first_at ? formatKstDate(g.first_at) : ''
  const last = g.last_at ? formatKstDate(g.last_at) : ''
  return first && last && first !== last ? `${first} ~ ${last}` : first || last
}

// 보관함 맨 위 — 아직 쓰지 않은 쌀 응모권. 응모 상품에서 결제 대신 쓸 수 있다
// 1장마다 카드를 그리면 수백·수천 장일 때 화면이 끝없이 길어지므로, 받은 경로별로 묶어 "×N장"으로 보여 준다
export default function FreeTicketShelf() {
  const [groups, setGroups] = useState<FreeTicketGroupResponse[] | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    getValidSession().then(session => {
      if (!session) return
      getMyFreeTicketGroups(session.token).then(setGroups).catch(() => setGroups([]))
    })
  }, [])

  const total = groups?.reduce((sum, g) => sum + g.count, 0) ?? 0
  if (!groups || total === 0) return null
  const shown = expanded ? groups : groups.slice(0, INITIAL_GROUPS)

  return (
    <section className="free-ticket-shelf">
      <div className="free-ticket-shelf-head">
        <span><TicketIcon size={15} weight="fill" color="var(--accent)" /> 내 쌀 응모권 <b>{total.toLocaleString()}장</b></span>
        <Link href="/eungmo" className="free-ticket-shelf-link">응모하러 가기 →</Link>
      </div>
      <div className="free-ticket-list">
        {shown.map(g => {
          const kind = KIND[g.kind]
          return (
            <div key={`${g.kind}-${g.related_nickname ?? ''}`} className={`free-ticket ${g.kind}`}>
              <kind.Icon size={20} weight="fill" className="free-ticket-icon" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="free-ticket-title">{kind.label}</div>
                <div className="free-ticket-desc">{kind.from(g.related_nickname)} · {dateRange(g)}</div>
              </div>
              <b className="free-ticket-count">×{g.count.toLocaleString()}장</b>
            </div>
          )
        })}
      </div>
      {groups.length > INITIAL_GROUPS && (
        <button type="button" className="free-ticket-more" onClick={() => setExpanded(v => !v)}>
          {expanded ? '접기' : `받은 경로 ${groups.length - INITIAL_GROUPS}개 더 보기`}
        </button>
      )}
      <p className="free-ticket-note">응모 상품에서 결제 대신 1장당 응모권 1장으로 응모할 수 있어요. 쌀 응모권은 낙첨돼도 쌀포인트가 적립되지 않아요.</p>
    </section>
  )
}
