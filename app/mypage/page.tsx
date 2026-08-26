"use client";

import { BellIcon, CoinsIcon } from "@phosphor-icons/react";
import { useMyPoints } from "@/hooks/useMyPoints";

export default function MyPage() {
  const { eungPoint, ssalPoint } = useMyPoints();

  return (
    <>
      {/* 내 포인트 */}
      <div className="mypage-section-header">
        <div className="mypage-section-title"><CoinsIcon size={17} weight="fill" color="var(--accent)" /> 내 포인트</div>
      </div>

      <div className="notif-list" style={{ display: "flex", padding: "18px 20px", marginBottom: 24 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>🎰 운포인트</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{eungPoint.toLocaleString()}P</div>
        </div>
        <div style={{ width: 1, background: "var(--border)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>🌾 쌀포인트</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{ssalPoint.toLocaleString()}P</div>
        </div>
      </div>

      {/* 최근 알림 */}
      <div className="mypage-section-header">
        <div className="mypage-section-title"><BellIcon size={17} weight="fill" color="var(--accent)" /> 최근 알림</div>
      </div>

      <div className="coming-soon-box">
        <div className="desc">아직 알림이 없어요.</div>
      </div>
    </>
  );
}
