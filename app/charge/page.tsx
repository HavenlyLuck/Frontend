'use client'

import Link from 'next/link'

const eungPoint = 12500
const ssalPoint = 3000
const totalPoint = eungPoint + ssalPoint

const HISTORY = [
  { type: 'deposit', label: '운포인트 충전', date: '2026.06.20', point: '+10,000P' },
  { type: 'withdraw', label: '포인트 인출', date: '2026.06.18', point: '-5,000P' },
  { type: 'deposit', label: '운포인트 충전', date: '2026.06.15', point: '+30,000P' },
  { type: 'bonus', label: '쌀포인트 지급', date: '2026.06.10', point: '+3,000P' },
  { type: 'withdraw', label: '포인트 인출', date: '2026.06.05', point: '-20,000P' },
]

const typeColor: Record<string, string> = {
  deposit: '#4ade80',
  withdraw: '#f87171',
  bonus: '#22d3ee',
}

export default function PointHubPage() {
  return (
    <div className="home-neon" style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* 총 포인트 */}
        <div style={{ background: 'linear-gradient(160deg, #150f2ee6, #0d0820e6)', border: '1px solid #7b5cff55', borderRadius: 16, padding: '28px 24px', marginBottom: 20, textAlign: 'center', boxShadow: '0 0 32px -8px #ff2fd04d' }}>
          <p style={{ fontSize: 13, color: '#9c97c9', marginBottom: 8 }}>총 보유 포인트</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#eafcff', marginBottom: 16, textShadow: '0 0 18px #22d3ee66' }}>
            {totalPoint.toLocaleString()}<span style={{ fontSize: 20, fontWeight: 600, color: '#9c97c9', marginLeft: 4 }}>P</span>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            <div>
              <p style={{ fontSize: 11, color: '#9c97c9', marginBottom: 2 }}>🎰 운포인트</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#ffe93d', textShadow: '0 0 10px #ffe93d55' }}>{eungPoint.toLocaleString()}P</p>
            </div>
            <div style={{ width: 1, background: '#3a2d66' }} />
            <div>
              <p style={{ fontSize: 11, color: '#9c97c9', marginBottom: 2 }}>🌾 쌀포인트</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#22d3ee', textShadow: '0 0 10px #22d3ee55' }}>{ssalPoint.toLocaleString()}P</p>
            </div>
          </div>
        </div>

        {/* 충전 / 인출 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <Link
            href="/charge/withdraw"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 0', borderRadius: 12, border: '1px solid #3a2d66', background: '#120b28', textDecoration: 'none', color: '#9c97c9', transition: 'all 0.15s' }}
          >
            <span style={{ fontSize: 24 }}>💸</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>포인트 인출</span>
          </Link>
          <Link
            href="/charge/deposit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 0', borderRadius: 12, border: '1px solid #7b5cff55', background: 'linear-gradient(135deg, #7b5cff, #22d3ee)', textDecoration: 'none', color: '#ffffff', transition: 'all 0.15s' }}
          >
            <span style={{ fontSize: 24 }}>🎟</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>포인트 충전</span>
          </Link>
        </div>

        {/* 최근 내역 */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#eafcff', marginBottom: 12 }}>최근 내역</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HISTORY.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#120b28', border: '1px solid #3a2d66', borderRadius: 10, padding: '14px 16px' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#eafcff', marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: '#6d67a0' }}>{item.date}</p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: typeColor[item.type] }}>{item.point}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
