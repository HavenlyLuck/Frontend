'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CaretLeftIcon, CheckIcon, CrownIcon, HeartIcon, TrophyIcon } from '@phosphor-icons/react'
import PixelAvatar from '@/components/PixelAvatar'
import { getValidSession } from '@/lib/auth'
import { getMyProfile } from '@/lib/api'
import { normalizeAvatar, type AvatarConfig } from '@/lib/avatar/compose'
import { getCurrentContest, joinContest, voteContest, type ContestEntry, type ContestSeason } from '@/lib/avatarContest'

const RANK_COLOR = { 1: '#f3c94f', 2: '#cfd6e2', 3: '#d49a6a' } as const
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDay(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEKDAYS[d.getDay()]})`
}

function formatLeft(ms: number) {
  if (ms <= 0) return '집계 중'
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return d > 0 ? `${d}일 ${h}시간 남음` : h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`
}

// 득표 많은 순, 같으면 먼저 참가한 순
const byRank = (a: ContestEntry, b: ContestEntry) => b.votes - a.votes || (a.joined_at < b.joined_at ? -1 : 1)

export default function AvatarContestPage() {
  const [season, setSeason] = useState<ContestSeason | null>(null)
  const [sort, setSort] = useState<'popular' | 'latest'>('popular')
  const [now, setNow] = useState(() => Date.now())
  const [session, setSession] = useState<{ token: string; nickname: string; avatar: AvatarConfig } | null>(null)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getCurrentContest().then(setSeason).catch(() => {})
    let cancelled = false
    getValidSession().then(s => {
      if (cancelled) return
      setLoggedIn(!!s)
      if (!s) return
      getMyProfile(s.token)
        .then(p => { if (!cancelled) setSession({ token: s.token, nickname: p.nickname, avatar: normalizeAvatar(p.avatar_config) }) })
        .catch(() => {})
    })
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  const ranked = useMemo(() => (season ? [...season.entries].sort(byRank) : []), [season])
  const rankOf = (id: number) => ranked.findIndex(e => e.entry_id === id) + 1
  const listed = useMemo(
    () => (sort === 'popular' ? ranked : [...ranked].sort((a, b) => (a.joined_at < b.joined_at ? 1 : -1))),
    [ranked, sort],
  )
  const myEntry = season?.entries.find(e => e.entry_id === season.my_entry_id) ?? null

  const join = async () => {
    if (!session || busy) return
    setBusy(true)
    try {
      setSeason(await joinContest(session.token, { nickname: session.nickname, avatar: session.avatar }))
    } catch (e) {
      alert(e instanceof Error ? e.message : '참가하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const vote = async (entry: ContestEntry) => {
    if (!session || busy) return
    if (!confirm(`${entry.nickname}님에게 오늘의 1표를 줄까요?`)) return
    setBusy(true)
    try {
      setSeason(await voteContest(session.token, entry.entry_id))
    } catch (e) {
      alert(e instanceof Error ? e.message : '투표하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  if (!season) {
    return <div className="home-container" style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '80px 0' }}>불러오는 중...</div>
  }

  const left = new Date(season.ends_at).getTime() - now
  const podium = [ranked[1], ranked[0], ranked[2]].filter(Boolean) as ContestEntry[]

  return (
    <div className="home-container" style={{ maxWidth: 960 }}>
      <Link href="/contents" className="contest-back"><CaretLeftIcon size={14} /> 컨텐츠</Link>

      {/* 시즌 헤더 */}
      <div className="contest-hero">
        <div>
          <div className="contest-hero-title"><TrophyIcon size={24} weight="fill" color="var(--gold)" /> {season.title}</div>
          <div className="contest-hero-period">{formatDay(season.starts_at)} ~ {formatDay(new Date(new Date(season.ends_at).getTime() - 1).toISOString())}</div>
        </div>
        <div className="contest-hero-left">{formatLeft(left)}</div>
      </div>

      {/* 단상 */}
      <div className="contest-podium">
        {podium.map(e => {
          const rank = rankOf(e.entry_id) as 1 | 2 | 3
          return (
            <div key={e.entry_id} className={`contest-podium-spot rank-${rank}`}>
              <CrownIcon size={rank === 1 ? 30 : 24} weight="fill" color={RANK_COLOR[rank]} />
              <PixelAvatar config={e.avatar_config} size={rank === 1 ? 128 : 100} alt={`${e.nickname}의 캐릭터`} />
              <div className="contest-podium-name">{e.nickname}</div>
              <div className="contest-podium-votes"><HeartIcon size={12} weight="fill" /> {e.votes.toLocaleString()}표</div>
              <div className="contest-podium-block" style={{ borderColor: RANK_COLOR[rank] }}>{rank}</div>
            </div>
          )
        })}
      </div>

      {/* 상품 + 규칙 */}
      <div className="contest-info">
        <div className="contest-prizes">
          {season.prizes.map(p => (
            <div key={p.rank} className="contest-prize">
              <CrownIcon size={20} weight="fill" color={RANK_COLOR[p.rank]} />
              <div>
                <div className="contest-prize-rank">{p.rank}등</div>
                <div className="contest-prize-desc">{p.item} + 쌀 응모권 {p.ssal_ticket}장</div>
              </div>
            </div>
          ))}
        </div>
        <ul className="contest-rules">
          <li>참가는 무료예요. 지금 저장된 내 캐릭터로 참가해요.</li>
          <li>투표는 한 계정당 하루 1표, 내 캐릭터에는 투표할 수 없어요.</li>
          <li>매주 월요일 0시에 새 시즌이 열리고, 일요일 자정에 순위가 확정돼요.</li>
        </ul>
      </div>

      {/* 내 상태 */}
      <div className="contest-me">
        {loggedIn === false ? (
          <>
            <span>로그인하면 내 캐릭터로 참가하고 투표할 수 있어요.</span>
            <Link href="/login" className="contest-btn">로그인</Link>
          </>
        ) : myEntry ? (
          <>
            <PixelAvatar config={myEntry.avatar_config} size={56} alt="내 캐릭터" />
            <span>참가 중 · <b>{rankOf(myEntry.entry_id)}위</b> · {myEntry.votes.toLocaleString()}표</span>
            <span className="contest-me-vote">{season.voted_today ? '오늘의 투표 완료' : '오늘 1표 남았어요'}</span>
          </>
        ) : session ? (
          <>
            <PixelAvatar config={session.avatar} size={56} alt="내 캐릭터" />
            <span>지금 내 캐릭터로 참가해 보세요. 꾸밀수록 눈에 띄어요.</span>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <Link href="/mypage/avatar" className="contest-btn is-ghost">캐릭터 꾸미기</Link>
              <button type="button" className="contest-btn" onClick={join} disabled={busy}>참가하기</button>
            </div>
          </>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>내 정보를 불러오는 중...</span>
        )}
      </div>

      {/* 참가자 */}
      <div className="contest-list-head">
        <div className="contest-list-title">참가자 {season.entries.length}명</div>
        <div className="shop-subtabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {(['popular', 'latest'] as const).map(s => (
            <button key={s} type="button" className={`shop-subtab${sort === s ? ' active' : ''}`} onClick={() => setSort(s)}>
              {s === 'popular' ? '인기순' : '최신순'}
            </button>
          ))}
        </div>
      </div>
      <div className="contest-grid">
        {listed.map(e => {
          const rank = rankOf(e.entry_id)
          const mine = e.entry_id === season.my_entry_id
          return (
            <div key={e.entry_id} className={`contest-card${mine ? ' is-mine' : ''}`}>
              <span className="contest-card-rank" style={rank <= 3 ? { color: RANK_COLOR[rank as 1 | 2 | 3] } : undefined}>{rank}위</span>
              <PixelAvatar config={e.avatar_config} size={112} alt={`${e.nickname}의 캐릭터`} />
              <div className="contest-card-name">{e.nickname}{mine && <span className="contest-card-me">나</span>}</div>
              <div className="contest-card-votes"><HeartIcon size={12} weight="fill" /> {e.votes.toLocaleString()}표</div>
              <button
                type="button"
                className="contest-vote-btn"
                disabled={!session || mine || season.voted_today || busy}
                onClick={() => vote(e)}
              >
                {mine ? '내 캐릭터' : season.voted_today ? <><CheckIcon size={13} /> 오늘 투표 완료</> : '투표하기'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
