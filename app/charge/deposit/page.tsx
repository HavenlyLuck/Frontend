'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, BankIcon, CreditCardIcon } from '@phosphor-icons/react'
import { useMyPoints } from '@/hooks/useMyPoints'

const PRESET_AMOUNTS = [5000, 10000, 30000, 50000, 100000]

const PAYMENT_METHODS = [
  { id: 'card', label: '신용/체크카드', icon: 'card' as const },
  { id: 'kakao', label: '카카오페이', dot: '#fee500' },
  { id: 'naver', label: '네이버페이', dot: '#03c75a' },
  { id: 'bank', label: '무통장 입금', icon: 'bank' as const },
]

export default function DepositPage() {
  const router = useRouter()
  const [amount, setAmount] = useState<number | ''>('')
  const [method, setMethod] = useState('card')
  const { eungPoint } = useMyPoints()

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
    <div className="wallet-container">
      <div className="wallet-head">
        <Link href="/charge" className="wallet-back" aria-label="충전/인출로 돌아가기">
          <ArrowLeftIcon size={20} />
        </Link>
        <h2 className="wallet-title">🎰 운포인트 충전</h2>
      </div>

      <div className="wallet-summary-card">
        <p className="wallet-summary-label">🎰 현재 운포인트</p>
        <p className="wallet-summary-value">{eungPoint.toLocaleString()}P</p>
      </div>

      <form onSubmit={handleSubmit} className="wallet-form">
        <div>
          <p className="wallet-field-title">충전 금액</p>
          <div className="chip-row">
            {PRESET_AMOUNTS.map(v => (
              <button key={v} type="button" className="chip-btn" onClick={() => handlePreset(v)}>
                +{v.toLocaleString()}원
              </button>
            ))}
            <button type="button" className="chip-btn ghost" onClick={() => setAmount('')}>
              초기화
            </button>
          </div>
          <div className="wallet-input-wrap" style={{ marginTop: 12 }}>
            <input
              id="deposit-amount"
              type="number"
              placeholder="직접 입력 (최소 1,000원)"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              min={1000}
              className="field-input"
            />
            <span className="wallet-input-suffix">원</span>
          </div>
          {amount !== '' && (
            <p className="wallet-hint ok">
              충전 후 운포인트: {(eungPoint + Number(amount)).toLocaleString()}P
            </p>
          )}
        </div>

        <div>
          <p className="wallet-field-title">결제 수단</p>
          <div className="pay-method-list">
            {PAYMENT_METHODS.map(m => (
              <label key={m.id} className={`pay-method-option${method === m.id ? ' selected' : ''}`}>
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                <span className="pay-method-label">
                  {m.icon === 'card' && <CreditCardIcon size={16} />}
                  {m.icon === 'bank' && <BankIcon size={16} />}
                  {m.dot && <span className="pay-method-dot" style={{ background: m.dot }} />}
                  {m.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="auth-submit">
          {amount ? `${Number(amount).toLocaleString()}원 충전하기` : '충전하기'}
        </button>
      </form>
    </div>
  )
}
