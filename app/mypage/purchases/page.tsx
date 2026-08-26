'use client'

import { ReceiptIcon, TicketIcon } from '@phosphor-icons/react'
import { useMyRaffleEntries } from '@/hooks/useMyRaffleEntries'
import { formatDateTime } from '@/lib/date'

export default function PurchaseHistoryPage() {
  const { entries } = useMyRaffleEntries()
  const sorted = [...entries].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  return (
    <>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><ReceiptIcon size={17} weight="fill" color="var(--accent)" /> 구매 내역</div>
      </div>

      {sorted.length === 0 ? (
        <div className="coming-soon-box">
          <div className="desc">아직 구매 내역이 없어요.</div>
        </div>
      ) : (
        <div className="entry-list">
          {sorted.map(entry => (
            <div key={entry.entry_id} className="entry-item" style={{ cursor: 'default' }}>
              <div className="entry-emoji">
                {entry.image_url ? <img src={entry.image_url} alt={entry.product_name} /> : '🎟'}
              </div>
              <div className="entry-info">
                <div className="entry-title">{entry.product_name}</div>
                <div className="entry-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TicketIcon size={12} /> {entry.ticket_count}장</span>
                  <span>{formatDateTime(entry.created_at)}</span>
                </div>
              </div>
              <div className="entry-status">
                <span className="status-badge waiting">{entry.points_spent.toLocaleString()} 운포인트</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
