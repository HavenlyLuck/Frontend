'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DiceFiveIcon, TicketIcon } from '@phosphor-icons/react'
import {
  verifyAdmin, ApiError, getPendingDrawProducts,
  type RaffleProductResponse,
} from '@/lib/api'
import { getValidSession, clearAuth } from '@/lib/auth'
import { getDrawAt, parseServerTime } from '@/lib/raffle'

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }

const POLL_MS = 15_000

// 매진된 응모는 서버가 매진 5분 뒤 자동으로 추첨한다. 이 화면은 추첨 대기 중인 상품을 지켜보기만 한다.
export default function AdminRaffleDrawPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)

  const [products, setProducts] = useState<RaffleProductResponse[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [now, setNow] = useState(() => Date.now())

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
          setAdminToken(session.token)
          setAuthChecked(true)
        })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            clearAuth()
          }
          router.replace('/')
        })
    })
    return () => { cancelled = true }
  }, [router])

  useEffect(() => {
    if (!adminToken) return
    const load = () => getPendingDrawProducts(adminToken)
      .then((list) => { setProducts(list); setLoadError('') })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : '목록을 불러오지 못했습니다.'))
    load()
    const poll = setInterval(load, POLL_MS)
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(poll); clearInterval(tick) }
  }, [adminToken])

  if (!authChecked) return null

  return (
    <div className="home-container" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <DiceFiveIcon size={23} weight="fill" color="var(--accent)" /> 라플 추첨
        </h1>
        <Link href="/admin/raffle-draw/demo" style={{ fontSize: 13, color: 'var(--accent-fg)', textDecoration: 'none', fontWeight: 600 }}>
          데모로 미리보기 →
        </Link>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 24, lineHeight: 1.6 }}>
        응모권이 매진되면 5분 뒤 서버가 자동으로 추첨해요(응모권 수만큼 당첨 확률).
        응모자는 마이페이지에서 결과를 열면 자기 캐릭터들이 선 번개 추첨 연출을 보게 됩니다.
      </div>

      {loadError && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{loadError}</div>}

      {products === null ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : products.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          추첨 대기 중인 상품이 없어요.
        </div>
      ) : (
        products.map((p) => {
          const drawAt = getDrawAt(p.sold_out_at)
          const left = drawAt == null ? null : Math.max(0, Math.ceil((drawAt - now) / 1000))
          return (
            <div key={p.raffle_product_id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{p.product_name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TicketIcon size={13} /> 총 {p.sold_slots}장 판매
                  {p.sold_out_at && <> · 매진 {new Date(parseServerTime(p.sold_out_at)).toLocaleTimeString('ko-KR')}</>}
                </div>
              </div>
              <span className="status-badge ongoing" style={{ whiteSpace: 'nowrap' }}>
                {left == null
                  ? '매진 확인 중'
                  : left > 0
                    ? `자동 추첨까지 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
                    : '추첨 처리 중'}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}
