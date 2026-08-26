'use client'

import { useEffect, useState } from 'react'
import { getMyRaffleEntries, type MyRaffleEntryResponse } from '@/lib/api'

export function useMyRaffleEntries() {
  const [entries, setEntries] = useState<MyRaffleEntryResponse[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    getMyRaffleEntries(token)
      .then(res => {
        setEntries(res)
        setLoaded(true)
      })
      .catch(() => {})
  }, [])

  return { entries, loaded }
}
