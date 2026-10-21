'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 재고 관리는 재고·자금 관리의 "재고" 탭으로 합쳐졌다
export default function AdminInventoryRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/finance?tab=inventory') }, [router])
  return null
}
