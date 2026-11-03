'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChatCircleIcon, CoinsIcon, HouseIcon, PackageIcon, TruckIcon } from '@phosphor-icons/react'
import { verifyAdmin, ApiError } from '@/lib/api'
import { getValidSession, clearAuth, loginPath } from '@/lib/auth'
import { fetchShippingBoxes } from '@/lib/adminShipping'
import { getAdminInquiries } from '@/lib/reviews'

/*
 * 관리자 공통 틀 — 관리자 확인을 한 번만 하고, 왼쪽 메뉴(모바일은 위쪽 탭)로 관리자 화면끼리 바로 오간다.
 * 각 관리자 페이지는 useAdminToken()으로 확인된 토큰을 받아 쓴다.
 */

const AdminTokenContext = createContext<string | null>(null)
// 메뉴 숫자(배송 대기·답변 대기)를 다시 세게 한다 — 발송 처리·답변 직후에 부른다
const AdminBadgeRefreshContext = createContext<() => void>(() => {})

export function useRefreshAdminBadges(): () => void {
  return useContext(AdminBadgeRefreshContext)
}

// 메뉴 숫자를 다시 세는 간격 — 화면을 켜 둔 동안 새로 들어온 신청·문의도 보이게
const BADGE_POLL_MS = 60_000
// 토큰 만료 확인 간격 — getValidSession은 만료 30초 전부터 갱신하므로 그보다 짧게
const TOKEN_CHECK_MS = 20_000

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
  { href: '/admin/shipping', label: '배송', icon: TruckIcon, badge: 'shipping', match: (p: string) => p.startsWith('/admin/shipping') },
  { href: '/admin/inquiries', label: '문의', icon: ChatCircleIcon, badge: 'inquiries', match: (p: string) => p.startsWith('/admin/inquiries') },
] as const

type BadgeKey = 'shipping' | 'inquiries'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() ?? '/admin'
  const [token, setToken] = useState<string | null>(null)
  // 배송: 배송 대기 묶음 수(배송 화면의 '배송 대기' 탭과 같은 기준), 문의: 답변 대기 수
  const [badges, setBadges] = useState<Record<BadgeKey, number>>({ shipping: 0, inquiries: 0 })

  const refreshBadges = useCallback(() => {
    if (!token) return
    // 하나가 실패해도 다른 숫자는 갱신한다. 실패한 쪽은 이전 숫자 유지
    fetchShippingBoxes(token, 'requested')
      .then(boxes => setBadges(prev => ({ ...prev, shipping: boxes.length })))
      .catch(() => {})
    getAdminInquiries(token, false)
      .then(list => setBadges(prev => ({ ...prev, inquiries: list.length })))
      .catch(() => {})
  }, [token])

  // 처음 들어올 때, 메뉴를 옮길 때, 1분마다, 창으로 다시 돌아올 때 다시 센다
  useEffect(() => { refreshBadges() }, [refreshBadges, pathname])
  useEffect(() => {
    if (!token) return
    const timer = setInterval(refreshBadges, BADGE_POLL_MS)
    const onFocus = () => refreshBadges()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [token, refreshBadges])

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace(loginPath())
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

  // 토큰은 1시간이면 만료된다. 관리자 화면을 오래 켜 두어도 401이 나지 않게
  // 주기적으로(그리고 창으로 돌아올 때) 확인해서, 곧 만료되면 refresh token으로 새 토큰을 받아 바꿔 끼운다
  useEffect(() => {
    if (!token) return
    let cancelled = false
    const renew = () => {
      getValidSession().then((session) => {
        if (cancelled) return
        if (!session) {
          router.replace(loginPath())
          return
        }
        if (session.token !== token) setToken(session.token)
      })
    }
    const timer = setInterval(renew, TOKEN_CHECK_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') renew() }
    window.addEventListener('focus', renew)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      window.removeEventListener('focus', renew)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [token, router])

  if (!token) return null

  return (
    <AdminTokenContext.Provider value={token}>
      <AdminBadgeRefreshContext.Provider value={refreshBadges}>
      <div className="admin-shell">
        <aside className="admin-nav" aria-label="관리자 메뉴">
          <div className="admin-nav-title">관리자</div>
          {NAV.map((item) => {
            const { href, label, icon: Icon, match } = item
            const active = match(pathname)
            const count = 'badge' in item ? badges[item.badge] : 0
            return (
              <Link key={href} href={href} className={`admin-nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon size={17} weight={active ? 'fill' : 'regular'} /> {label}
                {count > 0 && <span className="menu-badge" aria-label={`${count}건 대기`}>{count > 99 ? '99+' : count}</span>}
              </Link>
            )
          })}
        </aside>
        <main className="admin-main">{children}</main>
      </div>
      </AdminBadgeRefreshContext.Provider>
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
