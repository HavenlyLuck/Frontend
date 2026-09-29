'use client'

import Link from 'next/link'
import { ArrowCircleDownIcon, ArrowCircleUpIcon } from '@phosphor-icons/react'
import { useMyPoints } from '@/hooks/useMyPoints'

const HISTORY = [
  { type: 'deposit', label: '운포인트 충전', date: '2026.06.20', point: '+10,000P' },
  { type: 'withdraw', label: '포인트 인출', date: '2026.06.18', point: '-5,000P' },
  { type: 'deposit', label: '운포인트 충전', date: '2026.06.15', point: '+30,000P' },
  { type: 'bonus', label: '쌀포인트 지급', date: '2026.06.10', point: '+3,000P' },
  { type: 'withdraw', label: '포인트 인출', date: '2026.06.05', point: '-20,000P' },
]

export default function PointHubPage() {
  const { eungPoint, ssalPoint } = useMyPoints()
  const totalPoint = eungPoint + ssalPoint

  return (
    <div className="wallet-container">
      <h1 className="wallet-title" style={{ marginBottom: 24 }}>내 지갑</h1>

      {/* 총 포인트 */}
      <div className="wallet-total-card">
        <p className="wallet-total-label">총 보유 포인트</p>
        <p className="wallet-total-value">
          {totalPoint.toLocaleString()}<span>P</span>
        </p>
        <div className="wallet-split-row">
          <div className="wallet-split-item">
            <p className="wallet-split-label">🎰 운포인트</p>
            <p className="wallet-split-value">{eungPoint.toLocaleString()}P</p>
          </div>
          <div className="wallet-split-divider" />
          <div className="wallet-split-item">
            <p className="wallet-split-label">🌾 쌀포인트</p>
            <p className="wallet-split-value">{ssalPoint.toLocaleString()}P</p>
          </div>
        </div>
      </div>

      {/* 충전 / 인출 버튼 */}
      <div className="wallet-actions">
        <Link href="/charge/withdraw" className="wallet-action-card">
          <ArrowCircleDownIcon size={26} weight="light" />
          <span className="wallet-action-label">포인트 인출</span>
        </Link>
        <Link href="/charge/deposit" className="wallet-action-card">
          <ArrowCircleUpIcon size={26} weight="light" />
          <span className="wallet-action-label">포인트 충전</span>
        </Link>
      </div>

      {/* 최근 내역 */}
      <div>
        <p className="wallet-section-title">최근 내역</p>
        <div className="wallet-history-list">
          {HISTORY.map((item, i) => (
            <div key={i} className="wallet-history-item">
              <div>
                <p className="wallet-history-label">{item.label}</p>
                <p className="wallet-history-date">{item.date}</p>
              </div>
              <p className={`wallet-history-amount ${item.type}`}>{item.point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
