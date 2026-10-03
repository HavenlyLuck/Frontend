'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TicketIcon, XIcon } from '@phosphor-icons/react'
import { useRaffleEntryPhases } from '@/hooks/useRaffleEntryPhases'
import { addNotification } from '@/lib/notifications'

interface Alert {
  id: string
  productName: string
}

const AUTO_HIDE_MS = 10_000

// 내가 참여한 응모가 매진되면 팝업을 띄우고 마이페이지 "최근 알림"에도 남긴다.
// TODO(backend): 알림 API(푸시)가 생기면 사이트를 안 보고 있을 때도 받을 수 있게 교체
export default function RaffleAlertWatcher() {
  const { items, loaded } = useRaffleEntryPhases()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!loaded) return
    for (const item of items) {
      if (item.phase !== 'drawPending' || item.status !== 'open') continue
      const id = `raffle-soldout-${item.raffle_product_id}`
      const added = addNotification({
        id,
        kind: 'raffle-soldout',
        title: `${item.product_name} 응모가 마감되었습니다!`,
        body: '5분 뒤 추첨이 시작됩니다!',
        href: '/mypage/entries',
      })
      if (added) setAlerts(prev => [...prev, { id, productName: item.product_name }])
    }
  }, [items, loaded])

  useEffect(() => {
    for (const alert of alerts) {
      if (timers.current.has(alert.id)) continue
      timers.current.set(alert.id, setTimeout(() => dismiss(alert.id), AUTO_HIDE_MS))
    }
  }, [alerts])

  useEffect(() => {
    const map = timers.current
    return () => map.forEach(clearTimeout)
  }, [])

  function dismiss(id: string) {
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  if (alerts.length === 0) return null

  return (
    <div className="raffle-alert-stack" role="status" aria-live="polite">
      {alerts.map(alert => (
        <div key={alert.id} className="raffle-alert">
          <div className="raffle-alert-icon"><TicketIcon size={20} weight="fill" /></div>
          <div className="raffle-alert-text">
            <div className="raffle-alert-title"><b>{alert.productName}</b> 응모가 마감되었습니다!</div>
            <div className="raffle-alert-body">5분 뒤 추첨이 시작됩니다!</div>
            <Link className="raffle-alert-link" href="/mypage/entries" onClick={() => dismiss(alert.id)}>응모 내역 보기 →</Link>
          </div>
          <button className="raffle-alert-close" aria-label="알림 닫기" onClick={() => dismiss(alert.id)}>
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
