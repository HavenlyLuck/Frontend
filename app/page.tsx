"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  EyeIcon,
  ChatCircleIcon,
  GiftIcon,
  HeartIcon,
  StorefrontIcon,
  TicketIcon,
} from "@phosphor-icons/react";
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
  const soldPct = rp.total_slots > 0 ? Math.min(100, Math.round((rp.sold_slots / rp.total_slots) * 100)) : 0;
  return (
    <Link className="product-card-home" href={`/eungmo/${rp.raffle_product_id}`}>
      <div className="card-img">
        {rp.image_url && <img src={rp.image_url} alt={rp.product_name} />}
        <div className="card-time-badge">⏱ {formatRaffleCountdown(remainingSeconds)}</div>
      </div>
      <div className="card-body">
        <div className="card-raffle-badge"><TicketIcon size={11} weight="fill" /> 응모 진행 중</div>
        <div className="card-title">{rp.product_name}</div>
        <div className="card-price">{rp.ticket_price.toLocaleString()} 운포인트 <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)' }}>/ 장당</span></div>
        <div className="card-progress-row">
          <div className="card-progress-bar">
            <div className="card-progress-fill" style={{ width: `${soldPct}%` }} />
          </div>
          <span className="card-progress-pct">{soldPct}%</span>
        </div>
        <div className="card-progress-label">
          <span><span className="cnt">{rp.sold_slots.toLocaleString()}장</span> 판매</span>
          <span>총 {rp.total_slots.toLocaleString()}장</span>
        </div>
      </div>
    </Link>
  );
}

