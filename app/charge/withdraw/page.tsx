'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowCircleDownIcon, ArrowLeftIcon } from '@phosphor-icons/react'
import { useMyPoints } from '@/hooks/useMyPoints'

const BANKS = ['카카오뱅크', '토스뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행']

export default function WithdrawPage() {
  const router = useRouter()
  const [amount, setAmount] = useState<number | ''>('')
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const { eungPoint } = useMyPoints()

  const overLimit = amount !== '' && amount > eungPoint

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || amount < 1000) { alert('최소 인출 금액은 1,000P입니다.'); return }
    if (amount > eungPoint) { alert('보유 운포인트가 부족합니다.'); return }
    alert(`${amount.toLocaleString()}P 인출 신청이 완료되었습니다.`)
    router.push('/charge')
  }

  return (
    <div className="wallet-container">
      <div className="wallet-head">
        <Link href="/charge" className="wallet-back" aria-label="충전/인출로 돌아가기">
          <ArrowLeftIcon size={20} />
        </Link>
        <h2 className="wallet-title"><ArrowCircleDownIcon size={22} weight="light" color="var(--accent)" /> 포인트 인출</h2>
      </div>

      <div className="wallet-summary-card">
        <p className="wallet-summary-label">🎰 인출 가능 운포인트</p>
        <p className="wallet-summary-value">{eungPoint.toLocaleString()}P</p>
        <p className="wallet-summary-note">1P = 1원 / 쌀포인트는 인출 불가</p>
      </div>

      <form onSubmit={handleSubmit} className="wallet-form">
        <div>
          <p className="wallet-field-title">인출 금액</p>
          <div className="wallet-input-wrap">
            <input
              id="withdraw-amount"
              type="number"
              placeholder="인출할 포인트 입력 (최소 1,000P)"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              min={1000}
              max={eungPoint}
              className="field-input"
            />
            <span className="wallet-input-suffix">P</span>
          </div>
          <div className="chip-row">
            {[1000, 5000, 10000].map(v => (
              <button key={v} type="button" className="chip-btn" onClick={() => setAmount(v)}>
                {v.toLocaleString()}P
              </button>
            ))}
            <button type="button" className="chip-btn accent" onClick={() => setAmount(eungPoint)}>
              전액
            </button>
          </div>
          {amount !== '' && (
            <p className={`wallet-hint ${overLimit ? 'fail' : 'ok'}`}>
              {overLimit ? '보유 포인트를 초과했습니다.' : `인출 후 잔여: ${(eungPoint - Number(amount)).toLocaleString()}P`}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="wallet-field-title" style={{ margin: 0 }}>입금 계좌</p>
          <select
            id="withdraw-bank"
            value={bank}
            onChange={e => setBank(e.target.value)}
            required
            className="field-input wallet-select"
            style={{ color: bank ? 'var(--text)' : 'var(--text-tertiary)' }}
          >
            <option value="">은행 선택</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input
            id="withdraw-account"
            type="text"
            placeholder="계좌번호 (- 없이 입력)"
            value={account}
            onChange={e => setAccount(e.target.value)}
            required
            className="field-input"
          />
          <input
            id="withdraw-holder"
            type="text"
            placeholder="예금주명"
            value={holder}
            onChange={e => setHolder(e.target.value)}
            required
            className="field-input"
          />
        </div>

        <button type="submit" className="auth-submit">
          {amount ? `${Number(amount).toLocaleString()}P 인출 신청` : '인출 신청'}
        </button>
      </form>
    </div>
  )
}
