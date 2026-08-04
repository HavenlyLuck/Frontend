"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

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
    <>
      <div className="mypage-layout">
        {/* 사이드바 */}
        <div className="sidebar">
          <div className="profile-card">
            <div className="profile-avatar">🐔</div>
            <div className="profile-name">경호소인</div>
            <div className="profile-email">wkcpq103100@gmail.com</div>
            <div className="profile-rating">⭐ 4.9 · 매너온도 38°C</div>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-value">12</div>
                <div className="profile-stat-label">거래 완료</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-value">7</div>
                <div className="profile-stat-label">판매 중</div>
              </div>
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

          <div className="sidebar-menu">
            {[
              { icon: "🏠", label: "내 활동 요약", active: true },
              { icon: "🎟", label: "응모 내역", badge: 5 },
              { icon: "🛍️", label: "판매 내역" },
              { icon: "🤍", label: "관심 상품" },
              { icon: "🔔", label: "알림", badge: 3 },
              { icon: "💬", label: "채팅 목록" },
              { icon: "⚙️", label: "설정" },
            ].map((item) => (
              <div
                key={item.label}
                className={`menu-item ${item.active ? "active" : ""}`}
              >
                <span className="menu-icon">{item.icon}</span>
                {item.label}
                {item.badge && <span className="menu-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="main-content">
          {/* 요약 통계 */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">🎟</div>
              <div className="summary-value">
                2 <span>건</span>
              </div>
              <div className="summary-label">진행 중인 응모</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🏆</div>
              <div className="summary-value">
                3 <span>회</span>
              </div>
              <div className="summary-label">누적 당첨</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💸</div>
              <div className="summary-value">
                8,000 <span>원</span>
              </div>
              <div className="summary-label">이번 달 응모 금액</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🤍</div>
              <div className="summary-value">
                8 <span>개</span>
              </div>
              <div className="summary-label">관심 상품</div>
            </div>
          </div>

          {/* 최근 응모 내역 */}
          <div className="mypage-section-header">
            <div className="mypage-section-title">🎟 최근 응모 내역</div>
            <div className="see-all">전체보기 →</div>
          </div>

          <div className="entry-list">
            <Link className="entry-item" href="/products/notebook">
              <div className="entry-emoji">
                <img src="/images/naoya.jpg" alt="나오야 피규어" />
              </div>
              <div className="entry-info">
                <div className="entry-title">
                  반다이 맥시매틱 젠인 나오야 피규어[미개봉]
                </div>
                <div className="entry-meta">
                  <span>🎟 1장 응모</span>
                  <span>📅 어제</span>
                  <span className="meta-done">🏁 추첨 완료</span>
                </div>
              </div>
              <div className="entry-status">
                <button className="btn-win-confirm" onClick={openWinModal}>
                  🎉 당첨확인
                </button>
                <div className="entry-price">1,000원</div>
              </div>
            </Link>

            <Link className="entry-item" href="/products/iphone">
              <div className="entry-emoji">
                <img src="/images/iphone14pro.jpg" alt="아이폰 14 Pro" />
              </div>
              <div className="entry-info">
                <div className="entry-title">
                  아이폰 14 Pro 256GB 스페이스 블랙
                </div>
                <div className="entry-meta">
                  <span>🎟 2장 응모</span>
                  <span>📅 오늘</span>
                  <span className="meta-urgent">⏱ 8시간 남음</span>
                </div>
              </div>
              <div className="entry-status">
                <div className="status-badge waiting">대기 중</div>
                <div className="entry-price">2,000원</div>
              </div>
            </Link>

            <Link className="entry-item" href="/products/notebook">
              <div className="entry-emoji">
                <img src="/images/ps5.jpg" alt="플레이스테이션 5" />
              </div>
              <div className="entry-info">
                <div className="entry-title">
                  플레이스테이션 5 디스크 에디션
                </div>
                <div className="entry-meta">
                  <span>🎟 2장 응모</span>
                  <span>📅 3일 전</span>
                  <span className="meta-warning">⏳ 1일 남음</span>
                </div>
              </div>
              <div className="entry-status">
                <div className="status-badge waiting">대기 중</div>
                <div className="entry-price">2,000원</div>
              </div>
            </Link>

            <Link className="entry-item" href="/products/notebook">
              <div className="entry-emoji">🎧</div>
              <div className="entry-info">
                <div className="entry-title">에어팟 프로 2세대</div>
                <div className="entry-meta">
                  <span>🎟 1장 응모</span>
                  <span>📅 5일 전</span>
                  <span className="meta-done">🏁 추첨 완료</span>
                </div>
              </div>
              <div className="entry-status">
                <div className="status-badge lose">미당첨</div>
                <div className="entry-price">1,000원</div>
              </div>
            </Link>

            <Link className="entry-item" href="/products/notebook">
              <div className="entry-emoji">⌚</div>
              <div className="entry-info">
                <div className="entry-title">갤럭시 워치 6 클래식</div>
                <div className="entry-meta">
                  <span>🎟 1장 응모</span>
                  <span>📅 1주일 전</span>
                  <span className="meta-done">🏁 추첨 완료</span>
                </div>
              </div>
              <div className="entry-status">
                <div className="status-badge lose">미당첨</div>
                <div className="entry-price">2,000원</div>
              </div>
            </Link>
          </div>

          {/* 관심 상품 */}
          <div
            className="mypage-section-header"
            id="wishlist"
            style={{ scrollMarginTop: "80px" }}
          >
            <div className="mypage-section-title">🤍 관심 상품</div>
            <div className="see-all">전체보기 →</div>
          </div>

          <div className="wish-grid">
            {[
              {
                emoji: "🎵",
                title: "소니 WH-1000XM5 헤드폰",
                price: "250,000원",
                badge: "🎟 응모 중 · 4일 남음",
              },
              {
                emoji: "📷",
                title: "소니 ZV-E10 미러리스 카메라",
                price: "380,000원",
                badge: "🎟 응모 중 · 7일 남음",
              },
              {
                emoji: "🖥️",
                title: "아이패드 Air 5세대 64GB",
                price: "480,000원",
                badge: "🎟 응모 중 · 6일 남음",
              },
            ].map((item) => (
              <Link
                key={item.title}
                className="wish-card"
                href="/products/notebook"
              >
                <div className="wish-img">
                  {item.emoji}
                  <span className="wish-heart">❤️</span>
                </div>
                <div className="wish-body">
                  <div className="wish-title">{item.title}</div>
                  <div className="wish-price">{item.price}</div>
                  <div className="wish-badge">{item.badge}</div>
                </div>
              </Link>
            ))}
          </div>

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
                  관심 상품 <strong>소니 WH-1000XM5</strong>에 새로운 응모자가
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
