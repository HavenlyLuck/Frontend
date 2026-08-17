"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMyPoints } from "@/hooks/useMyPoints";
import { getReadyStorageCount } from "@/lib/storage";
import { getValidSession, clearAuth } from "@/lib/auth";

const NAV_CATEGORIES = [
  { emoji: "🎟", label: "응모", href: "/eungmo" },
  { emoji: "🎁", label: "쿠지", href: "/kuji" },
  { emoji: "🏪", label: "상점", href: "/shop" },
  { emoji: "📖", label: "설명충", href: "/guide" },
  { emoji: "💬", label: "후기/문의", href: "/review" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMypage = pathname === "/mypage";
  const isNeon = false;
  const hideTabsRow = pathname === "/login" || pathname === "/signup";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { eungPoint, ssalPoint } = useMyPoints();

  useEffect(() => {
    let cancelled = false;
    getValidSession().then((session) => {
      if (cancelled) return;
      setIsLoggedIn(!!session);
      setIsAdmin(!!session?.isAdmin);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function handleLogout() {
    clearAuth();
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push("/");
  }

  return (
    <nav className={isNeon ? "nav-neon" : undefined}>
      <div className="nav-top-row">
        <Link className="logo" href="/">
          <div className="logo-icon">🧧</div>
          천운
        </Link>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <div className="nav-point-item">
                <span className="nav-point-label">🎰 운포인트</span>
                <span className="nav-point-value">
                  {eungPoint.toLocaleString()}P
                </span>
                <Link
                  href="/charge"
                  className="nav-point-plus"
                  title="운포인트 충전"
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
              <Link href="/mypage/storage" className="nav-btn">
                <span>📦</span>
                <span>보관함</span>
                {getReadyStorageCount() > 0 && (
                  <span className="nav-btn-badge">{getReadyStorageCount()}</span>
                )}
              </Link>
              <Link href="/wishlist" className="nav-btn">
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

      {!hideTabsRow && <div className="nav-tabs-row">
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
              <span className="emoji">{cat.emoji}</span> {cat.label}
            </Link>
          ))}
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className={`nav-cat-tab ${pathname === "/admin" ? "active" : ""}`}
            style={{ marginLeft: 'auto' }}
          >
            <span className="emoji">⚙️</span> 관리자
          </Link>
        )}
      </div>}
    </nav>
  );
}