const KUJI_ITEMS = [
  {
    href: "/kuji/naoya",
    img: "/images/naoya.jpg",
    alt: "나오야 젠인 쿠지",
    badge: "쿠지 진행 중",
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
    href: "/kuji/onepiece",
    img: "/images/demo-5.jpg",
    alt: "원피스 쿠지",
    badge: "쿠지 진행 중",
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
    href: "/kuji/kimetsu",
    img: "/images/demo-6.jpg",
    alt: "귀멸의 칼날 쿠지",
    badge: "쿠지 진행 중",
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
    href: "/kuji/dragonball",
    img: "/images/demo-7.jpg",
    alt: "드래곤볼 쿠지",
    badge: "쿠지 진행 중",
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
    href: "/kuji/conan",
    img: "/images/demo-8.jpg",
    alt: "명탐정 코난 쿠지",
    badge: "쿠지 진행 중",
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
    href: "/kuji/sanrio",
    img: "/images/demo-9.jpg",
    alt: "산리오 쿠지",
    badge: "쿠지 진행 중",
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
    href: "/shop/sticker-set",
    img: "/images/demo-1.jpg",
    alt: "굿즈 스티커 세트",
    badge: "즉시구매",
    title: "캐릭터 굿즈 스티커 세트",
    price: "12,000원",
    views: 19,
    wishes: 2,
    chats: 0,
  },
  {
    href: "/shop/acrylic-stand",
    img: "/images/demo-2.jpg",
    alt: "아크릴 스탠드",
    badge: "즉시구매",
    title: "인기 캐릭터 아크릴 스탠드",
    price: "18,000원",
    views: 31,
    wishes: 6,
    chats: 1,
  },
  {
    href: "/shop/mini-figure",
    img: "/images/demo-4.jpg",
    alt: "미니 피규어",
    badge: "즉시구매",
    title: "데스크용 미니 피규어",
    price: "25,000원",
    views: 27,
    wishes: 4,
    chats: 0,
  },
  {
    href: "/shop/ps5-controller",
    img: "/images/ps5.jpg",
    alt: "PS5 무선 컨트롤러",
    badge: "즉시구매",
    title: "PS5 듀얼센스 무선 컨트롤러",
    price: "78,000원",
    views: 45,
    wishes: 11,
    chats: 3,
  },
  {
    href: "/shop/iphone-case",
    img: "/images/iphone14pro.jpg",
    alt: "아이폰 케이스",
    badge: "즉시구매",
    title: "아이폰 14 Pro 투명 케이스",
    price: "15,000원",
    views: 22,
    wishes: 3,
    chats: 0,
  },
  {
    href: "/shop/figure-case",
    img: "/images/demo-3.jpg",
    alt: "피규어 진열 케이스",
    badge: "즉시구매",
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
  const isKuji = pct !== undefined;

  return (
    <Link className={`product-card-home${isKuji ? "" : " is-shop"}`} href={item.href}>
      <div className="card-img">
        <img src={item.img} alt={item.alt} />
      </div>
      <div className="card-body">
        <div className="card-raffle-badge">
          {isKuji ? <GiftIcon size={11} weight="fill" /> : <StorefrontIcon size={11} weight="fill" />}
          {item.badge}
        </div>
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
          <span><EyeIcon size={12} /> {item.views}</span>
          <span><HeartIcon size={12} /> {item.wishes}</span>
          <span><ChatCircleIcon size={12} /> {item.chats}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [kujiItems, setKujiItems] = useState(KUJI_ITEMS.slice(0, 4));
  const [shopItems, setShopItems] = useState(SHOP_ITEMS.slice(0, 4));

  useEffect(() => {
    setKujiItems(pickRandom(KUJI_ITEMS, 4));
    setShopItems(pickRandom(SHOP_ITEMS, 4));
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
    .slice(0, 4);
  // 히어로 사진: 지금 열린 응모 상품 이미지를 자동으로 사용
  const heroImages = openRaffleItems.map(({ rp }) => rp.image_url).filter((u): u is string => !!u).slice(0, 2);

  return (
    <div>
      {/* 히어로 — 박스아트 포스터 */}
      <section className="hero">
        <div className="hero-copy">
          <h1>
            천원 한 장,
            <br />
            <span>천운</span>을 뽑다.
          </h1>
          <p className="hero-sub">
            모든 티켓이 팔리면 바로 추첨해요.
            <br />
            1,000 운포인트부터 참여할 수 있어요.
          </p>
          <Link className="hero-cta" href="/eungmo">응모 보러 가기</Link>
        </div>
        <div className="hero-box" aria-hidden="true">
          {heroImages.length === 0 ? (
            <div className="hero-ticket">
              <div className="hero-ticket-main">
                <span className="hero-ticket-label">ADMIT ONE</span>
                <span className="hero-ticket-price">1,000<small>운포인트</small></span>
                <span className="hero-ticket-note">한 장으로 응모</span>
              </div>
              <div className="hero-ticket-stub">천운</div>
            </div>
          ) : heroImages.length === 1 ? (
            <img className="hero-box-img hero-box-img-solo" src={heroImages[0]} alt="" />
          ) : (
            <>
              <img className="hero-box-img hero-box-img-a" src={heroImages[1]} alt="" />
              <img className="hero-box-img hero-box-img-b" src={heroImages[0]} alt="" />
            </>
          )}
        </div>
      </section>

      <div className="hero-strip">
        <span>티켓 한 장 <b>1,000P</b>부터</span>
        <span>전량 판매 시 <b>자동 추첨</b></span>
        <span>당첨 상품은 <b>보관함</b>으로</span>
      </div>

      <div className="home-container">
        {/* 응모상품 */}
        <div className="section-header">
          <div className="section-title"><TicketIcon size={18} weight="fill" color="var(--accent)" /> 응모상품</div>
          <Link className="see-all" href="/eungmo">전체보기 →</Link>
        </div>

        {openRaffleItems.length === 0 ? (
          <div className="soon-strip">
            <span className="soon-dot" />
            지금 열린 응모가 없어요. 새 응모가 열리면 여기에 표시돼요.
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
          <div className="section-title"><GiftIcon size={18} weight="fill" color="var(--accent)" /> 쿠지상품</div>
          <Link className="see-all" href="/kuji">전체보기 →</Link>
        </div>

        <div className="product-grid-home">
          {kujiItems.map((item, i) => (
            <HomeProductCard key={i} item={item} />
          ))}
        </div>

        {/* 상점 */}
        <div className="section-header">
          <div className="section-title"><StorefrontIcon size={18} weight="fill" color="var(--accent)" /> 상점</div>
          <Link className="see-all" href="/shop">전체보기 →</Link>
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
