'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMyPoints } from '@/lib/api'
import { getValidSession } from '@/lib/auth'

// 포인트가 변할 수 있는 동작(응모권 구매 등) 이후 이 이벤트를 dispatch하면
// useMyPoints를 쓰는 모든 곳(네브바 등)이 잔액을 다시 불러온다.
export const POINTS_UPDATED_EVENT = 'points-updated'

export function notifyPointsUpdated() {
  window.dispatchEvent(new Event(POINTS_UPDATED_EVENT))
}

export function useMyPoints() {
  const [eungPoint, setEungPoint] = useState(0)
  const [ssalPoint, setSsalPoint] = useState(0)

  const refetch = useCallback(async () => {
    const session = await getValidSession()
    if (!session) return
    try {
      const res = await getMyPoints(session.token)
      setEungPoint(res.woon_point)
      setSsalPoint(res.ssal_point)
    } catch {
      // 무시
    }
  }, [])

  useEffect(() => {
    refetch()
    window.addEventListener(POINTS_UPDATED_EVENT, refetch)
    return () => window.removeEventListener(POINTS_UPDATED_EVENT, refetch)
  }, [refetch])

  return { eungPoint, ssalPoint, refetch }
}
