'use client'

import Link from 'next/link'

// TODO: 실제 API에서 포인트 및 내역 조회
const eungPoint = 12500
const ssalPoint = 3000
const totalPoint = eungPoint + ssalPoint

const HISTORY = [
  { type: 'deposit', label: '응포인트 충전', amount: 10000, date: '2026.06.20', point: '+10,000P' },
  { type: 'withdraw', label: '포인트 인출', amount: 5000, date: '2026.06.18', point: '-5,000P' },
  { type: 'deposit', label: '응포인트 충전', amount: 30000, date: '2026.06.15', point: '+30,000P' },
  { type: 'bonus', label: '쌀포인트 지급', amount: 3000, date: '2026.06.10', point: '+3,000P' },
  { type: 'withdraw', label: '포인트 인출', amount: 20000, date: '2026.06.05', point: '-20,000P' },
]

const typeColor: Record<string, string> = {
  deposit: '#22c55e',
  withdraw: '#ef4444',
  bonus: '#a78bfa',
}

export default function PointHubPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* 총 포인트 */}
        <div style={{ background: 'linear-gradient(135deg, #7c6aff22, #a78bfa11)', border: '1px solid #7c6aff44', borderRadius: 16, padding: '28px 24px', marginBottom: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>총 보유 포인트</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#e2e2e2', marginBottom: 16 }}>
            {totalPoint.toLocaleString()}<span style={{ fontSize: 20, fontWeight: 600, color: '#a78bfa', marginLeft: 4 }}>P</span>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            <div>
              <p style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>🎟 응포인트</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#e2e2e2' }}>{eungPoint.toLocaleString()}P</p>
            </div>
            <div style={{ width: 1, background: '#333' }} />
            <div>
              <p style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>🌾 쌀포인트</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#e2e2e2' }}>{ssalPoint.toLocaleString()}P</p>
            </div>
          </div>
        </div>

        {/* 충전 / 인출 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <Link
            href="/charge/withdraw"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '18px 0', borderRadius: 12, border: '1px solid #444',
              background: '#1a1a1a', textDecoration: 'none', color: '#ccc', transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 24 }}>💸</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>포인트 인출</span>
          </Link>
          <Link
            href="/charge/deposit"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '18px 0', borderRadius: 12, border: '1px solid #7c6aff88',
              background: 'linear-gradient(135deg, #7c6aff, #a78bfa)', textDecoration: 'none',
              color: '#fff', transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 24 }}>🎟</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>포인트 충전</span>
          </Link>
        </div>

        {/* 최근 내역 */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#ccc', marginBottom: 12 }}>최근 내역</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HISTORY.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e2e2', marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: '#666' }}>{item.date}</p>
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
