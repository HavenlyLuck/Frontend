"use client";

import Link from "next/link";
import { Logo } from "./LogoMark";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import EmojiIcon from '@/components/EmojiIcon'

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
  // 휴대폰에서 아래로 내리면 검색창을 접어 메뉴를 얇게 만든다 (맨 위 근처로 오면 다시 편다).
  // 접고 펴는 기준을 멀리 떨어뜨려서, 메뉴 높이가 바뀌며 생기는 스크롤 변화로 깜빡이지 않게 한다
  const [compact, setCompact] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setCompact((prev) => (y > 160 ? true : y < 24 ? false : prev));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // 메뉴 높이를 CSS 변수(--nav-h)로 알려 준다 — 메뉴 아래에 붙는 고정 영역(캐릭터 미리보기 등)이 쓴다
  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--nav-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    <nav ref={navRef} className={[isNeon ? "nav-neon" : "", compact ? "nav-compact" : ""].filter(Boolean).join(" ") || undefined}>
      <div className="nav-top-row">
        <Link className="logo" href="/">
          <Logo className="logo-full" />
        </Link>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <Link href="/mypage/storage" className="nav-point-item" aria-label={`쌀 응모권 ${ssalTicket}장`} title="이벤트·친구 추천으로 받은 쌀 응모권 (낙첨돼도 쌀포인트 페이백 없음)">
                <EmojiIcon name="ssal-ticket" />
                <span className="nav-point-label">쌀 응모권</span>
                <span className="nav-point-value">{ssalTicket.toLocaleString()}장</span>
              </Link>
              <Link href="/mypage/points" className="nav-point-item" aria-label={`쌀포인트 ${ssalPoint.toLocaleString()}P, 내역 보기`}>
                <span className="nav-point-label"><EmojiIcon name="rice" /> 쌀포인트</span>
                <span className="nav-point-value">
                  {ssalPoint.toLocaleString()}P
                </span>
              </Link>
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
