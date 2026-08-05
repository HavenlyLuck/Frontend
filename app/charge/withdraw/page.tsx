'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BANKS = ['카카오뱅크', '토스뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행']

const darkInput: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 8, border: '1px solid #3a2d66',
  background: '#120b28', color: '#eafcff', fontSize: 14, outline: 'none', width: '100%',
}

export default function WithdrawPage() {
  const router = useRouter()
  const [amount, setAmount] = useState<number | ''>('')
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const eungPoint = 12500

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || amount < 1000) { alert('최소 인출 금액은 1,000P입니다.'); return }
    if (amount > eungPoint) { alert('보유 운포인트가 부족합니다.'); return }
    alert(`${amount.toLocaleString()}P 인출 신청이 완료되었습니다.`)
    router.push('/charge')
  }

  return (
    <div className="home-neon" style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/charge" style={{ color: '#9c97c9', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#eafcff' }}>💸 포인트 인출</h2>
        </div>

        <div style={{ background: 'linear-gradient(160deg, #150f2ee6, #0d0820e6)', border: '1px solid #7b5cff55', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: '#9c97c9', marginBottom: 4 }}>🎰 인출 가능 운포인트</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#ffe93d', textShadow: '0 0 10px #ffe93d55' }}>{eungPoint.toLocaleString()}P</p>
          <p style={{ fontSize: 11, color: '#6d67a0', marginTop: 4 }}>1P = 1원 / 쌀포인트는 인출 불가</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#eafcff' }}>인출 금액</p>
            <div style={{ position: 'relative' }}>
              <input type="number" placeholder="인출할 포인트 입력 (최소 1,000P)" value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                min={1000} max={eungPoint}
                style={{ ...darkInput, padding: '13px 40px 13px 14px', fontSize: 16, fontWeight: 600, boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#6d67a0', fontSize: 14 }}>P</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {[1000, 5000, 10000].map(v => (
                <button key={v} type="button" onClick={() => setAmount(v)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #3a2d66', background: '#120b28', color: '#9c97c9', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  {v.toLocaleString()}P
                </button>
              ))}
              <button type="button" onClick={() => setAmount(eungPoint)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #22d3ee55', background: '#22d3ee1a', color: '#22d3ee', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                전액
              </button>
            </div>
            {amount !== '' && (
              <p style={{ marginTop: 6, fontSize: 13, color: amount > eungPoint ? '#f87171' : '#22d3ee' }}>
                {amount > eungPoint ? '보유 포인트를 초과했습니다.' : `인출 후 잔여: ${(eungPoint - Number(amount)).toLocaleString()}P`}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#eafcff' }}>입금 계좌</p>
            <select value={bank} onChange={e => setBank(e.target.value)} required
              style={{ ...darkInput, color: bank ? '#eafcff' : '#6d67a0' }}>
              <option value="">은행 선택</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input type="text" placeholder="계좌번호 (- 없이 입력)" value={account}
              onChange={e => setAccount(e.target.value)} required style={darkInput} />
            <input type="text" placeholder="예금주명" value={holder}
              onChange={e => setHolder(e.target.value)} required style={darkInput} />
          </div>

          <button type="submit"
            style={{ padding: '14px', borderRadius: 10, background: 'linear-gradient(135deg, #7b5cff, #22d3ee)', color: '#ffffff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            {amount ? `${Number(amount).toLocaleString()}P 인출 신청` : '인출 신청'}
          </button>
        </form>
      </div>
    </div>
  )
}
