"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CrownIcon, SparkleIcon, TrophyIcon } from "@phosphor-icons/react";
import PixelAvatar from "@/components/PixelAvatar";
import { getCurrentContest, type ContestSeason } from "@/lib/avatarContest";
import { getIdeaContest, type IdeaContestCurrent } from "@/lib/ideaContest";
import { AVATAR_CONTEST_OPEN } from "@/lib/features";

// 아바타로 즐기는 컨텐츠 모음 — 앞으로 생길 컨텐츠도 여기에 카드로 추가한다
export default function ContentsPage() {
  const [contest, setContest] = useState<ContestSeason | null>(null);
  const [idea, setIdea] = useState<IdeaContestCurrent | null>(null);

  useEffect(() => {
    getIdeaContest()
      .then(setIdea)
      .catch(() => {});
    if (AVATAR_CONTEST_OPEN)
      getCurrentContest()
        .then(setContest)
        .catch(() => {});
  }, []);

  const leader = contest
    ? [...contest.entries].sort((a, b) => b.votes - a.votes)[0]
    : null;

  return (
    <div className="home-container" style={{ maxWidth: 960 }}>
      <div className="section-title" style={{ marginBottom: 20 }}>
        <SparkleIcon size={18} weight="fill" color="var(--accent)" /> 컨텐츠
      </div>

      <div className="contents-grid">
        <Link href="/contents/idea-contest" className="contents-card is-live">
          <div className="contents-card-art">
            {/* 검은 바탕 그림이라 screen으로 겹쳐 바탕을 지운다 */}
            <img
              src="/images/idea-contest.png"
              alt=""
              width={150}
              height={150}
              style={{ mixBlendMode: "screen", borderRadius: 0 }}
            />
          </div>
          <div className="contents-card-body">
            <span className="contents-badge is-live">매주 진행</span>
            <div className="contents-card-title">
              천운 아바타 아이디어 공모전
            </div>
            <div className="contents-card-desc">
              여러분들의 아이디어를 실제로 구현해드립니다!
              <br />
              매주 3명을 뽑아 1등은 쌀 응모권 10장, 2등은 7장, 3등은 5장을 드려요.
            </div>
            {idea && (
              <div className="contents-card-meta">
                이번 주 응모 {idea.entries.length}개
              </div>
            )}
          </div>
        </Link>

        {AVATAR_CONTEST_OPEN ? (
          <Link
            href="/contents/avatar-contest"
            className="contents-card is-live"
          >
            <div className="contents-card-art">
              {leader ? (
                <PixelAvatar config={leader.avatar_config} size={112} alt="" />
              ) : (
                <TrophyIcon size={48} weight="fill" />
              )}
              <CrownIcon
                className="contents-card-crown"
                size={28}
                weight="fill"
              />
            </div>
            <div className="contents-card-body">
              <span className="contents-badge is-live">진행 중</span>
              <div className="contents-card-title">아바타 자랑 대회</div>
              <div className="contents-card-desc">
                내 캐릭터를 뽐내고 투표를 받아보세요. 이번 주 1·2·3등에게 수상자
                전용 왕관과 쌀 응모권을 드려요.
              </div>
              {contest && (
                <div className="contents-card-meta">
                  참가 {contest.entries.length}명 · 현재 1위 {leader?.nickname}
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className="contents-card is-soon" aria-disabled="true">
            <div className="contents-card-art">
              <TrophyIcon size={44} weight="light" />
            </div>
            <div className="contents-card-body">
              <span className="contents-badge">준비 중</span>
              <div className="contents-card-title">아바타 자랑 대회</div>
              <div className="contents-card-desc">
                내 캐릭터를 뽐내고 투표를 받는 대회를 준비하고 있어요.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
