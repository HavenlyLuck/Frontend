"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const FEATURED_ITEMS = [
  {
    href: "/products/iphone",
    img: "/images/demo-1.jpg",
    alt: "아이폰 14 Pro",
    badge: "🎟 응모 진행 중",
    pct: 76,
    title: "아이폰 14 Pro 256GB 스페이스 블랙",
    price: "1,000원부터 응모 가능 · 정가 650,000원",
  },
  {
    href: "/products/notebook",
    img: "/images/demo-2.jpg",
    alt: "플레이스테이션 5",
    badge: "🎟 응모 진행 중",
    pct: 92,
    title: "플레이스테이션 5 디스크 에디션",
    price: "1,000원부터 응모 가능 · 정가 450,000원",
  },
  {
    href: "/products/notebook",
    img: "/images/demo-3.jpg",
    alt: "나오야 젠인 피규어",
    badge: "🎟 응모 진행 중",
    pct: 38,
    title: "주술회전 나오야 젠인 피규어",
    price: "1,000원부터 응모 가능 · 정가 120,000원",
  },
  {
    href: "/products/notebook",
    img: "/images/demo-4.jpg",
    alt: "에어팟 프로 2세대",
    badge: "🎟 응모 진행 중",
    pct: 22,
    title: "에어팟 프로 2세대",
    price: "1,000원부터 응모 가능 · 정가 180,000원",
  },
  {
    href: "/products/notebook",
    img: "/images/demo-5.jpg",
    alt: "닌텐도 스위치 OLED",
    badge: "🎟 응모 진행 중",
    pct: 65,
    title: "닌텐도 스위치 OLED",
    price: "1,000원부터 응모 가능 · 정가 280,000원",
  },
  {
    href: "/products/notebook",
    img: "/images/demo-6.jpg",
    alt: "갤럭시 워치 6 클래식",
    badge: "🎟 응모 진행 중",
    pct: 48,
    title: "갤럭시 워치 6 클래식",
    price: "1,000원부터 응모 가능 · 정가 220,000원",
  },
  {
    href: "/products/notebook",
    img: "/images/demo-7.jpg",
    alt: "소니 WH-1000XM5",
    badge: "🎟 응모 진행 중",
    pct: 56,
    title: "소니 WH-1000XM5",
    price: "1,000원부터 응모 가능 · 정가 250,000원",
  },
  {
    href: "/products/notebook",
    img: "/images/demo-8.jpg",
    alt: "아이패드 Air 5세대",
    badge: "🎟 응모 진행 중",
    pct: 30,
    title: "아이패드 Air 5세대 64GB",
    price: "1,000원부터 응모 가능 · 정가 480,000원",
  },
  {
    href: "/products/notebook",
    img: "/images/demo-9.jpg",
    alt: "소니 ZV-E10 미러리스",
    badge: "🎟 응모 진행 중",
    pct: 14,
    title: "소니 ZV-E10 미러리스",
    price: "1,000원부터 응모 가능 · 정가 380,000원",
  },
];

const SLIDES_PER_PAGE = 3;
const CAROUSEL_PAGE_COUNT = Math.ceil(FEATURED_ITEMS.length / SLIDES_PER_PAGE);

const HOT_ITEMS = [
  {
    href: "/products/iphone",
    img: "/images/iphone14pro.jpg",
    alt: "아이폰 14 Pro",
    badge: "⏰ 8시간 남음",
    title: "아이폰 14 Pro 256GB\n스페이스 블랙",
    price: "650,000원",
    pct: 76,
    count: 38,
    max: 50,
  },
  {
    href: "/products/notebook",
    img: "/images/ps5.jpg",
    alt: "플레이스테이션 5",
    badge: "⏰ 12시간 남음",
    title: "플레이스테이션 5\n디스크 에디션",
    price: "450,000원",
    pct: 92,
    count: 46,
    max: 50,
  },
  {
    href: "/products/notebook",
    img: null,
    emoji: "👟",
    badge: "⏰ 23시간 남음",
    title: "나이키 에어맥스 270\n270mm 미착용",
    price: "95,000원",
    pct: 65,
    count: 32,
    max: 50,
  },
];

