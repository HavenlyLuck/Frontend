'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AD_MEASUREMENT_CHANGED_EVENT, loadPixel, trackingAllowed, trackPixel } from '@/lib/metaPixel'

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

  // '응모 보러 가기' 버튼 클릭 → Lead (광고 대행사 요청, 2026-11). 버튼이 홈·마이페이지·404 등 여러 곳이라
  // 화면 전체에서 클릭을 받아 글자로 찾는다. 띄어쓰기·화살표(→)가 달라도 잡히게 공백을 지우고 비교한다
  useEffect(() => {
    if (!allowed) return
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest?.('a, button')
      if (!btn) return
      const text = ((btn as HTMLElement).innerText || '').replace(/\s+/g, '')
      if (text.includes('응모보러가기')) trackPixel('Lead', { content_name: '응모 보러 가기' })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [allowed])

  return null
}
