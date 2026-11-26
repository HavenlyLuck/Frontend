"use client";

import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CaretLeftIcon, CaretRightIcon, GiftIcon, LightningIcon, TicketIcon } from "@phosphor-icons/react";
import { getKujiRecentWins, getRaffleProducts, type KujiRecentWin, type RaffleProductResponse } from "@/lib/api";
import { parseServerTime } from "@/lib/raffle";
import CardImage from "./CardImage";
import { maskNickname } from "@/lib/mask";
import LogoMark from "./LogoMark";

// 오픈 기념 배너의 픽셀 말풍선 글씨 — 갈무리11 Bold (OFL 무료 폰트, app/fonts/Galmuri-OFL.md)
const pixelFont = localFont({
  src: "../app/fonts/Galmuri11-Bold.woff2",
  display: "swap",
  preload: false,
});

/*
 * 메인 히어로 — 옆으로 넘기는 배너 (2026-11 오픈)
 *  1. 오픈 기념 혜택 (쌀 응모권) → 응모 보러 가기
 *  2. 서비스 소개 + 지금 진행 중인 실제 응모 상품 한 개 (없으면 "새 응모 준비 중" 카드)
 *  3. 함께 만드는 천운 (후기/문의) → 후기/문의 남기기
 * 4초마다 자동으로 넘어간다. 손가락으로 누르고 있거나 키보드(Tab)로 배너 안에 들어와 있을 때만 멈춘다.
 * (마우스를 올렸을 때·마우스로 점을 누른 뒤에는 멈추지 않는다 — PC에선 배너가 화면을 거의 채워 마우스가 늘 위에 있어서 "안 넘어간다"고 느껴졌음)
 * 모바일은 손가락으로 밀어 넘긴다. 움직임 줄이기 설정이면 미끄러지는 효과 없이 바로 바뀐다(CSS).
 * 슬라이드를 늘리거나 뺄 땐 아래 slides 배열만 고치면 된다.
 * '응모 보러 가기' 클릭은 MetaPixel 컴포넌트가 버튼 글자로 찾아 Lead를 보내므로 여기서 따로 할 일 없음.
 */

const AUTO_MS = 4000;

interface Props {
  // 지금 진행 중인 응모 중 대표로 보여줄 것. 없으면 null
  featured: { rp: RaffleProductResponse; countdown: string } | null;
  // 응모 목록을 다 불러왔는지 — 불러오는 동안엔 카드 자리를 비워 둔다 (빈 카드가 잠깐 떴다 바뀌지 않게)
  loaded: boolean;
}

