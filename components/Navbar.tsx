'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const isMypage = pathname === '/mypage'

  return (
    <nav>
      <Link className="logo" href="/">
        <div className="logo-icon">🧧</div>
        천운
      </Link>

      <div className="search-bar">
        <span>🔍</span>
        <input type="text" placeholder="원하는 상품을 검색해보세요" />
      </div>

      <div className="nav-actions">
        <button className="nav-btn">💬 채팅하기</button>
        <Link href="/mypage" className={`nav-btn ${isMypage ? 'active-nav' : ''}`}>
          👤 마이페이지
        </Link>
      </div>
    </nav>
  )
}
