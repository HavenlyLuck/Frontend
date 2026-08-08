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
  deposit: '#16a34a',
  withdraw: '#dc2626',
  bonus: '#4fa8e8',
}

export default function PointHubPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px', background: '#f5f6f7' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* 총 포인트 */}
        <div style={{ background: '#ffffff', border: '1px solid #ececec', borderRadius: 16, padding: '28px 24px', marginBottom: 20, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 13, color: '#767676', marginBottom: 8 }}>총 보유 포인트</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#181818', marginBottom: 16 }}>
            {totalPoint.toLocaleString()}<span style={{ fontSize: 20, fontWeight: 600, color: '#9a9a9a', marginLeft: 4 }}>P</span>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            <div>
              <p style={{ fontSize: 11, color: '#767676', marginBottom: 2 }}>🎰 운포인트</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#d9691d' }}>{eungPoint.toLocaleString()}P</p>
            </div>
            <div style={{ width: 1, background: '#ececec' }} />
            <div>
              <p style={{ fontSize: 11, color: '#767676', marginBottom: 2 }}>🌾 쌀포인트</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#4fa8e8' }}>{ssalPoint.toLocaleString()}P</p>
            </div>
          </div>
        </div>

        {/* 충전 / 인출 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <Link
            href="/charge/withdraw"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 0', borderRadius: 12, border: '1px solid #e2e2e4', background: '#ffffff', textDecoration: 'none', color: '#454545', transition: 'all 0.15s' }}
          >
            <span style={{ fontSize: 24 }}>💸</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>포인트 인출</span>
          </Link>
          <Link
            href="/charge/deposit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 0', borderRadius: 12, border: 'none', background: '#181818', textDecoration: 'none', color: '#ffffff', transition: 'all 0.15s' }}
          >
            <span style={{ fontSize: 24 }}>🎟</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>포인트 충전</span>
          </Link>
        </div>

        {/* 최근 내역 */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#181818', marginBottom: 12 }}>최근 내역</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HISTORY.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #ececec', borderRadius: 10, padding: '14px 16px' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#181818', marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: '#9a9a9a' }}>{item.date}</p>
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
