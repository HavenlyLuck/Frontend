'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckIcon,
  ConfettiIcon,
  GiftIcon,
  HeartIcon,
  LockIcon,
  TicketIcon,
} from '@phosphor-icons/react'
import { fetchKujiProduct, type KujiLastOne, type KujiProduct, type KujiTier } from '@/lib/kujiData'
import { confirmKujiDraw, fetchKujiBoard, type KujiBoard } from '@/lib/kujiBoard'
import { isWished, toggleWishlist } from '@/lib/wishlist'
import { getValidSession, isLoggedIn } from '@/lib/auth'
import KujiReveal from '@/components/KujiReveal'
import KujiAvatarScene from '@/components/KujiAvatarScene'
import { ApiError, getMyProfile } from '@/lib/api'
import { PaymentWindowError } from '@/lib/payment'
import { DEFAULT_AVATAR, normalizeAvatar, type AvatarConfig } from '@/lib/avatar/compose'
import RefundNotice from "@/components/RefundNotice";

type DrawResult = { ticketId: number; grade: string; tier: KujiTier }[]

// 제비판이 열려 있을 땐 자주, 닫혀 있을 땐 남은 개수만 가끔 맞춘다
const POLL_OPEN_MS = 4_000
const POLL_CLOSED_MS = 15_000
// 다른 사람이 방금 뽑은 제비를 번쩍 표시해 두는 시간
const TAKEN_FLASH_MS = 1_400

export default function KujiProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  useEffect(() => {
    if (!isLoggedIn()) {
      alert('로그인 후 이용해주세요.')
      router.replace('/login')
    }
  }, [router])

  const [product, setProduct] = useState<KujiProduct | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    fetchKujiProduct(Number(params.id)).then(p => { if (!cancelled) setProduct(p) })
    return () => { cancelled = true }
  }, [params.id])

  if (product === undefined || product === null) {
    return (
      <div className="home-container">
        <div className="coming-soon-box large">
          <div className="emoji"><GiftIcon size={32} weight="light" /></div>
          <div className="title">{product === undefined ? '불러오는 중이에요' : '쿠지를 찾을 수 없어요'}</div>
          {product === null && <div className="desc">종료되었거나 존재하지 않는 쿠지예요</div>}
        </div>
      </div>
    )
  }

  return <KujiProductView product={product} />
}

