"use client";

import Link from "next/link";
import { Logo } from "./LogoMark";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArchiveIcon,
  GearIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  SignOutIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { notifyPointsUpdated, useMyPoints } from "@/hooks/useMyPoints";
import { useStorage } from "@/hooks/useStorage";
import { getValidSession, clearAuth, isLoginExpired, loginPath } from "@/lib/auth";
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

  // 상단 메뉴가 옆으로 더 있는지 (휴대폰) — 끝까지 밀면 흐림·› 표시를 없앤다
  const catRef = useRef<HTMLDivElement>(null);
  const [catMore, setCatMore] = useState(false);
  const updateCatMore = useCallback(() => {
    const el = catRef.current;
    if (el) setCatMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    updateCatMore();
    window.addEventListener("resize", updateCatMore);
    return () => window.removeEventListener("resize", updateCatMore);
  }, [updateCatMore, isAdmin, compact]);
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

  // 로그인하고 하루(로그인 유지 시간)가 지나면 자동 로그아웃 — 화면을 켜 둔 채여도 1분마다, 다시 볼 때마다 확인한다
  useEffect(() => {
    const check = () => {
      if (!isLoginExpired()) return;
      clearAuth();
      notifyStorageUpdated();
      notifyPointsUpdated();
      setIsLoggedIn(false);
      setIsAdmin(false);
      alert("로그인한 지 하루가 지나 자동으로 로그아웃되었어요. 다시 로그인해 주세요.");
      router.push(loginPath());
    };
    check();
    const timer = setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

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
              <Link href="/mypage/storage" className="nav-point-item" aria-label={`쌀 응모권 ${ssalTicket}장`} title="이벤트·친구 추천으로 받은 쌀 응모권 (낙첨돼도 쌀포인트 적립 없음)">
                <EmojiIcon name="ssal-ticket" />
                <span className="nav-point-label">쌀 응모권</span>
                <span className="nav-point-value">{ssalTicket.toLocaleString()}장</span>
              </Link>
              <Link href="/mypage/points" className="nav-point-item" aria-label={`쌀포인트 ${ssalPoint.toLocaleString()}P, 내역 보기`}>
                {/* 아이콘은 글자(nav-point-label) 밖에 둔다 — 폰에선 글자를 숨기는데 아이콘까지 같이 사라졌었음 */}
                <EmojiIcon name="rice" />
                <span className="nav-point-label">쌀포인트</span>
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
              <Link
                href="/mypage"
                className={`nav-btn ${isMypage ? "active-nav" : ""}`}
                aria-label="마이페이지"
              >
                <UserIcon size={16} weight="bold" />
                <span className="nav-btn-label">마이페이지</span>
              </Link>
              <Link href="/mypage/wishlist" className="nav-btn" aria-label="찜한 상품">
                <HeartIcon size={16} weight="bold" />
                <span className="nav-btn-label">찜한 상품</span>
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

        {/* 휴대폰에선 메뉴가 옆으로 밀리므로, 오른쪽에 더 있으면 끝을 흐리게 하고 › 표시를 띄운다 (catMore) */}
        <div className={`nav-cat-wrap${catMore ? " has-more" : ""}`}>
          <div className="nav-categories" ref={catRef} onScroll={updateCatMore}>
            {NAV_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`nav-cat-tab ${pathname === cat.href ? "active" : ""}`}
              >
                {cat.label}
              </Link>
            ))}
            {/* 관리자 메뉴도 같은 줄 안에 둔다 — 예전엔 줄 밖 오른쪽에 붙어 있어서 휴대폰에서 "후기/문의"를 덮었다 */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`nav-cat-tab nav-cat-admin ${pathname === "/admin" ? "active" : ""}`}
              >
                <GearIcon size={15} weight="bold" />
                관리자
              </Link>
            )}
          </div>
        </div>
      </div>}
    </nav>
  );
}