export default function HomeHero({ featured, loaded }: Props) {
  const slides: { key: string; label: string; node: ReactNode }[] = [
    { key: "open", label: "천운 오픈 기념 혜택", node: <OpenEventSlide /> },
    { key: "raffle", label: "천운 소개와 진행 중인 응모", node: <RaffleSlide featured={featured} loaded={loaded} /> },
    { key: "feedback", label: "함께 만드는 천운", node: <FeedbackSlide /> },
  ];
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  // 자동 넘김 — 손으로 넘기면 index가 바뀌어 4초를 처음부터 다시 센다
  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState === "visible") go(index + 1);
    }, AUTO_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, go]);

  // 보이지 않는 슬라이드의 링크·버튼은 Tab으로 들어가지 않게 (React 18은 inert 속성을 직접 못 넘겨서 여기서 붙인다)
  useEffect(() => {
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === index) el.removeAttribute("inert");
      else el.setAttribute("inert", "");
    });
  }, [index]);

  return (
    <section
      className="home-hero"
      aria-roledescription="carousel"
      aria-label="메인 배너"
      onFocus={(e) => { if (e.target.matches(":focus-visible")) setPaused(true); }}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        setPaused(false);
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="home-hero-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <div
            key={s.key}
            ref={(el) => { slideRefs.current[i] = el; }}
            className="home-hero-page"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}: ${s.label}`}
            aria-hidden={i !== index}
          >
            {s.node}
          </div>
        ))}
      </div>

      <button type="button" className="home-hero-arrow is-prev" aria-label="이전 배너" onClick={() => go(index - 1)}>
        <CaretLeftIcon size={20} weight="bold" />
      </button>
      <button type="button" className="home-hero-arrow is-next" aria-label="다음 배너" onClick={() => go(index + 1)}>
        <CaretRightIcon size={20} weight="bold" />
      </button>
      <div className="home-hero-dots">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={i === index ? "is-active" : undefined}
            aria-label={`${i + 1}번째 배너: ${s.label}`}
            aria-current={i === index || undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </section>
  );
}

// ── 1. 오픈 기념 ──
function OpenEventSlide() {
  return (
    <div className="home-promo is-open">
      <div className="home-promo-head">
        <span className="home-promo-badge">GRAND OPEN</span>
        <h2 className="home-promo-title">
          <span>천운</span> 오픈 기념!
        </h2>
        <p className="home-promo-sub">오픈을 기념해 이런 혜택을 준비했어요</p>
      </div>

      <div className="home-promo-art">
        <Image
          src="/images/banner/open-shelf.png"
          alt="텅 빈 진열장 앞에서 고개 숙여 인사하는 픽셀 캐릭터들"
          width={1200}
          height={846}
          sizes="(max-width: 860px) 100vw, 600px"
          priority
        />
        <div className={`pixel-bubble ${pixelFont.className}`}>
          오픈 초기라 상품이 아직 적어요 ㅜㅜ
          <br />
          <em>열심히 채울게요!</em>
        </div>      </div>

      <ul className="home-promo-body home-promo-benefits">
        <li>회원가입만 해도 <b>쌀 응모권 1장</b> <small>12/26까지</small></li>
        <li><span className="pc-only">친구를 초대하고, 친구가 첫 결제하면</span><span className="m-only">친구 초대 후 친구가 첫 결제하면</span> <b>쌀 응모권 1장</b></li>
      </ul>

      <div className="home-promo-cta">
        <Link className="hero-cta" href="/eungmo">응모 보러 가기</Link>
      </div>
      <p className="home-promo-note"><span className="pc-only">※ 쌀 응모권은 12/26까지 가입 시 1장 지급 · 친구 초대 응모권은 초대한 친구의 첫 결제 후 지급돼요</span><span className="m-only">※ 쌀 응모권은 12/26까지 가입 시 1장 · 친구 초대 응모권은 친구의 첫 결제 후 지급</span></p>
    </div>
  );
}

// ── 3. 함께 만드는 천운 ──
function FeedbackSlide() {
  const desc = (
    <>
      갖고 싶은 상품, 보고 싶은 콘텐츠, 불편한 점이나 오류까지
      <br />
      <b>후기/문의</b>에 편하게 남겨주세요.
    </>
  );
  return (
    <div className="home-promo is-feedback">
      <div className="home-promo-head">
        <span className="home-promo-badge">함께 만드는 천운</span>
        <h2 className="home-promo-title">
          천운은 여러분과
          <br />
          <span>함께</span> 만들어 갑니다!
        </h2>
        <p className="home-promo-sub is-desktop">{desc}</p>
      </div>

      <div className="home-promo-art">
        <Image
          src="/images/banner/feedback-cloud.png"
          alt="메가폰을 든 천운 구름 캐릭터와 의견 말풍선, 우체통, 선물 상자"
          width={1100}
          height={992}
          sizes="(max-width: 860px) 100vw, 520px"
        />
      </div>

      <div className="home-promo-body home-promo-gift">
        <p className="home-promo-gift-desc">{desc}</p>
        <p className="home-promo-gift-line">
          <GiftIcon className="home-promo-gift-icon" size={30} weight="duotone" aria-hidden="true" />
          <span>
            좋은 의견을 주신 분께는 <b>감사의 마음을 담아</b>
            <br />
            <em>소정의 선물</em>을 드려요
          </span>
        </p>
      </div>

      <div className="home-promo-cta">
        <Link className="hero-cta" href="/review">후기/문의 남기기 →</Link>
      </div>
      <p className="home-promo-note"><span className="pc-only">※ 선물은 내부 검토 후 선정된 분께 드리며, 종류는 사정에 따라 달라질 수 있어요</span><span className="m-only">※ 선물은 내부 검토 후 선정된 분께 드리며, 종류는 달라질 수 있어요</span></p>
    </div>
  );
}

// ── 2. 서비스 소개 + 진행 중인 응모 ──
function RaffleSlide({ featured, loaded }: Props) {
  return (
      <div className="home-hero-slide">
        <div className="home-hero-copy">
          <h1>
            천원 한 장,
            <br />
            <span>천운</span>을 뽑다.
          </h1>
          <ul className="home-hero-steps">
            <li><span>응모권 1장 <b>1,000원</b></span></li>
            <li><span><b>전량 판매 시 즉시 추첨</b></span></li>
            <li><span>당첨자 1명 · <b>낙첨 시 쌀포인트 환급</b></span></li>
          </ul>
          <div className="home-hero-actions">
            <Link className="hero-cta" href="/eungmo">응모 보러 가기</Link>
            <Link className="home-hero-more" href="/guide">이용 방법 →</Link>
          </div>
        </div>

        {!loaded ? (
          <div className="home-hero-card is-loading" aria-hidden="true" />
        ) : featured ? (
          <FeaturedRaffle rp={featured.rp} countdown={featured.countdown} />
        ) : (
          <EmptyRaffle />
        )}
      </div>
  );
}

function FeaturedRaffle({ rp, countdown }: { rp: RaffleProductResponse; countdown: string }) {
  const pct = rp.total_slots > 0 ? Math.min(100, Math.round((rp.sold_slots / rp.total_slots) * 100)) : 0;
  return (
    <Link className="home-hero-card" href={`/eungmo/${rp.raffle_product_id}`}>
      <div className="home-hero-card-head">
        <span className="home-hero-live"><i aria-hidden="true" /> 진행 중인 응모</span>
        <span className="home-hero-time">{countdown}</span>
      </div>
      <div className="home-hero-card-img card-img">
        {rp.image_url && <CardImage src={rp.image_url} alt={rp.product_name} />}
      </div>
      <div className="home-hero-card-body">
        <div className="home-hero-card-name">{rp.product_name}</div>
        <div className="home-hero-card-price">
          {rp.ticket_price.toLocaleString()}원 <small>/ 응모권 1장</small>
        </div>
        <div className="home-hero-bar" role="img" aria-label={`응모권 ${rp.total_slots}장 중 ${rp.sold_slots}장 판매`}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <div className="home-hero-card-meta">
          <span><b>{rp.sold_slots.toLocaleString()}</b> / {rp.total_slots.toLocaleString()}장 판매</span>
          <span><b>{rp.remaining_slots.toLocaleString()}장</b> 남으면 추첨</span>
        </div>
        <span className="home-hero-card-cta"><TicketIcon size={16} weight="fill" /> {rp.ticket_price.toLocaleString()}원으로 응모하기</span>
      </div>
    </Link>
  );
}

// 진행 중인 응모가 하나도 없을 때 — 상품이 바뀌는 사이 잠깐 비는 순간에만 보이는 자리라 단순하게 둔다
function EmptyRaffle() {
  return (
    <div className="home-hero-card is-empty">
      <LogoMark className="home-hero-empty-mark" />
      <p className="home-hero-empty-title">새 응모 준비 중</p>
      <p className="home-hero-empty-sub">응모가 열리면 이곳에 표시됩니다.</p>
    </div>
  );
}

// ── 당첨 소식 띠 ──

function timeAgo(ms: number): string {
  const min = Math.max(1, Math.floor((Date.now() - ms) / 60000));
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

const TICKER_MAX = 10;

// 띠 한 칸 — 응모·쿠지를 같은 모양으로 맞춘 것
interface TickerWin {
  key: string;
  kind: "응모" | "쿠지";
  who: string;
  what: string;
  at: number;
  lastOne?: boolean;
}

const kujiGradeLabel = (w: KujiRecentWin) =>
  w.is_last_one ? "라스트원상" : w.grade.endsWith("상") ? w.grade : `${w.grade}상`;

// 히어로 아래 옆으로 흐르는 최근 당첨 소식 — 응모 당첨 + 쿠지 상위상·라스트원상을 최신순으로 섞어 10개.
// 이름 앞에 [응모]/[쿠지]를 붙여 구분한다. 둘 다 하나도 없으면 아무것도 그리지 않는다.
// 응모: 서버가 당첨자 닉네임(winner_nickname)을 주면 가려서 보여주고, 아직 없으면 응모 번호로 대신한다.
// 쿠지: GET /kuji/recent-wins (실패하면 응모만 보인다)
export function WinnerTicker() {
  const [wins, setWins] = useState<TickerWin[]>([]);

  useEffect(() => {
    const raffle = getRaffleProducts("completed")
      .then((list) =>
        list
          .filter((p) => p.winner_entry_number != null && p.drawn_at)
          .map<TickerWin>((p) => ({
            key: `r${p.raffle_product_id}`,
            kind: "응모",
            who: p.winner_nickname ? `${maskNickname(p.winner_nickname)}님` : `${p.winner_entry_number}번 응모자`,
            what: p.product_name,
            at: parseServerTime(p.drawn_at!),
          })),
      )
      .catch(() => [] as TickerWin[]);
    const kuji = getKujiRecentWins(TICKER_MAX)
      .then((list) =>
        // 상위상(A상 등)·라스트원상만 — 서버가 하위상을 섞어 보내도 여기서 거른다
        list.filter((w) => w.is_last_one || w.tier === "upper").map<TickerWin>((w, i) => ({
          key: `k${w.kuji_set_id}-${i}`,
          kind: "쿠지",
          who: w.winner_nickname ? `${maskNickname(w.winner_nickname)}님` : "누군가",
          what: `${w.kuji_title} ${kujiGradeLabel(w)}`,
          at: parseServerTime(w.drawn_at),
          lastOne: w.is_last_one,
        })),
      )
      .catch(() => [] as TickerWin[]);
    Promise.all([raffle, kuji]).then(([a, b]) =>
      setWins([...a, ...b].sort((x, y) => y.at - x.at).slice(0, TICKER_MAX)),
    );
  }, []);

  if (wins.length === 0) return null;
  // 화면 폭보다 짧으면 흐르다 끊겨 보이니, 한 바퀴 분량이 넉넉해질 때까지 되풀이해 채운다
  const lap = Array.from({ length: Math.ceil(8 / wins.length) }, () => wins).flat();
  const renderLap = (hidden: boolean) => (
    <div className="win-ticker-lap" aria-hidden={hidden || undefined}>
      {lap.map((p, i) => (
        <span className={`win-ticker-item${p.lastOne ? " is-last-one" : ""}`} key={`${p.key}-${i}`}>
          <LightningIcon size={13} weight="fill" />
          <span className="kind">[{p.kind}]</span>
          <span className="who">{p.who}</span>
          <span className="what">{p.what}</span>
          <b>당첨</b>
          <span className="when">{timeAgo(p.at)}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="win-ticker" aria-label="최근 당첨 소식">
      <span className="win-ticker-label">당첨 소식</span>
      <div className="win-ticker-view">
        <div className="win-ticker-track" style={{ animationDuration: `${lap.length * 5}s` }}>
          {renderLap(false)}
          {renderLap(true)}
        </div>
      </div>
    </div>
  );
}