function KujiProductView({ product }: { product: KujiProduct }) {
  const router = useRouter()
  const wishId = `kuji-${product.id}`

  const [qty, setQty] = useState(1)
  const [isLiked, setIsLiked] = useState(() => isWished(wishId))
  const [drawOpen, setDrawOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [results, setResults] = useState<DrawResult | null>(null)
  const [conflictIds, setConflictIds] = useState<number[]>([])
  const [confirming, setConfirming] = useState(false)
  const [justTaken, setJustTaken] = useState<number[]>([])
  // 뽑기 결과 카드 — 연 제비, "모두 열기"로 한꺼번에 연 제비(차례로 뒤집히는 순서)
  const [revealed, setRevealed] = useState<number[]>([])
  const [skipped, setSkipped] = useState<number[]>([])
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  // 제비판 상태는 서버 기준. version 0이라 첫 조회는 항상 전체를 받는다.
  const [board, setBoard] = useState<KujiBoard>({ version: 0, drawn: [] })
  const ticketIds = useMemo(() => Array.from({ length: product.totalTickets }, (_, i) => i + 1), [product.totalTickets])
  const boardRef = useRef(board)
  const drawnGrade = useMemo(() => new Map(board.drawn.map(d => [d.id, d.grade])), [board])

  // 새 제비판 반영. 다른 사람이 뽑은 제비는 번쩍 표시하고, 내가 고르던 제비였으면 선택을 풀고 알려준다.
  const applyBoard = (next: KujiBoard, mine: number[] = []) => {
    const prevIds = new Set(boardRef.current.drawn.map(d => d.id))
    const taken = next.drawn.map(d => d.id).filter(id => !prevIds.has(id) && !mine.includes(id))
    boardRef.current = next
    setBoard(next)
    if (taken.length === 0) return
    setJustTaken(prev => [...prev, ...taken])
    setTimeout(() => setJustTaken(prev => prev.filter(id => !taken.includes(id))), TAKEN_FLASH_MS)
    const lost = selectedRef.current.filter(id => taken.includes(id))
    if (lost.length > 0) {
      setSelected(prev => prev.filter(id => !lost.includes(id)))
      setConflictIds(lost)
    }
  }
  const applyBoardRef = useRef(applyBoard)
  applyBoardRef.current = applyBoard

  // 화면이 보일 때만 주기적으로 제비판을 다시 받는다 (바뀐 게 없으면 서버는 빈 응답)
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const next = await fetchKujiBoard(product.id, boardRef.current.version)
        if (!cancelled && next) applyBoardRef.current(next)
      } catch {
        // 네트워크 오류면 다음 주기에 다시 받는다
      }
    }
    tick()
    const timer = setInterval(tick, drawOpen ? POLL_OPEN_MS : POLL_CLOSED_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [product.id, drawOpen])

  const remaining = product.totalTickets - board.drawn.length
  // 다 뽑혔거나 관리자가 판매를 끝낸 쿠지
  const closed = remaining === 0 || !product.open
  const tierRemaining = (grade: string) =>
    (product.tiers.find(t => t.grade === grade)?.count ?? 0) - board.drawn.filter(d => d.grade === grade).length
  const topTiers = product.tiers.filter(t => t.isTop)
  const lowerTiers = product.tiers.filter(t => !t.isTop)
  const maxQty = Math.max(1, Math.min(10, remaining))

  // 남은 제비가 줄어 고른 개수보다 적어지면 개수를 맞춘다
  useEffect(() => {
    setQty(prev => Math.min(prev, maxQty))
  }, [maxQty])

  const changeQty = (delta: number) =>
    setQty(prev => Math.min(maxQty, Math.max(1, prev + delta)))

  const openDraw = () => {
    setSelected([])
    setResults(null)
    setRevealed([])
    setSkipped([])
    setLastOne(null)
    setShowLastOne(false)
    setScenePhase('draw')
    setCardsReady(false)
    setConflictIds([])
    setDrawOpen(true)
  }

  const allRevealed = results != null && revealed.length >= results.length

  // 결과 무대 위 픽셀 장면 — 내 아바타가 상자에서 제비를 뽑은 뒤에 카드가 깔린다
  const [myAvatar, setMyAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [scenePhase, setScenePhase] = useState<'draw' | 'idle' | 'strike'>('draw')
  const [cardsReady, setCardsReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    getValidSession().then(session => {
      if (!session) return
      getMyProfile(session.token)
        .then(p => { if (!cancelled) setMyAvatar(normalizeAvatar(p.avatar_config)) })
        .catch(() => {}) // 못 불러오면 기본 캐릭터로
    })
    return () => { cancelled = true }
  }, [])

  // 라스트원상 — 내 카드를 다 연 뒤 잠깐 뜸을 들였다가, 장면 속 내 아바타에게 번개가 떨어지고 나타난다
  const [lastOne, setLastOne] = useState<KujiLastOne | null>(null)
  const [showLastOne, setShowLastOne] = useState(false)
  const [boltFlash, setBoltFlash] = useState(false)
  useEffect(() => {
    if (!allRevealed || !lastOne || showLastOne || scenePhase !== 'idle') return
    const t = setTimeout(() => {
      setScenePhase('strike')
      setBoltFlash(true)
    }, 600)
    return () => clearTimeout(t)
  }, [allRevealed, lastOne, showLastOne, scenePhase])
  const onStrikeDone = () => {
    setShowLastOne(true)
    setScenePhase('idle')
    setTimeout(() => setBoltFlash(false), 300)
  }
  // 라스트원상이 있으면 그것까지 나타난 뒤에 끝난 것으로 본다
  const revealFinished = allRevealed && (!lastOne || showLastOne)

  // 상위상이 열리는 순간 화면 전체가 한 번 금빛으로 번쩍인다 (카드가 뒤집히는 시간에 맞춰 조금 늦게)
  const [topFlash, setTopFlash] = useState(false)
  const flashTop = (delayMs: number) => {
    setTimeout(() => {
      setTopFlash(true)
      setTimeout(() => setTopFlash(false), 700)
    }, delayMs)
  }
  const isTopTicket = (id: number) => results?.find(r => r.ticketId === id)?.tier.isTop ?? false

  const revealOne = (id: number) => {
    setRevealed(prev => (prev.includes(id) ? prev : [...prev, id]))
    if (isTopTicket(id)) flashTop(350)
  }
  const revealAll = () => {
    if (!results) return
    const rest = results.map(r => r.ticketId).filter(id => !revealed.includes(id))
    setSkipped(rest)
    setRevealed(prev => [...prev, ...rest])
    const firstTop = rest.findIndex(isTopTicket)
    if (firstTop >= 0) flashTop(firstTop * 110 + 350)
  }

  const closeDraw = () => setDrawOpen(false)

  const toggleTicket = (ticketId: number) => {
    if (drawnGrade.has(ticketId) || confirming) return
    setConflictIds([])
    setSelected(prev => {
      if (prev.includes(ticketId)) return prev.filter(id => id !== ticketId)
      if (prev.length >= qty) return prev
      return [...prev, ticketId]
    })
  }

  const confirmDraw = async () => {
    if (confirming) return
    const session = await getValidSession()
    if (!session) {
      alert('로그인 후 이용해주세요.')
      router.replace('/login')
      return
    }
    setConfirming(true)
    try {
      const res = await confirmKujiDraw(session.token, product.id, selected)
      if (!res.ok) {
        // 확정 직전에 다른 사람이 먼저 가져간 제비 — 그 제비만 선택 해제하고
        // 나머지 선택은 그대로 둔 채 다시 고르게 한다 (부분 뽑기는 하지 않음)
        applyBoard(res.board)
        setSelected(prev => prev.filter(id => !res.conflictIds.includes(id)))
        setConflictIds(res.conflictIds)
        return
      }
      applyBoard(res.board, res.drawn.map(d => d.ticketId))
      setConflictIds([])
      setResults(res.drawn.map(d => ({ ...d, tier: product.tiers.find(t => t.grade === d.grade)! })))
      setLastOne(res.lastOne)
      setSelected([])
    } catch (err) {
      // 결제 취소, 판매 종료 등은 서버·결제창이 알려준 이유를 그대로 보여준다
      alert(err instanceof ApiError || err instanceof PaymentWindowError ? err.message : '뽑기 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setConfirming(false)
    }
  }

  // 상위상·하위상 카드 — 사진, 등급, 남은 개수 (다 나가면 SOLD OUT)
  const renderTierTile = (tier: KujiTier) => {
    const left = tierRemaining(tier.grade)
    const soldOut = left === 0
    return (
      <div key={tier.grade} style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--bg-subtle)' }}>
          {tier.image ? (
            <img src={tier.image} alt={tier.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: soldOut ? 'blur(2px) brightness(0.5)' : undefined }} />
          ) : (
            // 사진 없이 등록한 상품
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <GiftIcon size={36} weight="fill" />
            </div>
          )}
          {soldOut && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 2, padding: '5px 12px', borderRadius: 6, border: '2px solid #ffffff66', background: 'rgba(0,0,0,0.55)' }}>SOLD OUT</span>
            </div>
          )}
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--bg)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>{tier.grade}상</span>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{tier.title}</div>
          <div style={{ fontSize: 12, color: soldOut ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
            {soldOut ? '모두 소진되었습니다' : `${left} / ${tier.count}개 남음`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="container">
        <div className="breadcrumb">
          <span><Link href="/">홈</Link></span>
          <span><Link href="/kuji">쿠지</Link></span>
          <span>{product.title}</span>
        </div>

        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20, position: 'relative', height: 'clamp(240px, 34vw, 420px)' }}>
          <img src={product.banner} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.75), rgba(0,0,0,0.1))' }} />
          <div style={{ position: 'absolute', left: 20, bottom: 16, color: '#fff' }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(22, 24, 29, 0.72)', padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <GiftIcon size={12} weight="fill" color="var(--gold)" /> {closed ? '쿠지 종료' : '쿠지 진행 중'}
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{product.title}</div>
          </div>
        </div>

        {product.description && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{product.description}</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', marginBottom: 28 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>남은 수량</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{remaining} / {product.totalTickets}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: 'var(--warn)', transformOrigin: 'left', transform: `scaleX(${remaining / product.totalTickets})`, transition: 'transform 0.2s' }} />
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
            {product.pricePerTicket.toLocaleString()}원 <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>/ 1장</span>
          </div>
        </div>

        <div className="section-title" style={{ marginBottom: 14 }}>상위상</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {topTiers.map(renderTierTile)}
          {product.lastOne && (
            <div className="kuji-lastone-tile">
              <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--bg-subtle)' }}>
                <img
                  src={product.lastOne.image}
                  alt={product.lastOne.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: remaining === 0 ? 'blur(2px) brightness(0.5)' : undefined }}
                />
                <span className="kuji-last-badge" style={{ top: 8, left: 8, transform: 'none' }}>LAST ONE</span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{product.lastOne.title}</div>
                <div style={{ fontSize: 12, color: remaining === 0 ? 'var(--text-tertiary)' : '#c9b2ff' }}>
                  {remaining === 0 ? '주인공이 나왔어요' : '마지막 1장을 뽑은 분께 추가로 드려요'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="section-title" style={{ marginBottom: 14 }}>하위상</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 32 }}>
          {lowerTiers.map(renderTierTile)}
        </div>

        <RefundNotice kind="kuji" style={{ marginTop: 0, marginBottom: 16 }} />

        <div style={{ position: 'sticky', bottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>뽑을 개수</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 16px', width: 'fit-content' }}>
                <button onClick={() => changeQty(-1)} disabled={closed} style={{ width: 28, height: 28, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center', color: 'var(--text)' }}>{qty}</span>
                <button onClick={() => changeQty(1)} disabled={closed} style={{ width: 28, height: 28, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}>+</button>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                총 {(product.pricePerTicket * qty).toLocaleString()}원 (최대 {maxQty}장)
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className={`btn-wish ${isLiked ? 'liked' : ''}`}
                  onClick={() => setIsLiked(toggleWishlist({
                    id: wishId,
                    href: `/kuji/${product.id}`,
                    title: product.title,
                    image: product.banner,
                    subtitle: `${product.pricePerTicket.toLocaleString()}원 / 1장`,
                  }))}
                >
                  <HeartIcon size={19} weight={isLiked ? 'fill' : 'regular'} color={isLiked ? 'var(--danger)' : 'var(--text-tertiary)'} />
                </button>
                <button
                  onClick={openDraw}
                  disabled={closed}
                  style={{
                    padding: '14px 28px', borderRadius: 12, border: 'none',
                    background: closed ? 'var(--border)' : 'var(--accent)',
                    color: closed ? 'var(--text-tertiary)' : '#ffffff',
                    fontSize: 15, fontWeight: 700, cursor: closed ? 'default' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {closed ? '품절되었습니다' : <><TicketIcon size={16} weight="fill" /> 뽑기 시작</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {drawOpen && !results && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {`번호를 선택해주세요 (${selected.length}/${qty})`}
              </div>
              <button onClick={closeDraw} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-tertiary)' }}>×</button>
            </div>

            {conflictIds.length > 0 && !results && (
              <div role="status" style={{ margin: '14px 20px 0', padding: '10px 14px', borderRadius: 10, background: 'var(--danger-tint)', border: '1px solid var(--danger-tint-border)', color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
                제비 {conflictIds.map(id => `#${id}`).join(', ')}은(는) 방금 다른 분이 먼저 뽑아서 선택이 해제됐어요. 나머지 선택은 그대로 남아있으니 빈 자리만 다시 골라주세요.
              </div>
            )}
            {!results && (
              <div style={{ margin: '12px 20px 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
                다른 분이 뽑은 제비는 실시간으로 회색으로 바뀌어요.
              </div>
            )}

            <div className="kuji-draw-modal-body" style={{ padding: 20, overflowY: 'auto' }}>
              {(
                <div className="kuji-ticket-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
                  {ticketIds.map(ticketId => {
                    const isSelected = selected.includes(ticketId)
                    const drawnAs = drawnGrade.get(ticketId)
                    const isDrawn = drawnAs != null
                    return (
                      <button
                        key={ticketId}
                        className={justTaken.includes(ticketId) ? 'kuji-ticket-taken' : undefined}
                        onClick={() => toggleTicket(ticketId)}
                        disabled={isDrawn}
                        style={{
                          aspectRatio: '3 / 4',
                          borderRadius: 6,
                          border: isSelected ? '2px solid var(--accent)' : isDrawn ? '1px solid var(--border)' : '1px solid var(--gold-tint-border)',
                          background: isDrawn ? 'var(--bg-subtle)' : isSelected ? 'var(--accent)' : 'var(--gold-tint)',
                          color: isDrawn ? 'var(--text-tertiary)' : isSelected ? '#ffffff' : 'var(--gold)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          cursor: isDrawn ? 'default' : 'pointer',
                          fontSize: 10, fontWeight: 700, gap: 2, padding: 2,
                          opacity: isDrawn ? 0.85 : 1,
                          boxShadow: isSelected ? '0 0 0 2px var(--accent-tint-border)' : undefined,
                          transition: 'all 0.12s',
                        }}
                      >
                        {isDrawn ? (
                          <>
                            <LockIcon size={12} weight="fill" />
                            <span>{drawnAs}상</span>
                          </>
                        ) : (
                          <>
                            {isSelected ? <CheckIcon size={14} weight="bold" /> : <GiftIcon size={14} weight="fill" />}
                            <span style={{ opacity: 0.85 }}>#{ticketId}</span>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, lineHeight: 1.6, color: 'var(--text-tertiary)' }}>
                쿠지는 결제와 동시에 결과가 정해져서 <b>결제 후에는 취소·환불할 수 없어요.</b> 받은 상품이 파손·불량이면 교환해 드려요.{' '}
                <a href="/refund#쿠지" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>
                  취소·환불 정책
                </a>
              </p>
              <button
                onClick={confirmDraw}
                disabled={selected.length !== qty || confirming}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none',
                  background: selected.length === qty ? 'var(--accent)' : 'var(--border)',
                  color: selected.length === qty ? '#ffffff' : 'var(--text-tertiary)',
                  fontSize: 15, fontWeight: 700, cursor: selected.length === qty && !confirming ? 'pointer' : 'default',
                  opacity: confirming ? 0.7 : 1,
                }}
              >
                {confirming ? '결제 중...' : `${(product.pricePerTicket * selected.length).toLocaleString()}원 결제하고 뽑기 (${selected.length}/${qty})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 뽑기 결과 — 상자 없이 화면 전체를 어둡게 덮고 카드만 띄운다 */}
      {drawOpen && results && (
        <div
          className={`kuji-stage${topFlash ? ' is-flash' : ''}${boltFlash ? ' is-bolt' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="쿠지 뽑기 결과"
        >
          <KujiAvatarScene
            avatar={myAvatar}
            count={results.length}
            phase={scenePhase}
            onDrawDone={() => { setCardsReady(true); setScenePhase('idle') }}
            onStrikeDone={onStrikeDone}
          />

          <div className="kuji-stage-title">
            {!cardsReady
              ? '제비를 뽑는 중...'
              : showLastOne
                ? <><ConfettiIcon size={26} weight="fill" color="var(--gold)" /> 라스트원상까지 획득!</>
                : revealFinished
                  ? <><ConfettiIcon size={26} weight="fill" color="var(--gold)" /> 뽑기 결과</>
                  : '결과를 확인해보세요'}
          </div>
          <div className="kuji-stage-sub">
            {!cardsReady
              ? `${results.length}장을 뽑고 있어요`
              : showLastOne
                ? '이 판의 마지막 제비를 뽑으셨어요. 라스트원상도 보관함에 함께 담겨요.'
                : revealFinished
                  ? '당첨된 상품은 보관함에서 확인하고 택배로 받으실 수 있어요.'
                  : `${results.length}장 중 ${revealed.length}장 열었어요`}
          </div>

          <div className="kuji-stage-cards">
            {cardsReady && (
              <KujiReveal
                items={results}
                revealed={revealed}
                skipped={skipped}
                onReveal={revealOne}
                lastOne={lastOne}
                showLastOne={showLastOne}
              />
            )}
          </div>

          <div className="kuji-stage-actions">
            {!cardsReady ? null : !allRevealed ? (
              <button type="button" className="kuji-stage-btn is-ghost" onClick={revealAll}>
                모두 열기
              </button>
            ) : revealFinished ? (
              <button type="button" className="kuji-stage-btn" onClick={closeDraw}>
                확인
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
