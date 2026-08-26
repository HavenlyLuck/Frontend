'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArchiveIcon,
  GearIcon,
  HeartIcon,
  HouseIcon,
  ReceiptIcon,
  StarIcon,
  TicketIcon,
  UserIcon,
} from '@phosphor-icons/react'
import { getReadyStorageCount } from '@/lib/storage'
import { getValidSession, clearAuth } from '@/lib/auth'
import { getMyProfile, ApiError, type MyProfileResponse } from '@/lib/api'
import { useMyRaffleEntries } from '@/hooks/useMyRaffleEntries'
import { groupEntriesByProduct } from '@/lib/raffle'

function getMenuItems(ongoingCount: number) {
  return [
    { icon: <HouseIcon size={16} weight="fill" />, label: '내 활동 요약', href: '/mypage', badge: 0 },
    { icon: <TicketIcon size={16} weight="fill" />, label: '응모 내역', href: '/mypage/entries', badge: ongoingCount },
    { icon: <ReceiptIcon size={16} weight="fill" />, label: '구매 내역', href: '/mypage/purchases', badge: 0 },
    { icon: <ArchiveIcon size={16} weight="fill" />, label: '보관함', href: '/mypage/storage', badge: getReadyStorageCount() },
    { icon: <HeartIcon size={16} weight="fill" />, label: '찜한 상품', href: '/mypage/wishlist', badge: 0 },
    { icon: <GearIcon size={16} weight="fill" />, label: '설정', href: '/mypage/settings', badge: 0 },
  ]
}

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [profile, setProfile] = useState<MyProfileResponse | null>(null)
  const { entries } = useMyRaffleEntries()
  const ongoingCount = groupEntriesByProduct(entries).filter(e => e.status === 'open').length
  const participationCount = entries.filter(e => e.status !== 'cancelled').length

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace('/login')
        return
      }
      // 세션이 유효하면 일단 페이지를 보여준다. 프로필 조회는 별도로 시도하고,
      // 실패해도(네트워크 오류 등) 인증 자체가 만료된 게 아니면 로그인 화면으로 쫓아내지 않는다.
      setAuthChecked(true)
      getMyProfile(session.token)
        .then((data) => {
          if (!cancelled) setProfile(data)
        })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            clearAuth()
            router.replace('/login')
          }
        })
    })
    return () => { cancelled = true }
  }, [router])

  if (!authChecked) return null

  return (
    <div className="mypage-layout">
      <div className="sidebar">
        <div className="profile-card">
          <div className="profile-avatar">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <UserIcon size={36} weight="fill" color="#fff" />
            )}
          </div>
          <div className="profile-name">{profile?.nickname ?? '불러오는 중...'}</div>
          <div className="profile-email">{profile?.email ?? ''}</div>
          <div className="profile-rating"><StarIcon size={13} weight="fill" /> 4.9</div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{participationCount}</div>
              <div className="profile-stat-label">응모 내역</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">-</div>
              <div className="profile-stat-label">당첨 횟수</div>
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          {getMenuItems(ongoingCount).map((item) => {
            const active = item.href === '/mypage' ? pathname === '/mypage' : pathname.startsWith(item.href)
            const badge = item.badge
            return (
              <Link key={item.label} href={item.href} className={`menu-item ${active ? 'active' : ''}`}>
                <span className="menu-icon">{item.icon}</span>
                {item.label}
                {!!badge && <span className="menu-badge">{badge}</span>}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="main-content">{children}</div>
    </div>
  )
}
