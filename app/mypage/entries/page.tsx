'use client'

import Link from 'next/link'
import { getOngoingEntries, getPastEntries, getParticipationCount, getWinCount } from '@/lib/raffleEntries'

const statCard: React.CSSProperties = {
  flex: 1, background: '#ffffff', border: '1px solid #ececec', borderRadius: 14,
  padding: '18px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#181818', margin: '28px 0 14px' }

export default function RaffleEntriesPage() {
  const ongoing = getOngoingEntries()
  const past = getPastEntries()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f7', padding: '48px 16px 80px' }}>
      <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/mypage" style={{ color: '#767676', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#181818' }}>🎟 응모 내역</h2>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={statCard}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#181818' }}>{getParticipationCount()}<span style={{ fontSize: 13, fontWeight: 400, color: '#9a9a9a' }}>회</span></div>
            <div style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>총 참여 횟수</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1477b8' }}>{getWinCount()}<span style={{ fontSize: 13, fontWeight: 400, color: '#9a9a9a' }}>회</span></div>
            <div style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>당첨 횟수</div>
          </div>
        </div>

        <div style={sectionTitle}>참여 중인 응모 ({ongoing.length})</div>
        {ongoing.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9a9a9a', fontSize: 13, background: '#fff', border: '1px dashed #e2e2e4', borderRadius: 12 }}>
            참여 중인 응모가 없어요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ongoing.map(entry => (
              <Link key={entry.id} href={entry.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #ececec', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f5f6f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {entry.image ? <img src={entry.image} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (entry.emoji ?? '🎟')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#181818', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: '#9a9a9a' }}>
                      <span>🎟 {entry.ticketCount}장 응모</span>
                      <span>📅 {entry.date}</span>
                      {entry.timeText && <span style={{ color: '#d9691d' }}>{entry.timeText}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1477b8', background: '#eaf6fd', border: '1px solid #bfe3fb', borderRadius: 20, padding: '4px 12px', flexShrink: 0 }}>
                    대기 중
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={sectionTitle}>참여했던 응모 ({past.length})</div>
        {past.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9a9a9a', fontSize: 13, background: '#fff', border: '1px dashed #e2e2e4', borderRadius: 12 }}>
            아직 결과가 나온 응모가 없어요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {past.map(entry => {
              const won = entry.status === 'won'
              return (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f7f7f8', border: '1px solid #ececec', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#eaeaec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, filter: 'grayscale(1)', opacity: 0.7 }}>
                    {entry.image ? <img src={entry.image} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (entry.emoji ?? '🎟')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#9a9a9a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: '#b0b0b3' }}>
                      <span>🎟 {entry.ticketCount}장 응모</span>
                      <span>📅 {entry.date}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px', flexShrink: 0,
                    color: won ? '#16a34a' : '#9a9a9a',
                    background: won ? '#eafbf1' : '#ececed',
                    border: `1px solid ${won ? '#b8ecd0' : '#e2e2e4'}`,
                  }}>
                    {won ? '🎉 당첨' : '낙첨'}
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
