'use client'

import { useEffect, useState } from 'react'
import { getMyPoints } from '@/lib/api'

export function useMyPoints() {
  const [eungPoint, setEungPoint] = useState(0)
  const [ssalPoint, setSsalPoint] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    getMyPoints(token)
      .then(res => {
        setEungPoint(res.woon_point)
        setSsalPoint(res.ssal_point)
      })
      .catch(() => {})
  }, [])

  return { eungPoint, ssalPoint }
}
