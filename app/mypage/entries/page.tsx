'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TicketIcon, CalendarIcon } from '@phosphor-icons/react'
import { useMyRaffleEntries } from '@/hooks/useMyRaffleEntries'
import { groupEntriesByProduct, type GroupedRaffleEntry } from '@/lib/raffle'
import { formatRelativeDate } from '@/lib/date'

const STATUS_LABEL: Record<'open' | 'completed' | 'cancelled', string> = {
  open: '진행중',
  completed: '종료',
  cancelled: '취소',
}

export default function RaffleEntriesPage() {
  const { entries } = useMyRaffleEntries()
  const grouped = groupEntriesByProduct(entries)
  const [resultItem, setResultItem] = useState<GroupedRaffleEntry | null>(null)
  const isWin = resultItem != null && resultItem.entryNumber === resultItem.winnerEntryNumber

  const ongoing = grouped.filter(e => e.status === 'open')
  const past = grouped.filter(e => e.status !== 'open')
  const participationCount = entries.filter(e => e.status !== 'cancelled').length

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
          {ongoing.map(item => (
            <Link key={item.raffle_product_id} href={`/eungmo/${item.raffle_product_id}`} className="entry-item">
              <div className="entry-emoji">
                {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : '🎟'}
              </div>
              <div className="entry-info">
                <div className="entry-title">{item.product_name}</div>
                <div className="entry-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> 총 {item.totalTicketCount}장 응모</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> 최근 {formatRelativeDate(item.lastEnteredAt)}</span>
                </div>
              </div>
              <div className="entry-status">
                <span className="status-badge waiting">대기 중</span>
              </div>
            </Link>
          ))}
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
              <div className="entry-emoji" style={{ filter: 'grayscale(1)', opacity: 0.7 }}>
                {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : '🎟'}
              </div>
              <div className="entry-info">
                <div className="entry-title" style={{ color: 'var(--text-tertiary)' }}>{item.product_name}</div>
                <div className="entry-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> 총 {item.totalTicketCount}장 응모</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> 최근 {formatRelativeDate(item.lastEnteredAt)}</span>
                </div>
              </div>
              <div className="entry-status">
                {item.status === 'completed' && item.drawVideoUrl ? (
                  <button className="btn-win-confirm" onClick={() => setResultItem(item)}>
                    당첨결과 확인하기
                  </button>
                ) : (
                  <span className={`status-badge ${item.status === 'cancelled' ? 'lose' : 'waiting'}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
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
              내 응모번호 #{resultItem.entryNumber} · 당첨번호 #{resultItem.winnerEntryNumber}
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
