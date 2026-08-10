"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { getReadyStorageCount } from "@/lib/storage";

const CONFETTI_COLORS = [
  "#7c6aff",
  "#a78bfa",
  "#f5c542",
  "#4ade80",
  "#ff6b8a",
  "#ff8c5a",
  "#60a5fa",
  "#fff",
];

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  speed: number;
  angle: number;
  spin: number;
  drift: number;
}

export default function MyPage() {
  const [winOpen, setWinOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const stopConfetti = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
    }
  }, []);

  const animateConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particlesRef.current) {
      p.y += p.speed;
      p.x += p.drift;
      p.angle += p.spin;
      if (p.y < canvas.height + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) animRef.current = requestAnimationFrame(animateConfetti);
    else canvas.style.display = "none";
  }, []);

  const startConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = "block";
    particlesRef.current = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 300,
      w: 7 + Math.random() * 9,
      h: 4 + Math.random() * 5,
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speed: 2.5 + Math.random() * 3.5,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.18,
      drift: (Math.random() - 0.5) * 1.8,
    }));
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animateConfetti);
  }, [animateConfetti]);

  const openWinModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWinOpen(true);
    startConfetti();
  };

  const closeWinModal = () => {
    setWinOpen(false);
    stopConfetti();
  };

  useEffect(() => () => stopConfetti(), [stopConfetti]);

  return (
    <><div>
      <div className="mypage-layout">
        {/* 사이드바 */}
        <div className="sidebar">
          <div className="profile-card">
            <div className="profile-avatar">🐔</div>
            <div className="profile-name">경호소인</div>
            <div className="profile-email">wkcpq103100@gmail.com</div>
            <div className="profile-rating">⭐ 4.9</div>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-value">23</div>
                <div className="profile-stat-label">응모 내역</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-value">3</div>
                <div className="profile-stat-label">당첨 횟수</div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="main-content">
          {/* 최근 알림 */}
          <div className="mypage-section-header">
            <div className="mypage-section-title">🔔 최근 알림</div>
            <div className="see-all">전체보기 →</div>
          </div>

          <div className="notif-list">
            <div className="notif-item unread">
              <div className="notif-dot" />
              <div className="notif-icon">🎉</div>
              <div className="notif-text">
                <div className="notif-title">
                  <strong>플레이스테이션 5</strong> 응모에서{" "}
                  <strong style={{ color: "#16a34a" }}>당첨</strong>되셨습니다!
                  판매자에게 연락해 거래를 진행해주세요.
                </div>
                <div className="notif-time">3일 전</div>
              </div>
            </div>

            <div className="notif-item unread">
              <div className="notif-dot" />
              <div className="notif-icon">⏰</div>
              <div className="notif-text">
                <div className="notif-title">
                  <strong>아이폰 14 Pro</strong> 응모 마감까지{" "}
                  <strong style={{ color: "#d9691d" }}>8시간</strong>{" "}
                  남았습니다.
                </div>
                <div className="notif-time">오늘</div>
              </div>
            </div>

            <div className="notif-item unread">
              <div className="notif-dot" />
              <div className="notif-icon">🎟</div>
              <div className="notif-text">
                <div className="notif-title">
                  찜한 상품 <strong>소니 WH-1000XM5</strong>에 새로운 응모자가
                  15명 추가되었습니다.
                </div>
                <div className="notif-time">1일 전</div>
              </div>
            </div>

            <div className="notif-item">
              <div className="notif-dot read" />
              <div className="notif-icon">💬</div>
              <div className="notif-text">
                <div className="notif-title">
                  <strong>테크마켓Pro</strong>님이 채팅 메시지를 보냈습니다.
                </div>
                <div className="notif-time">2일 전</div>
              </div>
            </div>

            <div className="notif-item">
              <div className="notif-dot read" />
              <div className="notif-icon">😢</div>
              <div className="notif-text">
                <div className="notif-title">
                  <strong>에어팟 프로 2세대</strong> 응모에서 미당첨되셨습니다.
                  다음 기회에 다시 도전해보세요!
                </div>
                <div className="notif-time">5일 전</div>
              </div>
            </div>
          </div>

          <div className="sidebar-menu" style={{ marginTop: 24 }}>
            {[
              { icon: "🏠", label: "내 활동 요약", active: true },
              { icon: "🎟", label: "응모 내역", badge: 5 },
              { icon: "📦", label: "보관함", href: "/mypage/storage", badge: getReadyStorageCount() },
              { icon: "❤️", label: "찜한 상품", id: "wishlist" },
              { icon: "⚙️", label: "설정" },
            ].map((item) => {
              const content = (
                <>
                  <span className="menu-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="menu-badge">{item.badge}</span>}
                </>
              );
              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  id={item.id}
                  className={`menu-item ${item.active ? "active" : ""}`}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.label}
                  id={item.id}
                  className={`menu-item ${item.active ? "active" : ""}`}
                  style={{ scrollMarginTop: 80 }}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

      {/* 폭죽 캔버스 */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 600,
          width: "100%",
          height: "100%",
          display: "none",
        }}
      />

      {/* 당첨 팝업 */}
      <div
        className={`win-overlay ${winOpen ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeWinModal();
        }}
      >
        <div className="win-modal">
          <span className="win-icon">🎉</span>
          <div className="win-title">당첨되셨습니다!</div>
          <div className="win-img">
            <img src="/images/naoya.jpg" alt="나오야 피규어" />
          </div>
          <div className="win-product">
            반다이 맥시매틱 젠인 나오야 피규어[미개봉]
            <br />
            <span style={{ color: "#1477b8", fontWeight: 700 }}>
              28,000원
            </span>{" "}
            상당의 상품에 당첨!
          </div>
          <button className="win-close" onClick={closeWinModal}>
            확인
          </button>
        </div>
      </div>
    </>
  );
}
