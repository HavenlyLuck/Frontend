"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon, CoinsIcon, TicketIcon } from "@phosphor-icons/react";
import { useMyPoints } from "@/hooks/useMyPoints";
import { formatTimeAgo } from "@/lib/date";
import {
  getNotifications,
  markAllNotificationsRead,
  NOTIFICATIONS_UPDATED_EVENT,
  type AppNotification,
} from "@/lib/notifications";

export default function MyPage() {
  const { eungPoint, ssalPoint } = useMyPoints();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    // 화면에 이미 보이는 알림은 처음 봤을 때의 읽음 여부(강조)를 유지하고, 저장소에는 바로 읽음 처리한다.
    // (prev 기준으로 합치기 때문에 effect가 두 번 실행되는 개발 모드에서도 강조가 사라지지 않는다)
    const refresh = () => {
      const latest = getNotifications();
      setNotifications((prev) => latest.map((n) => ({ ...n, read: prev.find((p) => p.id === n.id)?.read ?? n.read })));
    };
    refresh();
    markAllNotificationsRead();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
  }, []);

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

      {notifications.length === 0 ? (
        <div className="coming-soon-box">
          <div className="desc">아직 알림이 없어요.</div>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => {
            const inner = (
              <>
                <div className={`notif-dot${n.read ? " read" : ""}`} />
                <div className="notif-icon"><TicketIcon size={20} weight="fill" color="var(--accent)" /></div>
                <div className="notif-text">
                  <div className="notif-title">{n.title} <span style={{ color: "var(--gold)" }}>{n.body}</span></div>
                  <div className="notif-time">{formatTimeAgo(n.createdAt)}</div>
                </div>
              </>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className={`notif-item${n.read ? "" : " unread"}`} style={{ textDecoration: "none" }}>{inner}</Link>
            ) : (
              <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`}>{inner}</div>
            );
          })}
        </div>
      )}
    </>
  );
}
