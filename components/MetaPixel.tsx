'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AD_MEASUREMENT_CHANGED_EVENT, loadPixel, trackingAllowed } from '@/lib/metaPixel'

// 메타 픽셀 — 광고 측정을 거부하지 않았을 때만 불러온다.
// App Router는 페이지를 옮겨도 새로 불러오지 않으므로 주소가 바뀔 때마다 PageView를 직접 보낸다
export default function MetaPixel() {
  const pathname = usePathname()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const sync = () => setAllowed(trackingAllowed())
    sync()
    window.addEventListener(AD_MEASUREMENT_CHANGED_EVENT, sync)
    return () => window.removeEventListener(AD_MEASUREMENT_CHANGED_EVENT, sync)
  }, [])

  useEffect(() => {
    if (!allowed) return
    loadPixel()
    window.fbq?.('track', 'PageView')
  }, [allowed, pathname])

  return null
}
