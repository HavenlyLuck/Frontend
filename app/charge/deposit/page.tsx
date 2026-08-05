'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PRESET_AMOUNTS = [5000, 10000, 30000, 50000, 100000]

const PAYMENT_METHODS = [
  { id: 'card', label: '💳 신용/체크카드' },
  { id: 'kakao', label: '🟡 카카오페이' },
  { id: 'naver', label: '🟢 네이버페이' },
  { id: 'bank', label: '🏦 무통장 입금' },
]

const darkInput: React.CSSProperties = {
  width: '100%', padding: '13px 50px 13px 14px', borderRadius: 8,
  border: '1px solid #3a2d66', background: '#120b28', color: '#eafcff',
  fontSize: 16, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
}

export default function DepositPage() {
  const router = useRouter()
  const [amount, setAmount] = useState<number | ''>('')
  const [method, setMethod] = useState('card')
  const eungPoint = 12500

  function handlePreset(val: number) {
    setAmount(prev => (typeof prev === 'number' ? prev + val : val))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || amount < 1000) { alert('최소 충전 금액은 1,000원입니다.'); return }
    alert(`${amount.toLocaleString()}원 충전이 완료되었습니다.`)
    router.push('/charge')
  }

  return (
    <div className="home-neon" style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/charge" style={{ color: '#9c97c9', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#eafcff' }}>🎰 운포인트 충전</h2>
        </div>

        <div style={{ background: 'linear-gradient(160deg, #150f2ee6, #0d0820e6)', border: '1px solid #7b5cff55', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: '#9c97c9', marginBottom: 4 }}>🎰 현재 운포인트</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#ffe93d', textShadow: '0 0 10px #ffe93d55' }}>{eungPoint.toLocaleString()}P</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#eafcff' }}>충전 금액</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {PRESET_AMOUNTS.map(v => (
                <button key={v} type="button" onClick={() => handlePreset(v)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #3a2d66', background: '#120b28', color: '#9c97c9', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  +{v.toLocaleString()}원
                </button>
              ))}
              <button type="button" onClick={() => setAmount('')}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #3a2d66', background: '#120b28', color: '#6d67a0', fontSize: 13, cursor: 'pointer' }}>
                초기화
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input type="number" placeholder="직접 입력 (최소 1,000원)" value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                min={1000} style={darkInput} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#6d67a0', fontSize: 14 }}>원</span>
            </div>
            {amount !== '' && (
              <p style={{ marginTop: 6, fontSize: 13, color: '#22d3ee' }}>
                충전 후 운포인트: {(eungPoint + Number(amount)).toLocaleString()}P
              </p>
            )}
          </div>

          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#eafcff' }}>결제 수단</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAYMENT_METHODS.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: `1px solid ${method === m.id ? '#22d3ee88' : '#3a2d66'}`, background: method === m.id ? '#22d3ee1a' : '#120b28', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} style={{ accentColor: '#22d3ee' }} />
                  <span style={{ fontSize: 14, color: method === m.id ? '#eafcff' : '#9c97c9' }}>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit"
            style={{ padding: '14px', borderRadius: 10, background: 'linear-gradient(135deg, #7b5cff, #22d3ee)', color: '#ffffff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            {amount ? `${Number(amount).toLocaleString()}원 충전하기` : '충전하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
