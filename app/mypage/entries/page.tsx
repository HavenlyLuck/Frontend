'use client'

import Link from 'next/link'
import { TicketIcon, CalendarIcon, ConfettiIcon } from '@phosphor-icons/react'
import { getOngoingEntries, getPastEntries, getParticipationCount, getWinCount } from '@/lib/raffleEntries'

export default function RaffleEntriesPage() {
  const ongoing = getOngoingEntries()
  const past = getPastEntries()

  return (
    <>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><TicketIcon size={17} weight="fill" color="var(--accent)" /> 응모 내역</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <div className="summary-card" style={{ flex: 1, textAlign: 'center', cursor: 'default' }}>
          <div className="summary-value">{getParticipationCount()}<span>회</span></div>
          <div className="summary-label">총 참여 횟수</div>
        </div>
        <div className="summary-card" style={{ flex: 1, textAlign: 'center', cursor: 'default' }}>
          <div className="summary-value" style={{ color: 'var(--gold)' }}>{getWinCount()}<span>회</span></div>
          <div className="summary-label">당첨 횟수</div>
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>참여 중인 응모 ({ongoing.length})</div>
      {ongoing.length === 0 ? (
        <div className="coming-soon-box" style={{ marginBottom: 32 }}>
          <div className="desc">참여 중인 응모가 없어요.</div>
        </div>
      ) : (
        <div className="entry-list">
          {ongoing.map(entry => (
            <Link key={entry.id} href={entry.href} className="entry-item">
              <div className="entry-emoji">
                {entry.image ? <img src={entry.image} alt={entry.title} /> : (entry.emoji ?? '🎟')}
              </div>
              <div className="entry-info">
                <div className="entry-title">{entry.title}</div>
                <div className="entry-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> {entry.ticketCount}장 응모</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> {entry.date}</span>
                  {entry.timeText && <span className="meta-warning">{entry.timeText}</span>}
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
          <div className="desc">아직 결과가 나온 응모가 없어요.</div>
        </div>
      ) : (
        <div className="entry-list">
          {past.map(entry => {
            const won = entry.status === 'won'
            return (
              <div key={entry.id} className="entry-item" style={{ cursor: 'default' }}>
                <div className="entry-emoji" style={{ filter: 'grayscale(1)', opacity: 0.7 }}>
                  {entry.image ? <img src={entry.image} alt={entry.title} /> : (entry.emoji ?? '🎟')}
                </div>
                <div className="entry-info">
                  <div className="entry-title" style={{ color: 'var(--text-tertiary)' }}>{entry.title}</div>
                  <div className="entry-meta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> {entry.ticketCount}장 응모</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> {entry.date}</span>
                  </div>
                </div>
                <div className="entry-status">
                  <span className={`status-badge ${won ? 'win' : 'lose'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {won && <ConfettiIcon size={12} weight="fill" />} {won ? '당첨' : '낙첨'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
