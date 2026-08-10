'use client'

import { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getKujiProduct,
  getRemainingTickets,
  getTierRemaining,
  drawKujiTickets,
  type KujiTicket,
} from '@/lib/kujiData'
import { addStorageItem } from '@/lib/storage'

type DrawResult = ReturnType<typeof drawKujiTickets>

export default function KujiProductPage({ params }: { params: { id: string } }) {
  const product = getKujiProduct(params.id)
  if (!product) notFound()

  const [, bump] = useState(0)
  const rerender = () => bump(n => n + 1)

  const [qty, setQty] = useState(1)
  const [drawOpen, setDrawOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [results, setResults] = useState<DrawResult | null>(null)

  const remaining = getRemainingTickets(product)
  const topTiers = product.tiers.filter(t => t.isTop)
  const lowerTiers = product.tiers.filter(t => !t.isTop)
  const maxQty = Math.max(1, Math.min(10, remaining))

  const changeQty = (delta: number) =>
    setQty(prev => Math.min(maxQty, Math.max(1, prev + delta)))

  const openDraw = () => {
    setSelected([])
    setResults(null)
    setDrawOpen(true)
  }

  const closeDraw = () => setDrawOpen(false)

  const toggleTicket = (ticket: KujiTicket) => {
    if (ticket.status !== 'available') return
    setSelected(prev => {
      if (prev.includes(ticket.id)) return prev.filter(id => id !== ticket.id)
      if (prev.length >= qty) return prev
      return [...prev, ticket.id]
    })
  }

  const confirmDraw = () => {
    const drawn = drawKujiTickets(product.id, selected)
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
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.65), rgba(0,0,0,0.05))' }} />
          <div style={{ position: 'absolute', left: 20, bottom: 16, color: '#fff' }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: '#ff6b35', padding: '4px 10px', borderRadius: 20 }}>🎁 쿠지 진행 중</span>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{product.title}</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#767676', marginBottom: 20 }}>{product.description}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', background: '#f7f8fa', border: '1px solid #ececec', borderRadius: 12, padding: '16px 18px', marginBottom: 28 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#454545', marginBottom: 6 }}>
              <span>남은 제비</span>
              <span style={{ fontWeight: 700, color: '#181818' }}>{remaining} / {product.totalTickets}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#e2e2e4', overflow: 'hidden' }}>
              <div style={{ width: `${(remaining / product.totalTickets) * 100}%`, height: '100%', background: '#4fa8e8', transition: 'width 0.2s' }} />
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#181818' }}>
            {product.pricePerTicket.toLocaleString()} 운포인트 <span style={{ fontSize: 12, fontWeight: 400, color: '#9a9a9a' }}>/ 1장</span>
          </div>
        </div>

        <div className="section-title" style={{ marginBottom: 14 }}>상위상</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {topTiers.map(tier => {
            const tierRemaining = getTierRemaining(product, tier.grade)
            const soldOut = tierRemaining === 0
            return (
              <div key={tier.grade} style={{ border: '1px solid #ececec', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#f5f6f7' }}>
                  <img src={tier.image ?? undefined} alt={tier.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: soldOut ? 'blur(2px) brightness(0.5)' : undefined }} />
                  {soldOut && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 2, padding: '5px 12px', borderRadius: 6, border: '2px solid #ffffff66', background: 'rgba(0,0,0,0.55)' }}>SOLD OUT</span>
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: 8, left: 8, background: '#181818', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>{tier.grade}상</span>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181818', marginBottom: 4 }}>{tier.title}</div>
                  <div style={{ fontSize: 12, color: soldOut ? '#c8c8c8' : '#767676' }}>
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
            <div key={tier.grade} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e2e4', borderRadius: 20, padding: '8px 14px', fontSize: 12, color: '#454545', background: '#fafafa' }}>
              <span style={{ fontWeight: 700, color: '#181818' }}>{tier.grade}상</span>
              <span>{tier.title}</span>
              <span style={{ color: '#9a9a9a' }}>· {tier.count}개</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'sticky', bottom: 16, background: '#fff', border: '1px solid #ececec', borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#181818', marginBottom: 8 }}>뽑을 개수</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #e2e2e4', borderRadius: 10, padding: '8px 16px', width: 'fit-content' }}>
                <button onClick={() => changeQty(-1)} disabled={remaining === 0} style={{ width: 28, height: 28, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#454545' }}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => changeQty(1)} disabled={remaining === 0} style={{ width: 28, height: 28, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#454545' }}>+</button>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#9a9a9a', marginBottom: 8 }}>
                총 {(product.pricePerTicket * qty).toLocaleString()} 운포인트 (최대 {maxQty}장)
              </div>
              <button
                onClick={openDraw}
                disabled={remaining === 0}
                style={{
                  padding: '14px 28px', borderRadius: 12, border: 'none',
                  background: remaining === 0 ? '#e2e2e4' : '#181818',
                  color: remaining === 0 ? '#9a9a9a' : '#fff',
                  fontSize: 15, fontWeight: 700, cursor: remaining === 0 ? 'default' : 'pointer',
                }}
              >
                {remaining === 0 ? '품절되었습니다' : '🎟 뽑기 시작'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {drawOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #ececec' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181818' }}>
                {results ? '🎉 뽑기 결과' : `제비를 선택해주세요 (${selected.length}/${qty})`}
              </div>
              <button onClick={closeDraw} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#9a9a9a' }}>×</button>
            </div>

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
                          border: isSelected ? '2px solid #4fa8e8' : '1px solid transparent',
                          background: isDrawn ? '#2b2b33' : '#ff8a3d',
                          color: isDrawn ? '#c9c9d1' : '#ffffff',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          cursor: isDrawn ? 'default' : 'pointer',
                          fontSize: 10, fontWeight: 700, gap: 2, padding: 2,
                          opacity: isDrawn ? 0.85 : 1,
                          boxShadow: isSelected ? '0 0 0 2px #4fa8e855' : undefined,
                          transition: 'all 0.12s',
                        }}
                      >
                        {isDrawn ? (
                          <>
                            <span style={{ fontSize: 12 }}>🔒</span>
                            <span>{ticket.grade}상</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 14 }}>{isSelected ? '✔️' : '🎁'}</span>
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
                    <div key={r.ticketId} style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #ececec', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f5f6f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                        {r.tier.image ? <img src={r.tier.image} alt={r.tier.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎁'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#d9691d' }}>#{r.ticketId} · {r.grade}상</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#181818' }}>{r.tier.title}</div>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: '#9a9a9a', marginTop: 4 }}>당첨된 상품은 보관함에서 확인하고 택배로 받으실 수 있어요.</p>
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #ececec' }}>
              {!results ? (
                <button
                  onClick={confirmDraw}
                  disabled={selected.length !== qty}
                  style={{
                    width: '100%', padding: 14, borderRadius: 12, border: 'none',
                    background: selected.length === qty ? '#181818' : '#e2e2e4',
                    color: selected.length === qty ? '#fff' : '#9a9a9a',
                    fontSize: 15, fontWeight: 700, cursor: selected.length === qty ? 'pointer' : 'default',
                  }}
                >
                  선택 완료 ({selected.length}/{qty})
                </button>
              ) : (
                <button
                  onClick={closeDraw}
                  style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#181818', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
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
