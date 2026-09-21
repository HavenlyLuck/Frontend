'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { DiceFiveIcon, TicketIcon, XIcon } from '@phosphor-icons/react'
import {
  verifyAdmin, ApiError,
  getPendingDrawProducts, getRaffleEntrants, drawRaffleWinner,
  type RaffleProductResponse, type RaffleEntrantResponse,
} from '@/lib/api'
import { getValidSession, clearAuth } from '@/lib/auth'

// box2d-wasm이 브라우저 전용이라 서버 렌더링 시에는 로드하지 않는다
const RaffleDrawCanvas = dynamic(() => import('@/components/RaffleDrawCanvas'), { ssr: false })

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 400, padding: 16,
}

export default function AdminRaffleDrawPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)

  const [products, setProducts] = useState<RaffleProductResponse[] | null>(null)
  const [loadError, setLoadError] = useState('')

  const [drawTarget, setDrawTarget] = useState<RaffleProductResponse | null>(null)
  const [entrants, setEntrants] = useState<RaffleEntrantResponse[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [drawError, setDrawError] = useState('')

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
    getPendingDrawProducts(adminToken)
      .then(setProducts)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : '목록을 불러오지 못했습니다.'))
  }, [adminToken])

  const openDraw = async (product: RaffleProductResponse) => {
    if (!adminToken) return
    setDrawError('')
    setEntrants(null)
    setDrawTarget(product)
    try {
      const list = await getRaffleEntrants(adminToken, product.raffle_product_id)
      setEntrants(list)
    } catch (err) {
      setDrawError(err instanceof ApiError ? err.message : '참가자 정보를 불러오지 못했습니다.')
    }
  }

  const closeDraw = () => {
    setDrawTarget(null)
    setEntrants(null)
    setDrawError('')
  }

  const handleComplete = async (winnerEntryNumber: number, video: Blob) => {
    if (!adminToken || !drawTarget) return
    setUploading(true)
    setDrawError('')
    try {
      await drawRaffleWinner(adminToken, drawTarget.raffle_product_id, winnerEntryNumber, video)
      setProducts((prev) => prev?.filter((p) => p.raffle_product_id !== drawTarget.raffle_product_id) ?? null)
      closeDraw()
    } catch (err) {
      setDrawError(err instanceof ApiError ? err.message : '결과 저장에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  if (!authChecked) return null

  return (
    <div className="home-container" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <DiceFiveIcon size={23} weight="fill" color="var(--accent)" /> 라플 추첨
        </h1>
        <Link href="/admin/raffle-draw/demo" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          데모로 미리보기 →
        </Link>
      </div>

      {loadError && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{loadError}</div>}

      {products === null ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : products.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          추첨 대기 중인 상품이 없어요.
        </div>
      ) : (
        products.map((p) => (
          <div key={p.raffle_product_id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{p.product_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <TicketIcon size={13} /> 총 {p.sold_slots}장 판매 · 마감 {new Date(p.ends_at).toLocaleString('ko-KR')}
              </div>
            </div>
            <button
              onClick={() => openDraw(p)}
              style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              추첨하기
            </button>
          </div>
        ))
      )}

      {drawTarget && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget && !uploading) closeDraw() }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 16, padding: '24px 24px 20px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{drawTarget.product_name} 추첨</div>
              {!uploading && (
                <button onClick={closeDraw} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}>
                  <XIcon size={18} />
                </button>
              )}
            </div>

            {drawError && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{drawError}</div>}

            {entrants === null ? (
              <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>참가자 정보 불러오는 중...</div>
            ) : entrants.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>응모자가 없어요.</div>
            ) : (
              <RaffleDrawCanvas entrants={entrants} onComplete={handleComplete} />
            )}

            {uploading && <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>영상 업로드 중...</div>}
          </div>
        </div>
      )}
    </div>
  )
}
