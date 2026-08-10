'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMyPoints } from '@/hooks/useMyPoints'

const BANKS = ['카카오뱅크', '토스뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행']

const lightInput: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e2e4',
  background: '#ffffff', color: '#181818', fontSize: 14, outline: 'none', width: '100%',
}

export default function WithdrawPage() {
  const router = useRouter()
  const [amount, setAmount] = useState<number | ''>('')
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const { eungPoint } = useMyPoints()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || amount < 1000) { alert('최소 인출 금액은 1,000P입니다.'); return }
    if (amount > eungPoint) { alert('보유 운포인트가 부족합니다.'); return }
    alert(`${amount.toLocaleString()}P 인출 신청이 완료되었습니다.`)
    router.push('/charge')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px', background: '#f5f6f7' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/charge" style={{ color: '#767676', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#181818' }}>💸 포인트 인출</h2>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #ececec', borderRadius: 12, padding: '16px 20px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 12, color: '#767676', marginBottom: 4 }}>🎰 인출 가능 운포인트</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#d9691d' }}>{eungPoint.toLocaleString()}P</p>
          <p style={{ fontSize: 11, color: '#9a9a9a', marginTop: 4 }}>1P = 1원 / 쌀포인트는 인출 불가</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#181818' }}>인출 금액</p>
            <div style={{ position: 'relative' }}>
              <input type="number" placeholder="인출할 포인트 입력 (최소 1,000P)" value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                min={1000} max={eungPoint}
                style={{ ...lightInput, padding: '13px 40px 13px 14px', fontSize: 16, fontWeight: 600, boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9a9a9a', fontSize: 14 }}>P</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {[1000, 5000, 10000].map(v => (
                <button key={v} type="button" onClick={() => setAmount(v)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e2e4', background: '#ffffff', color: '#454545', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  {v.toLocaleString()}P
                </button>
              ))}
              <button type="button" onClick={() => setAmount(eungPoint)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #4fa8e855', background: '#eaf6fd', color: '#1477b8', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                전액
              </button>
            </div>
            {amount !== '' && (
              <p style={{ marginTop: 6, fontSize: 13, color: amount > eungPoint ? '#e14d72' : '#4fa8e8' }}>
                {amount > eungPoint ? '보유 포인트를 초과했습니다.' : `인출 후 잔여: ${(eungPoint - Number(amount)).toLocaleString()}P`}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#181818' }}>입금 계좌</p>
            <select value={bank} onChange={e => setBank(e.target.value)} required
              style={{ ...lightInput, color: bank ? '#181818' : '#9a9a9a' }}>
              <option value="">은행 선택</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input type="text" placeholder="계좌번호 (- 없이 입력)" value={account}
              onChange={e => setAccount(e.target.value)} required style={lightInput} />
            <input type="text" placeholder="예금주명" value={holder}
              onChange={e => setHolder(e.target.value)} required style={lightInput} />
          </div>

          <button type="submit"
            style={{ padding: '14px', borderRadius: 10, background: '#181818', color: '#ffffff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            {amount ? `${Number(amount).toLocaleString()}P 인출 신청` : '인출 신청'}
          </button>
        </form>
      </div>
    </div>
  )
}
