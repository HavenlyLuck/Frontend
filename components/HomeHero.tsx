"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LightningIcon, TicketIcon } from "@phosphor-icons/react";
import { getRaffleProducts, type RaffleProductResponse } from "@/lib/api";
import { parseServerTime } from "@/lib/raffle";
import CardImage from "./CardImage";
import LogoMark from "./LogoMark";

/*
 * 메인 히어로 — 처음 온 사람이 "천 원 응모권 → 다 팔리면 추첨 → 한 명 당첨" 구조를 바로 알아보게 한다.
 * 왼쪽: 한 줄 소개 + 3단계 / 오른쪽: 지금 진행 중인 실제 응모 상품 한 개 (없으면 "곧 열려요" 카드)
 *
 * 나중에 신상품 소개 같은 화면을 옆으로 넘겨 보여줄 예정이라, 지금 화면을 슬라이드 한 장(.home-hero-slide)으로 만들어 뒀다.
 * 슬라이드를 늘릴 땐 .home-hero 안에 .home-hero-slide 를 더 넣고 넘김 버튼만 붙이면 된다.
 */

interface Props {
  // 지금 진행 중인 응모 중 대표로 보여줄 것. 없으면 null
  featured: { rp: RaffleProductResponse; countdown: string } | null;
  // 응모 목록을 다 불러왔는지 — 불러오는 동안엔 카드 자리를 비워 둔다 (빈 카드가 잠깐 떴다 바뀌지 않게)
  loaded: boolean;
}

export default function HomeHero({ featured, loaded }: Props) {
  return (
    <section className="home-hero">
      <div className="home-hero-slide">
        <div className="home-hero-copy">
          <h1>
            천원 한 장,
            <br />
            <span>천운</span>을 뽑다.
          </h1>
          <ol className="home-hero-steps">
            <li><span className="num">1</span><span><b>1,000원</b>짜리 응모권을 사요</span></li>
            <li><span className="num">2</span><span>응모권이 <b>다 팔리면 바로 추첨</b>해요</span></li>
            <li><span className="num">3</span><span>한 명이 상품을 받고, <b>낙첨은 쌀포인트로 환급</b>돼요</span></li>
          </ol>
          <div className="home-hero-actions">
            <Link className="hero-cta" href="/eungmo">응모 보러 가기</Link>
            <Link className="home-hero-more" href="/guide">자세히 알아보기 →</Link>
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
    </section>
  );
}

function FeaturedRaffle({ rp, countdown }: { rp: RaffleProductResponse; countdown: string }) {
  const pct = rp.total_slots > 0 ? Math.min(100, Math.round((rp.sold_slots / rp.total_slots) * 100)) : 0;
  return (
    <Link className="home-hero-card" href={`/eungmo/${rp.raffle_product_id}`}>
      <div className="home-hero-card-head">
        <span className="home-hero-live"><i aria-hidden="true" /> 지금 진행 중인 응모</span>
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
      <p className="home-hero-empty-title">곧 새 응모가 열려요</p>
      <p className="home-hero-empty-sub">새 응모가 열리면 여기에 바로 표시돼요.</p>
    </div>
  );
}

// ── 당첨 소식 띠 ──

// 닉네임 가운데를 가린다: 럭키별 → 럭*별, 구름 → 구*
function maskNickname(name: string): string {
  const chars = [...name];
  if (chars.length <= 1) return name;
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}${"*".repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

function timeAgo(ms: number): string {
  const min = Math.max(1, Math.floor((Date.now() - ms) / 60000));
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

const TICKER_MAX = 10;

// 히어로 아래 옆으로 흐르는 최근 당첨 소식. 추첨이 끝난 응모가 하나도 없으면 아무것도 그리지 않는다.
// 서버가 당첨자 닉네임(winner_nickname)을 주면 가려서 보여주고, 아직 없으면 응모 번호로 대신한다.
export function WinnerTicker() {
  const [wins, setWins] = useState<RaffleProductResponse[]>([]);

  useEffect(() => {
    getRaffleProducts("completed")
      .then((list) =>
        setWins(
          list
            .filter((p) => p.winner_entry_number != null && p.drawn_at)
            .sort((a, b) => parseServerTime(b.drawn_at!) - parseServerTime(a.drawn_at!))
            .slice(0, TICKER_MAX),
        ),
      )
      .catch(() => {});
  }, []);

  if (wins.length === 0) return null;

  // 화면 폭보다 짧으면 흐르다 끊겨 보이니, 한 바퀴 분량이 넉넉해질 때까지 되풀이해 채운다
  const lap = Array.from({ length: Math.ceil(8 / wins.length) }, () => wins).flat();
  const renderLap = (hidden: boolean) => (
    <div className="win-ticker-lap" aria-hidden={hidden || undefined}>
      {lap.map((p, i) => (
        <span className="win-ticker-item" key={`${p.raffle_product_id}-${i}`}>
          <LightningIcon size={13} weight="fill" />
          <span className="who">{p.winner_nickname ? `${maskNickname(p.winner_nickname)}님` : `${p.winner_entry_number}번 응모자`}</span>
          <span className="what">{p.product_name}</span>
          <b>당첨</b>
          <span className="when">{timeAgo(parseServerTime(p.drawn_at!))}</span>
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
