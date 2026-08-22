'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import {
  CheckIcon,
  ConfettiIcon,
  GiftIcon,
  HeartIcon,
  LockIcon,
  TicketIcon,
} from '@phosphor-icons/react'
import {
  getKujiProduct,
  getRemainingTickets,
  getTierRemaining,
  drawKujiTickets,
  type KujiTicket,
} from '@/lib/kujiData'
import { addStorageItem } from '@/lib/storage'
import { isWished, toggleWishlist } from '@/lib/wishlist'
import { isLoggedIn } from '@/lib/auth'

type DrawResult = ReturnType<typeof drawKujiTickets>['drawn']

export default function KujiProductPage({ params }: { params: { id: string } }) {
  const product = getKujiProduct(params.id)
  if (!product) notFound()

  const router = useRouter()
  useEffect(() => {
    if (!isLoggedIn()) {
      alert('로그인 후 이용해주세요.')
      router.replace('/login')
    }
  }, [router])

  const wishId = `kuji-${product.id}`
  const [, bump] = useState(0)
  const rerender = () => bump(n => n + 1)

  const [qty, setQty] = useState(1)
  const [isLiked, setIsLiked] = useState(() => isWished(wishId))
  const [drawOpen, setDrawOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [results, setResults] = useState<DrawResult | null>(null)
  const [conflictIds, setConflictIds] = useState<number[]>([])

  const remaining = getRemainingTickets(product)
  const topTiers = product.tiers.filter(t => t.isTop)
  const lowerTiers = product.tiers.filter(t => !t.isTop)
  const maxQty = Math.max(1, Math.min(10, remaining))

  const changeQty = (delta: number) =>
    setQty(prev => Math.min(maxQty, Math.max(1, prev + delta)))

  const openDraw = () => {
    setSelected([])
    setResults(null)
    setConflictIds([])
    setDrawOpen(true)
  }

  const closeDraw = () => setDrawOpen(false)

  const toggleTicket = (ticket: KujiTicket) => {
    if (ticket.status !== 'available') return
    setConflictIds([])
    setSelected(prev => {
      if (prev.includes(ticket.id)) return prev.filter(id => id !== ticket.id)
      if (prev.length >= qty) return prev
      return [...prev, ticket.id]
    })
  }

  const confirmDraw = () => {
    const { drawn, unavailableIds } = drawKujiTickets(product.id, selected)

    if (unavailableIds.length > 0) {
      // 확정 직전에 다른 사람이 먼저 가져간 제비 — 그 제비만 선택 해제하고
      // 나머지 선택은 그대로 둔 채 다시 고르게 한다 (부분 뽑기는 하지 않음)
      setSelected(prev => prev.filter(id => !unavailableIds.includes(id)))
      setConflictIds(unavailableIds)
      rerender()
      return
    }

    setConflictIds([])
    drawn.forEach(r => {
      addStorageItem({
        id: `kuji-${product.id}-${r.ticketId}-${Date.now()}`,
        img: r.tier.image,
        emoji: r.tier.image ? undefined : '🎁',
        title: `[${r.grade}상] ${r.tier.title}`,
        source: '당첨',
        date: new Date().toISOString().slice(0, 10),
        value: `쿠지 ${r.grade}상`,
        status: 'ready',
      })
    })
    setResults(drawn)
    setSelected([])
    setQty(prev => Math.max(1, Math.min(prev, getRemainingTickets(product) || 1)))
    rerender()
  }

  return (
    <div>
      <div className="container">
        <div className="breadcrumb">
          <span><Link href="/">홈</Link></span>
          <span><Link href="/kuji">쿠지</Link></span>
          <span>{product.title}</span>
        </div>

        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20, position: 'relative', height: 220 }}>
          <img src={product.banner} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.75), rgba(0,0,0,0.1))' }} />
          <div style={{ position: 'absolute', left: 20, bottom: 16, color: '#fff' }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(22, 24, 29, 0.72)', padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <GiftIcon size={12} weight="fill" color="var(--gold)" /> 쿠지 진행 중
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{product.title}</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{product.description}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', marginBottom: 28 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>남은 제비</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{remaining} / {product.totalTickets}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${(remaining / product.totalTickets) * 100}%`, height: '100%', background: 'var(--warn)', transition: 'width 0.2s' }} />
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
            {product.pricePerTicket.toLocaleString()} 운포인트 <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>/ 1장</span>
          </div>
        </div>

        <div className="section-title" style={{ marginBottom: 14 }}>상위상</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {topTiers.map(tier => {
            const tierRemaining = getTierRemaining(product, tier.grade)
            const soldOut = tierRemaining === 0
            return (
              <div key={tier.grade} style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--bg-subtle)' }}>
                  <img src={tier.image ?? undefined} alt={tier.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: soldOut ? 'blur(2px) brightness(0.5)' : undefined }} />
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
                    {soldOut ? '모두 소진되었습니다' : `${tierRemaining} / ${tier.count}개 남음`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="section-title" style={{ marginBottom: 14 }}>하위상</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {lowerTiers.map(tier => (
            <div key={tier.grade} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-subtle)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{tier.grade}상</span>
              <span>{tier.title}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>· {tier.count}개</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'sticky', bottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>뽑을 개수</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 16px', width: 'fit-content' }}>
                <button onClick={() => changeQty(-1)} disabled={remaining === 0} style={{ width: 28, height: 28, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center', color: 'var(--text)' }}>{qty}</span>
                <button onClick={() => changeQty(1)} disabled={remaining === 0} style={{ width: 28, height: 28, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}>+</button>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                총 {(product.pricePerTicket * qty).toLocaleString()} 운포인트 (최대 {maxQty}장)
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className={`btn-wish ${isLiked ? 'liked' : ''}`}
                  onClick={() => setIsLiked(toggleWishlist({
                    id: wishId,
                    href: `/kuji/${product.id}`,
                    title: product.title,
                    image: product.banner,
                    subtitle: `${product.pricePerTicket.toLocaleString()} 운포인트 / 1장`,
                  }))}
                >
                  <HeartIcon size={19} weight={isLiked ? 'fill' : 'regular'} color={isLiked ? 'var(--danger)' : 'var(--text-tertiary)'} />
                </button>
                <button
                  onClick={openDraw}
                  disabled={remaining === 0}
                  style={{
                    padding: '14px 28px', borderRadius: 12, border: 'none',
                    background: remaining === 0 ? 'var(--border)' : 'var(--accent)',
                    color: remaining === 0 ? 'var(--text-tertiary)' : '#ffffff',
                    fontSize: 15, fontWeight: 700, cursor: remaining === 0 ? 'default' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {remaining === 0 ? '품절되었습니다' : <><TicketIcon size={16} weight="fill" /> 뽑기 시작</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {drawOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {results ? <><ConfettiIcon size={18} weight="fill" color="var(--gold)" /> 뽑기 결과</> : `제비를 선택해주세요 (${selected.length}/${qty})`}
              </div>
              <button onClick={closeDraw} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-tertiary)' }}>×</button>
            </div>

            {conflictIds.length > 0 && !results && (
              <div style={{ margin: '14px 20px 0', padding: '10px 14px', borderRadius: 10, background: 'var(--danger-tint)', border: '1px solid var(--danger-tint-border)', color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
                제비 {conflictIds.map(id => `#${id}`).join(', ')}은(는) 방금 다른 분이 먼저 선택하셔서 해제됐어요. 나머지 선택은 그대로 남아있으니 빈 자리만 다시 골라주세요.
              </div>
            )}

            <div className="kuji-draw-modal-body" style={{ padding: 20, overflowY: 'auto' }}>
              {!results ? (
                <div className="kuji-ticket-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
                  {product.tickets.map(ticket => {
                    const isSelected = selected.includes(ticket.id)
                    const isDrawn = ticket.status === 'drawn'
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => toggleTicket(ticket)}
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
                            <span>{ticket.grade}상</span>
                          </>
                        ) : (
                          <>
                            {isSelected ? <CheckIcon size={14} weight="bold" /> : <GiftIcon size={14} weight="fill" />}
                            <span style={{ opacity: 0.85 }}>#{ticket.id}</span>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.map(r => (
                    <div key={r.ticketId} style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', background: 'var(--surface)' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                        {r.tier.image ? <img src={r.tier.image} alt={r.tier.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <GiftIcon size={24} weight="fill" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>#{r.ticketId} · {r.grade}상</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{r.tier.title}</div>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>당첨된 상품은 보관함에서 확인하고 택배로 받으실 수 있어요.</p>
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
              {!results ? (
                <button
                  onClick={confirmDraw}
                  disabled={selected.length !== qty}
                  style={{
                    width: '100%', padding: 14, borderRadius: 12, border: 'none',
                    background: selected.length === qty ? 'var(--accent)' : 'var(--border)',
                    color: selected.length === qty ? '#ffffff' : 'var(--text-tertiary)',
                    fontSize: 15, fontWeight: 700, cursor: selected.length === qty ? 'pointer' : 'default',
                  }}
                >
                  선택 완료 ({selected.length}/{qty})
                </button>
              ) : (
                <button
                  onClick={closeDraw}
                  style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#ffffff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
