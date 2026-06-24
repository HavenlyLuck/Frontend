'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMypage = pathname === '/mypage'
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // TODO: 실제 API에서 포인트 조회
  const eungPoint = 12500
  const ssalPoint = 3000

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'))
  }, [pathname])

  function handleLogout() {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    router.push('/')
  }

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
        {isLoggedIn ? (
          <>
            <div className="nav-point-item">
              <span className="nav-point-label">🎟 응포인트</span>
              <span className="nav-point-value">{eungPoint.toLocaleString()}P</span>
              <Link href="/charge" className="nav-point-plus" title="응포인트 충전">＋</Link>
            </div>
            <div className="nav-point-item">
              <span className="nav-point-label">🌾 쌀포인트</span>
              <span className="nav-point-value">{ssalPoint.toLocaleString()}P</span>
            </div>
            <Link href="/mypage" className={`nav-btn ${isMypage ? 'active-nav' : ''}`}>
              👤 마이페이지
            </Link>
            <button className="nav-btn" onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-btn">로그인</Link>
            <Link href="/signup" className="nav-btn">회원가입</Link>
          </>
        )}
      </div>
    </nav>
  )
}
