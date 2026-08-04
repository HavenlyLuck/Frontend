"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_CATEGORIES = [
  { label: "🎟 응모", href: "/eungmo" },
  { label: "🎁 쿠지", href: "/kuji" },
  { label: "🏪 상점", href: "/shop" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMypage = pathname === "/mypage";
  const isHome = pathname === "/";
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // TODO: 실제 API에서 포인트 조회
  const eungPoint = 12500;
  const ssalPoint = 3000;

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  }

  return (
    <nav className={isHome ? "nav-neon" : undefined}>
      <div className="nav-top-row">
        <Link className="logo" href="/">
          <div className="logo-icon">🧧</div>
          천운
        </Link>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <div className="nav-point-item">
                <span className="nav-point-label">🎟 응포인트</span>
                <span className="nav-point-value">
                  {eungPoint.toLocaleString()}P
                </span>
                <Link
                  href="/charge"
                  className="nav-point-plus"
                  title="응포인트 충전"
                >
                  +
                </Link>
              </div>
              <div className="nav-point-item">
                <span className="nav-point-label">🌾 쌀포인트</span>
                <span className="nav-point-value">
                  {ssalPoint.toLocaleString()}P
                </span>
              </div>
              <Link href="/mypage#wishlist" className="nav-btn">
                <span>❤️</span>
                <span>찜한 상품</span>
              </Link>
              <Link
                href="/mypage"
                className={`nav-btn ${isMypage ? "active-nav" : ""}`}
              >
                <span>👤</span>
                <span>마이페이지</span>
              </Link>
              <button className="nav-btn" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-btn">
                로그인
              </Link>
              <Link href="/signup" className="nav-btn">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="nav-tabs-row">
        <div className="search-bar">
          <span>🔍</span>
          <input type="text" placeholder="원하는 상품을 검색해보세요" />
        </div>

        <div className="nav-categories">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`nav-cat-tab ${pathname === cat.href ? "active" : ""}`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
