'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureReferralFromUrl } from '@/lib/referralLink'

// 친구 초대 링크(?ref=코드)로 들어온 사람의 추천인 코드를 기억한다 — 화면에는 아무것도 그리지 않는다
export default function ReferralCapture() {
  const pathname = usePathname()
  useEffect(() => { captureReferralFromUrl() }, [pathname])
  return null
}
