'use client'

import { useEffect, useState } from 'react'
import { useAdminToken } from '@/components/admin/AdminShell'
import FinanceWorkspace, { type WorkspaceTab } from '@/components/admin/FinanceWorkspace'

const TAB_KEYS: WorkspaceTab[] = ['overview', 'inventory', 'expenses']

// 재고·자금 관리 — ?tab=inventory|expenses 로 바로 그 탭을 열 수 있다 (관리자 확인은 AdminShell)
export default function AdminFinancePage() {
  const token = useAdminToken()
  const [initialTab, setInitialTab] = useState<WorkspaceTab | null>(null)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as WorkspaceTab | null
    setInitialTab(t && TAB_KEYS.includes(t) ? t : 'overview')
  }, [])

  if (!initialTab) return null
  return <FinanceWorkspace token={token} initialTab={initialTab} />
}
