'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FlaskIcon } from '@phosphor-icons/react'
import { verifyAdmin, getMyProfile, ApiError } from '@/lib/api'
import { getValidSession, clearAuth } from '@/lib/auth'
import LightningDrawScene from '@/components/LightningDrawScene'
import { SAMPLE_MY_ENTRY as MY_ENTRY, SAMPLE_OTHER_WINNER as OTHER_WINNER, sampleEntrants } from '@/lib/lightningDraw/sample'
import { normalizeAvatar, type AvatarConfig } from '@/lib/avatar/compose'

// 실제 상품/응모 데이터 없이 번개 추첨 연출만 확인해보는 페이지

export default function RaffleDrawDemoPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [seed, setSeed] = useState(1)
  const [meWins, setMeWins] = useState(false)
  const [finished, setFinished] = useState(false)
  // "나"는 샘플 대신 캐릭터 꾸미기에서 저장한 내 캐릭터로 세운다 (꾸민 적 없으면 null → 임시 아바타)
  const [myAvatar, setMyAvatar] = useState<AvatarConfig | null>(null)
  const entrants = useMemo(() => sampleEntrants(seed, myAvatar), [seed, myAvatar])

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace('/login')
        return
      }
      verifyAdmin(session.token)
        .then(() => {
          if (cancelled) return
          setAuthChecked(true)
          getMyProfile(session.token)
            .then((p) => { if (!cancelled && p.avatar_config) setMyAvatar(normalizeAvatar(p.avatar_config)) })
            .catch(() => {}) // 못 불러오면 임시 아바타로 둔다
        })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) clearAuth()
          router.replace('/')
        })
    })
    return () => { cancelled = true }
  }, [router])

  if (!authChecked) return null

  const replay = (nextMeWins: boolean, nextSeed: number) => {
    setFinished(false)
    setMeWins(nextMeWins)
    setSeed(nextSeed)
  }

  const btn: React.CSSProperties = { flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }

  return (
    <div className="home-container" style={{ maxWidth: 480 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/admin/raffle-draw" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskIcon size={20} weight="fill" color="var(--accent)" /> 추첨 연출 데모
        </h1>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20, lineHeight: 1.6 }}>
        사용자가 마이페이지에서 &lsquo;당첨결과 확인하기&rsquo;를 누르면 나오는 번개 추첨 연출이에요.
        실제 상품·응모 데이터 없이 샘플 응모자(꾸민 캐릭터 + 안 꾸민 임시 아바타)로 장면만 확인합니다.
        장면 번호를 바꾸면 공원 배치와 사람들이 달라져요.
        &lsquo;나&rsquo;는 캐릭터 꾸미기에서 저장한 내 캐릭터로 나와요.{' '}
        <Link href="/mypage/avatar" style={{ color: 'var(--accent-fg)', fontWeight: 600, textDecoration: 'none' }}>
          캐릭터 꾸미기 →
        </Link>
      </div>

      <LightningDrawScene
        key={`${seed}-${meWins}-${myAvatar ? JSON.stringify(myAvatar) : 'none'}`}
        seed={seed}
        myEntryNumbers={[MY_ENTRY]}
        winnerEntryNumber={meWins ? MY_ENTRY : OTHER_WINNER}
        entrants={entrants}
        onFinish={() => setFinished(true)}
      />

      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', minHeight: 20 }}>
        장면 #{seed} · {meWins ? '내가 당첨' : '다른 사람 당첨'}{finished ? ' · 연출 끝 (여기서 결과 문구가 이어서 나옴)' : ''}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button style={btn} onClick={() => replay(false, seed + 1)}>다른 사람 당첨</button>
        <button style={btn} onClick={() => replay(true, seed + 1)}>내가 당첨</button>
      </div>
    </div>
  )
}
