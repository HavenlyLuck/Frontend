'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArchiveIcon,
  GearIcon,
  HeartIcon,
  HouseIcon,
  StarIcon,
  TicketIcon,
  UserIcon,
} from '@phosphor-icons/react'
import { getReadyStorageCount } from '@/lib/storage'
import { getOngoingEntries, getParticipationCount, getWinCount } from '@/lib/raffleEntries'

const MENU_ITEMS = [
  { icon: <HouseIcon size={16} weight="fill" />, label: '내 활동 요약', href: '/mypage' },
  { icon: <TicketIcon size={16} weight="fill" />, label: '응모 내역', href: '/mypage/entries', badge: () => getOngoingEntries().length },
  { icon: <ArchiveIcon size={16} weight="fill" />, label: '보관함', href: '/mypage/storage', badge: () => getReadyStorageCount() },
  { icon: <HeartIcon size={16} weight="fill" />, label: '찜한 상품', href: '/mypage/wishlist' },
  { icon: <GearIcon size={16} weight="fill" />, label: '설정', href: '/mypage/settings' },
]

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mypage-layout">
      <div className="sidebar">
        <div className="profile-card">
          <div className="profile-avatar"><UserIcon size={36} weight="fill" color="#fff" /></div>
          <div className="profile-name">경호소인</div>
          <div className="profile-email">wkcpq103100@gmail.com</div>
          <div className="profile-rating"><StarIcon size={13} weight="fill" /> 4.9</div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{getParticipationCount()}</div>
              <div className="profile-stat-label">응모 내역</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{getWinCount()}</div>
              <div className="profile-stat-label">당첨 횟수</div>
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          {MENU_ITEMS.map((item) => {
            const active = item.href === '/mypage' ? pathname === '/mypage' : pathname.startsWith(item.href)
            const badge = item.badge?.()
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
