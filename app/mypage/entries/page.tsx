'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TicketIcon, CalendarIcon } from '@phosphor-icons/react'
import { useRaffleEntryPhases, type PhasedRaffleEntry } from '@/hooks/useRaffleEntryPhases'
import { isOngoingPhase, isWinningEntry } from '@/lib/raffle'
import { formatRelativeDate } from '@/lib/date'

// 매진 후 추첨까지 남은 시간 — 0이 됐는데 아직 결과가 없으면(폴링 전) 기다림 문구로 바뀐다
function DrawCountdown({ drawAt }: { drawAt: number | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (drawAt == null) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [drawAt])

  const left = drawAt == null ? 0 : Math.max(0, Math.ceil((drawAt - now) / 1000))
  if (left === 0) return <span style={{ color: 'var(--gold)' }}>응모 마감 · 추첨 결과를 기다리는 중이에요</span>
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  return (
    <span style={{ color: 'var(--gold)' }}>
      응모 마감 · 추첨까지 <b className="draw-countdown">{mm}:{ss}</b>
    </span>
  )
}

export default function RaffleEntriesPage() {
  const { items, entries, checkResult } = useRaffleEntryPhases()
  const [resultItem, setResultItem] = useState<PhasedRaffleEntry | null>(null)
  const isWin = resultItem != null && isWinningEntry(resultItem)

  const ongoing = items.filter(e => isOngoingPhase(e.phase))
  const past = items.filter(e => !isOngoingPhase(e.phase))
  const participationCount = entries.filter(e => e.status !== 'cancelled').length

  // 결과를 여는 순간 "확인함"으로 기록 → 모달을 닫으면 참여했던 응모로 내려가 있다
  function openResult(item: PhasedRaffleEntry) {
    setResultItem(item)
    checkResult(item.raffle_product_id)
  }

  return (
    <>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><TicketIcon size={17} weight="fill" color="var(--accent)" /> 응모 내역</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <div className="summary-card" style={{ flex: 1, textAlign: 'center', cursor: 'default' }}>
          <div className="summary-value">{participationCount}<span>회</span></div>
          <div className="summary-label">총 참여 횟수</div>
        </div>
        <div className="summary-card" style={{ flex: 1, textAlign: 'center', cursor: 'default' }}>
          <div className="summary-value" style={{ color: 'var(--gold)' }}>{ongoing.length}<span>건</span></div>
          <div className="summary-label">진행중인 응모</div>
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>참여 중인 응모 ({ongoing.length})</div>
      {ongoing.length === 0 ? (
        <div className="coming-soon-box" style={{ marginBottom: 32 }}>
          <div className="desc">참여 중인 응모가 없어요.</div>
        </div>
      ) : (
        <div className="entry-list" style={{ marginBottom: 32 }}>
          {ongoing.map(item => {
            const body = (
              <>
                <div className="entry-emoji">
                  {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : '🎟'}
                </div>
                <div className="entry-info">
                  <div className="entry-title">{item.product_name}</div>
                  <div className="entry-meta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> 총 {item.totalTicketCount}장 응모</span>
                    {item.phase === 'drawPending' ? (
                      <DrawCountdown drawAt={item.drawAt} />
                    ) : item.phase === 'resultReady' ? (
                      <span style={{ color: 'var(--gold)' }}>추첨이 끝났어요</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> 최근 {formatRelativeDate(item.lastEnteredAt)}</span>
                    )}
                  </div>
                </div>
                <div className="entry-status">
                  {item.phase === 'resultReady' ? (
                    <button className="btn-win-confirm" onClick={() => openResult(item)}>당첨결과 확인하기</button>
                  ) : item.phase === 'drawPending' ? (
                    <span className="status-badge ongoing">추첨 대기 중</span>
                  ) : (
                    <span className="status-badge waiting">대기 중</span>
                  )}
                </div>
              </>
            )
            // 응모권이 남아 있을 때만 상세 페이지로 이동 (매진 이후엔 상세 진입을 막는다)
            return item.phase === 'waiting' ? (
              <Link key={item.raffle_product_id} href={`/eungmo/${item.raffle_product_id}`} className="entry-item">{body}</Link>
            ) : (
              <div key={item.raffle_product_id} className="entry-item" style={{ cursor: 'default' }}>{body}</div>
            )
          })}
        </div>
      )}

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>참여했던 응모 ({past.length})</div>
      {past.length === 0 ? (
        <div className="coming-soon-box">
          <div className="desc">아직 종료된 응모가 없어요.</div>
        </div>
      ) : (
        <div className="entry-list">
          {past.map(item => (
            <div key={item.raffle_product_id} className="entry-item" style={{ cursor: 'default' }}>
              <div className="entry-emoji" style={item.phase === 'won' ? undefined : { filter: 'grayscale(1)', opacity: 0.7 }}>
                {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : '🎟'}
              </div>
              <div className="entry-info">
                <div className="entry-title" style={item.phase === 'won' ? undefined : { color: 'var(--text-tertiary)' }}>{item.product_name}</div>
                <div className="entry-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> 총 {item.totalTicketCount}장 응모</span>
                  {item.phase === 'failed' ? (
                    <span>시간 내에 응모권이 다 팔리지 않았어요</span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> 최근 {formatRelativeDate(item.lastEnteredAt)}</span>
                  )}
                </div>
              </div>
              <div className="entry-status">
                {item.phase === 'won' ? (
                  <span className="status-badge win">당첨</span>
                ) : item.phase === 'lost' ? (
                  <span className="status-badge lose">낙첨</span>
                ) : (
                  <span className="status-badge lose">응모실패</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`win-overlay ${resultItem ? 'open' : ''}`} onClick={() => setResultItem(null)}>
        {resultItem && (
          <div className="win-modal" onClick={e => e.stopPropagation()}>
            <span className="win-icon">{isWin ? '🎉' : '💔'}</span>
            <div className="win-title" style={!isWin ? { color: 'var(--text-tertiary)' } : undefined}>
              {isWin ? '당첨을 축하드려요!' : '아쉽게도 낙첨되었어요'}
            </div>
            <div className="win-product">
              {resultItem.product_name}
              <br />
              내 응모번호 #{resultItem.entryNumbers.join(', #')} · 당첨번호 #{resultItem.winnerEntryNumber}
            </div>
            {resultItem.drawVideoUrl && (
              <video
                src={resultItem.drawVideoUrl}
                controls
                style={{ width: '100%', borderRadius: 12, marginBottom: 20, background: '#000' }}
              />
            )}
            <button className="win-close" onClick={() => setResultItem(null)}>닫기</button>
          </div>
        )}
      </div>
    </>
  )
}
