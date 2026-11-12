"use client";

import Link from "next/link";
import { Logo } from "./LogoMark";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArchiveIcon,
  GearIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  SignOutIcon,
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
  const hideTabsRow = ["/login", "/signup", "/find-id", "/find-password"].includes(pathname);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { ssalPoint, ssalTicket } = useMyPoints();
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
          <Logo className="logo-full" />
        </Link>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <Link href="/mypage/storage" className="nav-point-item" aria-label={`쌀 응모권 ${ssalTicket}장`} title="이벤트·친구 추천으로 받은 쌀 응모권 (낙첨돼도 쌀포인트 페이백 없음)">
                <span aria-hidden="true">🎫</span>
                <span className="nav-point-label">쌀 응모권</span>
                <span className="nav-point-value">{ssalTicket.toLocaleString()}장</span>
              </Link>
              <div className="nav-point-item">
                <span className="nav-point-label">🌾 쌀포인트</span>
                <span className="nav-point-value">
                  {ssalPoint.toLocaleString()}P
                </span>
              </div>
              {/* 좁은 화면에선 글자(nav-btn-label)를 숨기고 아이콘만 보여준다 */}
              <Link href="/mypage/storage" className="nav-btn" aria-label="보관함">
                <ArchiveIcon size={16} weight="bold" />
                <span className="nav-btn-label">보관함</span>
                {readyStorageCount > 0 && (
                  <span className="nav-btn-badge">{readyStorageCount}</span>
                )}
              </Link>
              <Link href="/mypage/wishlist" className="nav-btn" aria-label="찜한 상품">
                <HeartIcon size={16} weight="bold" />
                <span className="nav-btn-label">찜한 상품</span>
              </Link>
              <Link
                href="/mypage"
                className={`nav-btn ${isMypage ? "active-nav" : ""}`}
                aria-label="마이페이지"
              >
                <UserIcon size={16} weight="bold" />
                <span className="nav-btn-label">마이페이지</span>
              </Link>
              <button className="nav-btn" onClick={handleLogout} aria-label="로그아웃">
                <SignOutIcon size={16} weight="bold" className="nav-btn-mobile-icon" />
                <span className="nav-btn-label">로그아웃</span>
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
