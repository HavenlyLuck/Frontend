'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMyRaffleEntries, getRaffleProducts, type MyRaffleEntryResponse, type RaffleProductResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import {
  getCheckedResultIds,
  getDrawAt,
  getEntryPhase,
  groupEntriesByProduct,
  markResultChecked,
  RESULT_CHECKED_EVENT,
  type EntryPhase,
  type GroupedRaffleEntry,
} from '@/lib/raffle'
import { prefetchDrawCast } from '@/lib/raffleCast'

export interface PhasedRaffleEntry extends GroupedRaffleEntry {
  phase: EntryPhase
  // 추첨 대기 중일 때 추첨 예정 시각(ms), 모르면 null
  drawAt: number | null
}

const POLL_MS = 30_000
// 추첨 예정 시각이 지난 뒤 결과가 나올 때까지 다시 묻는 간격과, 그렇게 묻는 최대 기간
const OVERDUE_POLL_MS = 3_000
const OVERDUE_POLL_WINDOW_MS = 2 * 60 * 1000

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

  const items: PhasedRaffleEntry[] = groupEntriesByProduct(entries).map(item => {
    const product = products.get(item.raffle_product_id)
    const phase = getEntryPhase(item, product, checkedIds.includes(item.raffle_product_id))
    return { ...item, phase, drawAt: phase === 'drawPending' ? getDrawAt(item.soldOutAt ?? product?.sold_out_at) : null }
  })

  // 추첨 대기 중인 응모는 응모자 캐릭터를 미리 받아 두고(결과를 열면 바로 연출),
  // 추첨 예정 시각이 되면 기다리지 않고 바로 다시 불러와 '당첨결과 확인하기'로 넘어가게 한다
  const pendingKey = items
    .filter(i => i.phase === 'drawPending' || i.phase === 'resultReady')
    .map(i => `${i.raffle_product_id}:${i.drawAt ?? ''}`)
    .join(',')
  useEffect(() => {
    if (!pendingKey) return
    const now = Date.now()
    let nextDrawAt = Infinity
    let overdue = false
    for (const part of pendingKey.split(',')) {
      const [id, drawAtRaw] = part.split(':')
      prefetchDrawCast(Number(id)).catch(() => {})
      const drawAt = Number(drawAtRaw)
      if (!drawAt) continue
      if (drawAt > now) nextDrawAt = Math.min(nextDrawAt, drawAt)
      else if (now - drawAt < OVERDUE_POLL_WINDOW_MS) overdue = true
    }
    // 서버는 몇 초 간격으로 추첨을 처리하므로, 예정 시각이 지나면 결과가 나올 때까지 짧게 다시 묻는다
    let interval: ReturnType<typeof setInterval> | undefined
    const startFastPoll = () => {
      load()
      interval = setInterval(load, OVERDUE_POLL_MS)
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    if (overdue) startFastPoll()
    else if (nextDrawAt !== Infinity) timer = setTimeout(startFastPoll, nextDrawAt - now + 1000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [pendingKey, load])

  const checkResult = useCallback((raffleProductId: number) => {
    markResultChecked(raffleProductId)
  }, [])

  return { items, entries, loaded, checkResult }
}
