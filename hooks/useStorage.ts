'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMyStorage, type StorageItemResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { STORAGE_UPDATED_EVENT } from '@/lib/storage'

const POLL_MS = 30_000

// 내 보관함(당첨/구매 상품). 추첨으로 새 당첨 상품이 들어오는 것도 반영되도록 주기적으로 다시 불러온다.
export function useStorage() {
  const [items, setItems] = useState<StorageItemResponse[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const session = await getValidSession()
    if (!session) return
    try {
      setItems(await getMyStorage(session.token))
      setLoaded(true)
    } catch {
      // 네트워크 오류 시 이전 상태 유지
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_MS)
    window.addEventListener(STORAGE_UPDATED_EVENT, load)
    return () => {
      clearInterval(timer)
      window.removeEventListener(STORAGE_UPDATED_EVENT, load)
    }
  }, [load])

  const readyCount = items.filter(i => i.status === 'ready').length

  return { items, setItems, loaded, readyCount, reload: load }
}
