"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArchiveIcon,
  GearIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useMyPoints } from "@/hooks/useMyPoints";
import { getReadyStorageCount } from "@/lib/storage";
import { getValidSession, clearAuth } from "@/lib/auth";

const NAV_CATEGORIES = [
  { label: "응모", href: "/eungmo" },
  { label: "쿠지", href: "/kuji" },
  { label: "상점", href: "/shop" },
  { label: "설명충", href: "/guide" },
  { label: "후기/문의", href: "/review" },
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
          <svg className="logo-icon" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M6 20 C6 15.5 9.6 12.5 13.5 13.2 C14.6 9.6 19 8.3 22 11 C25.6 11.4 28 14.3 27 17.8 C29.2 19 29.2 22.4 26.5 23.3 C25.5 25.6 22.6 26.2 20.8 24.6 C19.4 26.4 16.4 26.3 15.1 24.4 C12.8 25.6 9.8 24.3 9.3 21.8 C7.4 21.9 6 21.2 6 20 Z"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="23" cy="12.5" r="1.8" fill="var(--gold)" />
          </svg>
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
                <ArchiveIcon size={16} weight="bold" />
                <span>보관함</span>
                {getReadyStorageCount() > 0 && (
                  <span className="nav-btn-badge">{getReadyStorageCount()}</span>
                )}
              </Link>
              <Link href="/mypage/wishlist" className="nav-btn">
                <HeartIcon size={16} weight="bold" />
                <span>찜한 상품</span>
              </Link>
              <Link
                href="/mypage"
                className={`nav-btn ${isMypage ? "active-nav" : ""}`}
              >
                <UserIcon size={16} weight="bold" />
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
          <MagnifyingGlassIcon size={16} color="var(--text-tertiary)" />
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
        {isAdmin && (
          <Link
            href="/admin"
            className={`nav-cat-tab ${pathname === "/admin" ? "active" : ""}`}
            style={{ marginLeft: 'auto', gap: '6px' }}
          >
            <GearIcon size={15} weight="bold" />
            관리자
          </Link>
        )}
      </div>}
    </nav>
  );
}