const EUNGMO_ITEMS = [
  {
    href: "/products/notebook",
    emoji: "💻",
    time: "⏱ 2일 남음",
    badge: "🎟 응모 진행 중",
    title: "노트북 LG 그램 17인치",
    price: "200,000원",
    pct: 38,
    count: 19,
    max: 50,
    views: 42,
    wishes: 7,
    chats: 3,
    img: null,
  },
  {
    href: "/products/iphone",
    img: "/images/iphone14pro.jpg",
    alt: "아이폰 14 Pro",
    time: "⏱ 8시간 남음",
    badge: "🎟 응모 진행 중",
    title: "아이폰 14 Pro 256GB",
    price: "650,000원",
    pct: 76,
    count: 38,
    max: 50,
    views: 88,
    wishes: 21,
    chats: 9,
    emoji: "📱",
  },
  {
    href: "/products/notebook",
    emoji: "🎧",
    time: "⏱ 5일 남음",
    badge: "🎟 응모 진행 중",
    title: "에어팟 프로 2세대",
    price: "180,000원",
    pct: 22,
    count: 11,
    max: 50,
    views: 55,
    wishes: 8,
    chats: 2,
    img: null,
  },
  {
    href: "/products/notebook",
    img: "/images/ps5.jpg",
    alt: "플레이스테이션 5",
    time: "⏱ 12시간 남음",
    badge: "🎟 응모 진행 중",
    title: "플레이스테이션 5",
    price: "450,000원",
    pct: 92,
    count: 46,
    max: 50,
    views: 134,
    wishes: 33,
    chats: 14,
    emoji: "🎮",
  },
  {
    href: "/products/notebook",
    emoji: "⌚",
    time: "⏱ 3일 남음",
    badge: "🎟 응모 진행 중",
    title: "갤럭시 워치 6 클래식",
    price: "220,000원",
    pct: 48,
    count: 24,
    max: 50,
    views: 61,
    wishes: 10,
    chats: 4,
    img: null,
  },
  {
    href: "/products/notebook",
    emoji: "📷",
    time: "⏱ 7일 남음",
    badge: "🎟 응모 진행 중",
    title: "소니 ZV-E10 미러리스",
    price: "380,000원",
    pct: 14,
    count: 7,
    max: 50,
    views: 29,
    wishes: 6,
    chats: 1,
    img: null,
  },
  {
    href: "/products/notebook",
    emoji: "🎵",
    time: "⏱ 4일 남음",
    badge: "🎟 응모 진행 중",
    title: "소니 WH-1000XM5",
    price: "250,000원",
    pct: 56,
    count: 28,
    max: 50,
    views: 73,
    wishes: 15,
    chats: 5,
    img: null,
  },
  {
    href: "/products/notebook",
    emoji: "🖥️",
    time: "⏱ 6일 남음",
    badge: "🎟 응모 진행 중",
    title: "아이패드 Air 5세대 64GB",
    price: "480,000원",
    pct: 30,
    count: 15,
    max: 50,
    views: 47,
    wishes: 11,
    chats: 3,
    img: null,
  },
];

const KUJI_ITEMS = [
  {
    href: "/products/notebook",
    img: "/images/naoya.jpg",
    alt: "나오야 젠인 쿠지",
    time: "⏱ 3일 남음",
    badge: "🎁 쿠지 진행 중",
    title: "주술회전 나오야 젠인 쿠지",
    price: "1,000원부터 응모 가능",
    pct: 42,
    count: 21,
    max: 50,
    views: 51,
    wishes: 9,
    chats: 2,
  },
  {
    href: "/products/notebook",
    img: "/images/demo-5.jpg",
    alt: "원피스 쿠지",
    time: "⏱ 1일 남음",
    badge: "🎁 쿠지 진행 중",
    title: "원피스 A상 루피 쿠지",
    price: "1,000원부터 응모 가능",
    pct: 68,
    count: 34,
    max: 50,
    views: 77,
    wishes: 18,
    chats: 6,
  },
  {
    href: "/products/notebook",
    img: "/images/demo-6.jpg",
    alt: "귀멸의 칼날 쿠지",
    time: "⏱ 5일 남음",
    badge: "🎁 쿠지 진행 중",
    title: "귀멸의 칼날 최애의 쿠지",
    price: "1,000원부터 응모 가능",
    pct: 25,
    count: 12,
    max: 50,
    views: 33,
    wishes: 5,
    chats: 1,
  },
  {
    href: "/products/notebook",
    img: "/images/demo-7.jpg",
    alt: "드래곤볼 쿠지",
    time: "⏱ 2일 남음",
    badge: "🎁 쿠지 진행 중",
    title: "드래곤볼 갓 오브 데스티니 쿠지",
    price: "1,000원부터 응모 가능",
    pct: 55,
    count: 27,
    max: 50,
    views: 62,
    wishes: 14,
    chats: 4,
  },
  {
    href: "/products/notebook",
    img: "/images/demo-8.jpg",
    alt: "명탐정 코난 쿠지",
    time: "⏱ 6일 남음",
    badge: "🎁 쿠지 진행 중",
    title: "명탐정 코난 랜덤 쿠지",
    price: "1,000원부터 응모 가능",
    pct: 18,
    count: 9,
    max: 50,
    views: 24,
    wishes: 3,
    chats: 1,
  },
  {
    href: "/products/notebook",
    img: "/images/demo-9.jpg",
    alt: "산리오 쿠지",
    time: "⏱ 4일 남음",
    badge: "🎁 쿠지 진행 중",
    title: "산리오 캐릭터즈 쿠지",
    price: "1,000원부터 응모 가능",
    pct: 61,
    count: 30,
    max: 50,
    views: 58,
    wishes: 16,
    chats: 5,
  },
];

