"use client";

import Link from "next/link";
import LogoMark from "./LogoMark";
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
import { useStorage } from "@/hooks/useStorage";
import { getValidSession, clearAuth } from "@/lib/auth";
import { notifyStorageUpdated } from "@/lib/storage";

const NAV_CATEGORIES = [
  { label: "응모", href: "/eungmo" },
  { label: "쿠지", href: "/kuji" },
  { label: "상점", href: "/shop" },
  { label: "컨텐츠", href: "/contents" },
  { label: "가이드", href: "/guide" },
  { label: "후기/문의", href: "/review" },
  { label: "공지사항", href: "/notice" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMypage = pathname === "/mypage";
  const isNeon = false;
  const hideTabsRow = pathname === "/login" || pathname === "/signup";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { ssalPoint } = useMyPoints();
  const { readyCount: readyStorageCount } = useStorage();

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
    notifyStorageUpdated();
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push("/");
  }

  return (
    <nav className={isNeon ? "nav-neon" : undefined}>
      <div className="nav-top-row">
        <Link className="logo" href="/">
          <LogoMark className="logo-icon" />
          천운
        </Link>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <div className="nav-point-item">
                <span className="nav-point-label">🌾 쌀포인트</span>
                <span className="nav-point-value">
                  {ssalPoint.toLocaleString()}P
                </span>
              </div>
              <Link href="/mypage/storage" className="nav-btn">
                <ArchiveIcon size={16} weight="bold" />
                <span>보관함</span>
                {readyStorageCount > 0 && (
                  <span className="nav-btn-badge">{readyStorageCount}</span>
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
        <form
          className="search-bar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = searchText.trim();
            if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <MagnifyingGlassIcon size={16} color="var(--text-tertiary)" />
          <input
            type="search"
            placeholder="원하는 상품을 검색해보세요"
            aria-label="상품 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </form>

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
