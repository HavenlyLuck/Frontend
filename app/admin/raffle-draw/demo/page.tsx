'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { FlaskIcon } from '@phosphor-icons/react'
import { verifyAdmin, ApiError } from '@/lib/api'
import { getValidSession, clearAuth } from '@/lib/auth'

const RaffleDrawCanvas = dynamic(() => import('@/components/RaffleDrawCanvas'), { ssr: false })

// 실제 상품/응모 데이터 없이 화면만 확인해보기 위한 가짜 참가자 데이터
const DEMO_ENTRANTS = [
  { entry_number: 1, ticket_count: 3 },
  { entry_number: 2, ticket_count: 8 },
  { entry_number: 3, ticket_count: 1 },
  { entry_number: 4, ticket_count: 5 },
  { entry_number: 5, ticket_count: 2 },
  { entry_number: 6, ticket_count: 6 },
  { entry_number: 7, ticket_count: 1 },
]

export default function RaffleDrawDemoPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [runKey, setRunKey] = useState(0)
  const [lastResult, setLastResult] = useState<{ winner: number; videoSize: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace('/login')
        return
      }
      verifyAdmin(session.token)
        .then(() => { if (!cancelled) setAuthChecked(true) })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) clearAuth()
          router.replace('/')
        })
    })
    return () => { cancelled = true }
  }, [router])

  if (!authChecked) return null

  return (
    <div className="home-container" style={{ maxWidth: 480 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/admin/raffle-draw" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskIcon size={20} weight="fill" color="var(--accent)" /> 추첨 데모
        </h1>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20, lineHeight: 1.6 }}>
        실제 상품이나 백엔드 저장 없이 화면만 확인하는 페이지예요. 응모 번호 1~7번에 각각{' '}
        {DEMO_ENTRANTS.map((e) => e.ticket_count).join('/')}장이 배정된 가짜 데이터로 돌아갑니다.
      </div>

      <RaffleDrawCanvas
        key={runKey}
        entrants={DEMO_ENTRANTS}
        onComplete={(winner, video) => setLastResult({ winner, videoSize: video.size })}
      />

      {lastResult && (
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
          지난 결과: #{lastResult.winner}번 당첨 (녹화 영상 {(lastResult.videoSize / 1024).toFixed(0)}KB, 업로드는 하지 않음)
        </div>
      )}

      <button
        onClick={() => { setLastResult(null); setRunKey((k) => k + 1) }}
        style={{ marginTop: 20, width: '100%', padding: '11px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        다시 하기
      </button>
    </div>
  )
}
