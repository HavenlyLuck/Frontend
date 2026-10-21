'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyAdmin, ApiError } from '@/lib/api'
import { getValidSession, clearAuth } from '@/lib/auth'
import FinanceWorkspace, { type WorkspaceTab } from '@/components/admin/FinanceWorkspace'

const TAB_KEYS: WorkspaceTab[] = ['overview', 'inventory', 'expenses']

// 재고·자금 관리 — 관리자인지 확인한 뒤 그린다. ?tab=inventory|expenses 로 바로 그 탭을 열 수 있다.
export default function AdminFinancePage() {
  const router = useRouter()
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [initialTab, setInitialTab] = useState<WorkspaceTab>('overview')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as WorkspaceTab | null
    if (t && TAB_KEYS.includes(t)) setInitialTab(t)

    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace('/login')
        return
      }
      verifyAdmin(session.token)
        .then(() => { if (!cancelled) setAdminToken(session.token) })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) clearAuth()
          router.replace('/')
        })
    })
    return () => { cancelled = true }
  }, [router])

  if (!adminToken) return null
  return <FinanceWorkspace token={adminToken} initialTab={initialTab} />
}