const SHOP_ITEMS = [
  {
    href: "/products/notebook",
    img: "/images/demo-1.jpg",
    alt: "굿즈 스티커 세트",
    badge: "🏪 즉시구매",
    title: "캐릭터 굿즈 스티커 세트",
    price: "12,000원",
    views: 19,
    wishes: 2,
    chats: 0,
  },
  {
    href: "/products/notebook",
    img: "/images/demo-2.jpg",
    alt: "아크릴 스탠드",
    badge: "🏪 즉시구매",
    title: "인기 캐릭터 아크릴 스탠드",
    price: "18,000원",
    views: 31,
    wishes: 6,
    chats: 1,
  },
  {
    href: "/products/notebook",
    img: "/images/demo-4.jpg",
    alt: "미니 피규어",
    badge: "🏪 즉시구매",
    title: "데스크용 미니 피규어",
    price: "25,000원",
    views: 27,
    wishes: 4,
    chats: 0,
  },
  {
    href: "/products/notebook",
    img: "/images/ps5.jpg",
    alt: "PS5 무선 컨트롤러",
    badge: "🏪 즉시구매",
    title: "PS5 듀얼센스 무선 컨트롤러",
    price: "78,000원",
    views: 45,
    wishes: 11,
    chats: 3,
  },
  {
    href: "/products/iphone",
    img: "/images/iphone14pro.jpg",
    alt: "아이폰 케이스",
    badge: "🏪 즉시구매",
    title: "아이폰 14 Pro 투명 케이스",
    price: "15,000원",
    views: 22,
    wishes: 3,
    chats: 0,
  },
  {
    href: "/products/notebook",
    img: "/images/demo-3.jpg",
    alt: "피규어 진열 케이스",
    badge: "🏪 즉시구매",
    title: "피규어 먼지방지 진열 케이스",
    price: "9,000원",
    views: 16,
    wishes: 1,
    chats: 0,
  },
];

