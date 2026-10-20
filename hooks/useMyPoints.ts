'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMyPoints } from '@/lib/api'
import { getValidSession } from '@/lib/auth'

// 쌀포인트가 변할 수 있는 동작(쌀포인트 상점 구매 등) 이후 이 이벤트를 dispatch하면
// useMyPoints를 쓰는 모든 곳(네브바 등)이 잔액을 다시 불러온다.
export const POINTS_UPDATED_EVENT = 'points-updated'

export function notifyPointsUpdated() {
  window.dispatchEvent(new Event(POINTS_UPDATED_EVENT))
}

export function useMyPoints() {
  const [ssalPoint, setSsalPoint] = useState(0)
  const [ssalTicket, setSsalTicket] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)

  const refetch = useCallback(async () => {
    const session = await getValidSession()
    setLoggedIn(!!session)
    if (!session) return
    try {
      const res = await getMyPoints(session.token)
      setSsalPoint(res.ssal_point)
      setSsalTicket(res.ssal_ticket ?? 0)
    } catch {
      // 무시
    }
  }, [])

  useEffect(() => {
    refetch()
    window.addEventListener(POINTS_UPDATED_EVENT, refetch)
    return () => window.removeEventListener(POINTS_UPDATED_EVENT, refetch)
  }, [refetch])

  return { ssalPoint, ssalTicket, loggedIn, refetch }
}
