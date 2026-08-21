'use client'

import Link from 'next/link'
import { TicketIcon, CalendarIcon, ConfettiIcon } from '@phosphor-icons/react'
import { getOngoingEntries, getPastEntries, getParticipationCount, getWinCount } from '@/lib/raffleEntries'

const statCard: React.CSSProperties = {
  flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '18px 20px', textAlign: 'center', boxShadow: 'var(--shadow-sm)',
}

const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '28px 0 14px' }

export default function RaffleEntriesPage() {
  const ongoing = getOngoingEntries()
  const past = getPastEntries()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '48px 16px 80px' }}>
      <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/mypage" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TicketIcon size={19} weight="fill" color="var(--accent)" /> 응모 내역
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={statCard}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{getParticipationCount()}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-tertiary)' }}>회</span></div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>총 참여 횟수</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>{getWinCount()}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-tertiary)' }}>회</span></div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>당첨 횟수</div>
          </div>
        </div>

        <div style={sectionTitle}>참여 중인 응모 ({ongoing.length})</div>
        {ongoing.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 13, background: 'var(--surface)', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
            참여 중인 응모가 없어요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ongoing.map(entry => (
              <Link key={entry.id} href={entry.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {entry.image ? <img src={entry.image} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (entry.emoji ?? '🎟')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> {entry.ticketCount}장 응모</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> {entry.date}</span>
                      {entry.timeText && <span style={{ color: 'var(--gold)' }}>{entry.timeText}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px solid var(--accent-tint-border)', borderRadius: 20, padding: '4px 12px', flexShrink: 0 }}>
                    대기 중
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={sectionTitle}>참여했던 응모 ({past.length})</div>
        {past.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 13, background: 'var(--surface)', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
            아직 결과가 나온 응모가 없어요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {past.map(entry => {
              const won = entry.status === 'won'
              return (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, filter: 'grayscale(1)', opacity: 0.7 }}>
                    {entry.image ? <img src={entry.image} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (entry.emoji ?? '🎟')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> {entry.ticketCount}장 응모</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CalendarIcon size={12} /> {entry.date}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px', flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: won ? 'var(--success)' : 'var(--text-tertiary)',
                    background: won ? 'var(--success-tint)' : 'var(--bg-subtle)',
                    border: `1px solid ${won ? 'var(--success-tint-border)' : 'var(--border)'}`,
                  }}>
                    {won && <ConfettiIcon size={12} weight="fill" />} {won ? '당첨' : '낙첨'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