function pickRandom<T>(pool: T[], n: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

type HomeItem =
  | (typeof EUNGMO_ITEMS)[number]
  | (typeof KUJI_ITEMS)[number]
  | (typeof SHOP_ITEMS)[number];

function HomeProductCard({ item }: { item: HomeItem }) {
  const pct = "pct" in item ? item.pct : undefined;

  return (
    <Link className="product-card-home" href={item.href}>
      <div className="card-img">
        {item.img ? (
          <img src={item.img} alt={item.alt} />
        ) : (
          ("emoji" in item && item.emoji) || null
        )}
        {"time" in item && item.time && (
          <div className="card-time-badge">{item.time}</div>
        )}
      </div>
      <div className="card-body">
        <div className="card-raffle-badge">{item.badge}</div>
        <div className="card-title">{item.title}</div>
        <div className="card-price">{item.price}</div>
        {pct !== undefined && "count" in item && (
          <>
            <div className="card-progress-row">
              <div className="card-progress-bar">
                <div
                  className="card-progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="card-progress-pct">{pct}%</span>
            </div>
            <div className="card-progress-label">
              <span>
                <span className="cnt">{item.count}명</span> 참여
              </span>
              <span>최대 {item.max}명</span>
            </div>
          </>
        )}
        <div className="card-stats">
          <span>👁 {item.views}</span>
          <span>🤍 {item.wishes}</span>
          <span>💬 {item.chats}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  const [eungmoItems, setEungmoItems] = useState(EUNGMO_ITEMS.slice(0, 3));
  const [kujiItems, setKujiItems] = useState(KUJI_ITEMS.slice(0, 3));
  const [shopItems, setShopItems] = useState(SHOP_ITEMS.slice(0, 3));

  useEffect(() => {
    setEungmoItems(pickRandom(EUNGMO_ITEMS, 3));
    setKujiItems(pickRandom(KUJI_ITEMS, 3));
    setShopItems(pickRandom(SHOP_ITEMS, 3));
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % CAROUSEL_PAGE_COUNT);
    }, 3000);
    return () => clearInterval(timer);
  }, [paused]);

  const prevPage = () =>
    setPage((prev) => (prev - 1 + CAROUSEL_PAGE_COUNT) % CAROUSEL_PAGE_COUNT);
  const nextPage = () => setPage((prev) => (prev + 1) % CAROUSEL_PAGE_COUNT);
  const visibleItems = FEATURED_ITEMS.slice(
    page * SLIDES_PER_PAGE,
    page * SLIDES_PER_PAGE + SLIDES_PER_PAGE,
  );

  return (
    <div className="home-neon">
      {/* 히어로 */}
      <section className="hero">
        <div className="hero-tag">🧧 응모형 이커머스 플랫폼</div>
        <h1>
          천원으로 행운을,
          <br />
          <span>천운</span>
        </h1>

        <div
          className="hero-carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            className="carousel-arrow prev"
            onClick={prevPage}
            aria-label="이전 상품"
          >
            ‹
          </button>

          <div className="hero-carousel-viewport">
            <div className="hero-square-row" key={page}>
              {visibleItems.map((item, i) => (
                <Link key={i} href={item.href} className="hero-square-card">
                  <div className="hero-square-img">
                    <img src={item.img} alt={item.alt} />
                  </div>
                  <div className="hero-square-body">
                    <div className="hero-square-badge">{item.badge}</div>
                    <div className="hero-square-title">{item.title}</div>
                    <div className="hero-square-price">{item.price}</div>
                    <div className="hero-square-progress-row">
                      <div className="hero-square-progress-bar">
                        <div
                          className="hero-square-progress-fill"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <span className="hero-square-progress-pct">
                        {item.pct}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <button
            className="carousel-arrow next"
            onClick={nextPage}
            aria-label="다음 상품"
          >
            ›
          </button>

          <div className="carousel-dots">
            {Array.from({ length: CAROUSEL_PAGE_COUNT }).map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === page ? "active" : ""}`}
                onClick={() => setPage(i)}
                aria-label={`${i + 1}번째 상품 그룹 보기`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="home-container">
        {/* 마감 임박 */}
        <div
          className="section-header"
          ref={productsRef}
          style={{ scrollMarginTop: "80px" }}
        >
          <div className="section-title">🔥 마감 임박</div>
          <div className="see-all">전체보기 →</div>
        </div>

        <div className="hot-grid">
          {HOT_ITEMS.map((item, i) => (
            <Link key={i} className="hot-card" href={item.href}>
              <div className="hot-card-img">
                {item.img ? (
                  <img src={item.img} alt={item.alt} />
                ) : (
                  <span>{item.emoji}</span>
                )}
              </div>
              <div className="hot-card-body">
                <div className="hot-badge">{item.badge}</div>
                <div
                  className="hot-card-title"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {item.title}
                </div>
                <div className="hot-card-price">{item.price}</div>
                <div className="hot-progress-row">
                  <div className="hot-progress-bar">
                    <div
                      className="hot-progress-fill"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <span className="hot-progress-pct">{item.pct}%</span>
                </div>
                <div className="hot-progress-label">
                  <span>{item.count}명 참여</span>
                  <span className="hot-time">최대 {item.max}명</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 응모상품 */}
        <div className="section-header">
          <div className="section-title">🎟 응모상품</div>
          <div className="see-all">전체보기 →</div>
        </div>

        <div className="product-grid-home">
          {eungmoItems.map((item, i) => (
            <HomeProductCard key={i} item={item} />
          ))}
        </div>

        {/* 쿠지상품 */}
        <div className="section-header">
          <div className="section-title">🎁 쿠지상품</div>
          <div className="see-all">전체보기 →</div>
        </div>

        <div className="product-grid-home">
          {kujiItems.map((item, i) => (
            <HomeProductCard key={i} item={item} />
          ))}
        </div>

        {/* 상점 */}
        <div className="section-header">
          <div className="section-title">🏪 상점</div>
          <div className="see-all">전체보기 →</div>
        </div>

        <div className="product-grid-home">
          {shopItems.map((item, i) => (
            <HomeProductCard key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
