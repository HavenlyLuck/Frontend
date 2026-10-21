'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CoinsIcon, HouseIcon, PackageIcon, TruckIcon } from '@phosphor-icons/react'
import { verifyAdmin, ApiError } from '@/lib/api'
import { getValidSession, clearAuth } from '@/lib/auth'

/*
 * 관리자 공통 틀 — 관리자 확인을 한 번만 하고, 왼쪽 메뉴(모바일은 위쪽 탭)로 관리자 화면끼리 바로 오간다.
 * 각 관리자 페이지는 useAdminToken()으로 확인된 토큰을 받아 쓴다.
 */

const AdminTokenContext = createContext<string | null>(null)

// 관리자 페이지 안에서만 쓴다 — AdminShell이 확인을 마친 뒤에만 자식을 그리므로 항상 토큰이 있다
export function useAdminToken(): string {
  const token = useContext(AdminTokenContext)
  if (!token) throw new Error('useAdminToken은 AdminShell 안에서만 쓸 수 있어요')
  return token
}

const NAV = [
  { href: '/admin', label: '홈', icon: HouseIcon, match: (p: string) => p === '/admin' },
  { href: '/admin/products', label: '상품', icon: PackageIcon, match: (p: string) => p.startsWith('/admin/products') },
  { href: '/admin/finance', label: '재고·자금', icon: CoinsIcon, match: (p: string) => p.startsWith('/admin/finance') || p.startsWith('/admin/inventory') },
  { href: '/admin/shipping', label: '배송', icon: TruckIcon, match: (p: string) => p.startsWith('/admin/shipping') },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() ?? '/admin'
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace('/login')
        return
      }
      verifyAdmin(session.token)
        .then(() => { if (!cancelled) setToken(session.token) })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) clearAuth()
          router.replace('/')
        })
    })
    return () => { cancelled = true }
  }, [router])

  if (!token) return null

  return (
    <AdminTokenContext.Provider value={token}>
      <div className="admin-shell">
        <aside className="admin-nav" aria-label="관리자 메뉴">
          <div className="admin-nav-title">관리자</div>
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname)
            return (
              <Link key={href} href={href} className={`admin-nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon size={17} weight={active ? 'fill' : 'regular'} /> {label}
              </Link>
            )
          })}
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </AdminTokenContext.Provider>
  )
}

// 관리자 페이지 머리 — 제목 · 한 줄 설명 · 오른쪽 주요 버튼
export function AdminPageHeader({ title, description, actions }: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="admin-page-header">
      <div style={{ minWidth: 0 }}>
        <h1 className="admin-page-title">{title}</h1>
        {description && <p className="admin-page-desc">{description}</p>}
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </div>
  )
}
