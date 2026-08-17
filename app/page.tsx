"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { getRaffleProducts, type RaffleProductResponse } from "@/lib/api";

// 마감임박 섹션과 히어로 캐러셀은 아직 "준비중" 상태로 표시 (응모상품 섹션만 백엔드 연동됨)

function formatRaffleCountdown(seconds: number): string {
  if (seconds <= 0) return "마감";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)} 남음` : `${pad(m)}:${pad(s)} 남음`;
}

function RaffleHomeCard({ rp, remainingSeconds }: { rp: RaffleProductResponse; remainingSeconds: number }) {
  return (
    <Link className="product-card-home" href="/eungmo">
      <div className="card-img">
        {rp.image_url && <img src={rp.image_url} alt={rp.product_name} />}
        <div className="card-time-badge">⏱ {formatRaffleCountdown(remainingSeconds)}</div>
      </div>
      <div className="card-body">
        <div className="card-raffle-badge">🎟 응모 진행 중</div>
        <div className="card-title">{rp.product_name}</div>
        <div className="card-price">{rp.price_krw.toLocaleString()} 운포인트</div>
        <div className="card-progress-label" style={{ marginBottom: 0 }}>
          <span>응모권 {rp.ticket_price.toLocaleString()} 운포인트</span>
          <span>최대 {rp.total_slots.toLocaleString()}명</span>
        </div>
      </div>
    </Link>
  );
}

const KUJI_ITEMS = [
  {
    href: "/products/notebook",
    img: "/images/naoya.jpg",
    alt: "나오야 젠인 쿠지",
    badge: "🎁 쿠지 진행 중",
    title: "주술회전 나오야 젠인 쿠지",
    price: "10,000 운포인트",
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
    badge: "🎁 쿠지 진행 중",
    title: "원피스 A상 루피 쿠지",
    price: "10,000 운포인트",
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
    badge: "🎁 쿠지 진행 중",
    title: "귀멸의 칼날 최애의 쿠지",
    price: "10,000 운포인트",
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
    badge: "🎁 쿠지 진행 중",
    title: "드래곤볼 갓 오브 데스티니 쿠지",
    price: "10,000 운포인트",
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
    badge: "🎁 쿠지 진행 중",
    title: "명탐정 코난 랜덤 쿠지",
    price: "10,000 운포인트",
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
    badge: "🎁 쿠지 진행 중",
    title: "산리오 캐릭터즈 쿠지",
    price: "10,000 운포인트",
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

type HomeItem = (typeof KUJI_ITEMS)[number] | (typeof SHOP_ITEMS)[number];

function HomeProductCard({ item }: { item: HomeItem }) {
  const pct = "pct" in item ? item.pct : undefined;

  return (
    <Link className="product-card-home" href={item.href}>
      <div className="card-img">
        <img src={item.img} alt={item.alt} />
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
  const productsRef = useRef<HTMLDivElement>(null);

  const [kujiItems, setKujiItems] = useState(KUJI_ITEMS.slice(0, 3));
  const [shopItems, setShopItems] = useState(SHOP_ITEMS.slice(0, 3));

  useEffect(() => {
    setKujiItems(pickRandom(KUJI_ITEMS, 3));
    setShopItems(pickRandom(SHOP_ITEMS, 3));
  }, []);

  const [raffleProducts, setRaffleProducts] = useState<RaffleProductResponse[]>([]);
  const [raffleFetchedAt, setRaffleFetchedAt] = useState(0);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    getRaffleProducts("open")
      .then((list) => {
        setRaffleProducts(list);
        setRaffleFetchedAt(Date.now());
        setNowTick(Date.now());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (raffleProducts.length === 0) return;
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [raffleProducts.length]);

  const elapsedSeconds = raffleFetchedAt ? Math.floor((nowTick - raffleFetchedAt) / 1000) : 0;
  const openRaffleItems = raffleProducts
    .map((rp) => ({ rp, remainingSeconds: Math.max(0, rp.remaining_seconds - elapsedSeconds) }))
    .filter((item) => item.remainingSeconds > 0)
    .slice(0, 3);

  return (
    <div>
      {/* 히어로 */}
      <section className="hero">
        <div className="hero-tag">🧧 응모형 이커머스 플랫폼</div>
        <h1>
          천원으로 행운을,
          <br />
          <span>천운</span>
        </h1>

        <div className="hero-carousel">
          <div className="coming-soon-box large">
            <div className="emoji">🎟</div>
            <div className="title">응모 상품을 준비하고 있어요</div>
            <div className="desc">조금만 기다려주세요, 곧 만나요!</div>
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

        <div className="coming-soon-box">
          <div className="emoji">🔥</div>
          <div className="title">상품 준비중</div>
          <div className="desc">마감 임박 응모 상품이 곧 올라올 예정이에요</div>
        </div>

        {/* 응모상품 */}
        <div className="section-header">
          <div className="section-title"><span className="emoji">🎟</span> 응모상품</div>
          <Link className="see-all" href="/eungmo">전체보기 →</Link>
        </div>

        {openRaffleItems.length === 0 ? (
          <div className="coming-soon-box">
            <div className="emoji">🎟</div>
            <div className="title">상품 준비중</div>
            <div className="desc">응모 상품을 준비하고 있어요</div>
          </div>
        ) : (
          <div className="product-grid-home">
            {openRaffleItems.map(({ rp, remainingSeconds }) => (
              <RaffleHomeCard key={rp.raffle_product_id} rp={rp} remainingSeconds={remainingSeconds} />
            ))}
          </div>
        )}

        {/* 쿠지상품 */}
        <div className="section-header">
          <div className="section-title"><span className="emoji">🎁</span> 쿠지상품</div>
          <div className="see-all">전체보기 →</div>
        </div>

        <div className="product-grid-home">
          {kujiItems.map((item, i) => (
            <HomeProductCard key={i} item={item} />
          ))}
        </div>

        {/* 상점 */}
        <div className="section-header">
          <div className="section-title"><span className="emoji">🏪</span> 상점</div>
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
