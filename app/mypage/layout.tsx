'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArchiveIcon,
  GearIcon,
  HeartIcon,
  HouseIcon,
  PaintBrushIcon,
  PencilSimpleIcon,
  ReceiptIcon,
  TicketIcon,
} from '@phosphor-icons/react'
import { useStorage } from '@/hooks/useStorage'
import { getValidSession, clearAuth } from '@/lib/auth'
import { getMyProfile, ApiError, type MyProfileResponse } from '@/lib/api'
import { useRaffleEntryPhases } from '@/hooks/useRaffleEntryPhases'
import { isOngoingPhase } from '@/lib/raffle'
import PixelAvatar from '@/components/PixelAvatar'
import { normalizeAvatar, type AvatarConfig } from '@/lib/avatar/compose'
import { AVATAR_UPDATED_EVENT } from '@/lib/avatar/events'

function getMenuItems(ongoingCount: number, readyStorageCount: number) {
  return [
    { icon: <HouseIcon size={16} weight="fill" />, label: '내 활동 요약', href: '/mypage', badge: 0 },
    { icon: <PaintBrushIcon size={16} weight="fill" />, label: '캐릭터 꾸미기', href: '/mypage/avatar', badge: 0 },
    { icon: <TicketIcon size={16} weight="fill" />, label: '응모 내역', href: '/mypage/entries', badge: ongoingCount },
    { icon: <ReceiptIcon size={16} weight="fill" />, label: '구매 내역', href: '/mypage/purchases', badge: 0 },
    { icon: <ArchiveIcon size={16} weight="fill" />, label: '보관함', href: '/mypage/storage', badge: readyStorageCount },
    { icon: <HeartIcon size={16} weight="fill" />, label: '찜한 상품', href: '/mypage/wishlist', badge: 0 },
    { icon: <GearIcon size={16} weight="fill" />, label: '설정', href: '/mypage/settings', badge: 0 },
  ]
}

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [profile, setProfile] = useState<MyProfileResponse | null>(null)
  const { items: raffleItems, entries } = useRaffleEntryPhases()
  const ongoingCount = raffleItems.filter(e => isOngoingPhase(e.phase)).length
  const { readyCount: readyStorageCount } = useStorage()
  const participationCount = entries.filter(e => e.status !== 'cancelled').length
  // 결과를 확인한 당첨만 센다 — 확인 전에 숫자가 오르면 결과를 미리 알게 되므로
  const winCount = raffleItems.filter(e => e.phase === 'won').length
  const avatarConfig = useMemo(() => normalizeAvatar(profile?.avatar_config), [profile?.avatar_config])

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

  // 캐릭터 꾸미기에서 저장하면 프로필 카드도 바로 바꾼다
  useEffect(() => {
    const onUpdate = (e: Event) => {
      const config = (e as CustomEvent<AvatarConfig>).detail
      setProfile((prev) => (prev ? { ...prev, avatar_config: config } : prev))
    }
    window.addEventListener(AVATAR_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, onUpdate)
  }, [])

  if (!authChecked) return null

  return (
    <div className="mypage-layout">
      <div className="sidebar">
        <div className="profile-card">
          <Link href="/mypage/avatar" className="profile-avatar profile-avatar-pixel" aria-label="캐릭터 꾸미기">
            {profile && (
              <PixelAvatar
                config={avatarConfig}
                size={80}
                alt={`${profile.nickname}의 캐릭터`}
                persist
              />
            )}
            <span className="profile-avatar-edit"><PencilSimpleIcon size={12} weight="bold" /></span>
          </Link>
          <div className="profile-name">{profile?.nickname ?? '불러오는 중...'}</div>
          <div className="profile-email">{profile?.email ?? ''}</div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{participationCount}</div>
              <div className="profile-stat-label">응모 내역</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{winCount}</div>
              <div className="profile-stat-label">당첨 횟수</div>
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          {getMenuItems(ongoingCount, readyStorageCount).map((item) => {
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
