'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMyRaffleEntries, getRaffleProducts, type MyRaffleEntryResponse, type RaffleProductResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import {
  getCheckedResultIds,
  getEntryPhase,
  groupEntriesByProduct,
  markResultChecked,
  RESULT_CHECKED_EVENT,
  type EntryPhase,
  type GroupedRaffleEntry,
} from '@/lib/raffle'

export interface PhasedRaffleEntry extends GroupedRaffleEntry {
  phase: EntryPhase
}

const POLL_MS = 30_000

// 내 응모 내역 + 진행 중인 응모 상품(남은 응모권/시간)을 합쳐서 단계별로 나눈다.
// 매진 → 추첨 → 결과 확인 흐름이 화면을 보고 있는 동안에도 넘어가도록 주기적으로 다시 불러온다.
export function useRaffleEntryPhases() {
  const [entries, setEntries] = useState<MyRaffleEntryResponse[]>([])
  const [products, setProducts] = useState<Map<number, RaffleProductResponse>>(new Map())
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const session = await getValidSession()
    if (!session) return
    try {
      const [mine, open] = await Promise.all([
        getMyRaffleEntries(session.token),
        getRaffleProducts('open').catch(() => [] as RaffleProductResponse[]),
      ])
      setEntries(mine)
      setProducts(new Map(open.map(p => [p.raffle_product_id, p])))
      setCheckedIds(getCheckedResultIds())
      setLoaded(true)
    } catch {
      // 네트워크 오류 시 이전 상태 유지
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_MS)
    const syncChecked = () => setCheckedIds(getCheckedResultIds())
    window.addEventListener(RESULT_CHECKED_EVENT, syncChecked)
    return () => {
      clearInterval(timer)
      window.removeEventListener(RESULT_CHECKED_EVENT, syncChecked)
    }
  }, [load])

  const items: PhasedRaffleEntry[] = groupEntriesByProduct(entries).map(item => ({
    ...item,
    phase: getEntryPhase(item, products.get(item.raffle_product_id), checkedIds.includes(item.raffle_product_id)),
  }))

  const checkResult = useCallback((raffleProductId: number) => {
    markResultChecked(raffleProductId)
  }, [])

  return { items, entries, loaded, checkResult }
}
