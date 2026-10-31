import Link from "next/link";
import { BIZ_INFO } from "./PolicyDoc";

const CLOUD_MARK_PATH =
  "M6 20 C6 15.5 9.6 12.5 13.5 13.2 C14.6 9.6 19 8.3 22 11 C25.6 11.4 28 14.3 27 17.8 C29.2 19 29.2 22.4 26.5 23.3 C25.5 25.6 22.6 26.2 20.8 24.6 C19.4 26.4 16.4 26.3 15.1 24.4 C12.8 25.6 9.8 24.3 9.3 21.8 C7.4 21.9 6 21.2 6 20 Z";

// 사업자 정보는 components/PolicyDoc.tsx의 BIZ_INFO 한 곳에서 관리한다 (사업자등록증 2026-10-26 기준).
// 개인사업자라 상호에 "(주)"를 붙이면 안 됨.
// TODO: 통신판매업 신고번호가 나오면 "신고 진행 중"을 교체.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-logo">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d={CLOUD_MARK_PATH} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="23" cy="12.5" r="1.8" fill="var(--gold)" />
            </svg>
            천운
          </div>
          <div className="footer-links">
            <Link href="/guide">가이드</Link>
            <Link href="/review">후기/문의</Link>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-policy-links">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy" className="strong">개인정보처리방침</Link>
          <Link href="/refund">취소·환불 정책</Link>
        </div>

        <div className="footer-biz">
          <div className="footer-biz-row">
            <span>상호명 {BIZ_INFO.name}</span>
            <span>대표 {BIZ_INFO.owner}</span>
            <span>
              사업자등록번호 {BIZ_INFO.bizNo}{" "}
              <a
                href={`https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${BIZ_INFO.bizNo.replace(/-/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                [사업자정보확인]
              </a>
            </span>
            <span>통신판매업신고 신고 진행 중</span>
          </div>
          <div className="footer-biz-row">
            <span>주소 {BIZ_INFO.address}</span>
          </div>
          <div className="footer-biz-row">
            <span>대표전화 {BIZ_INFO.phone}</span>
            <span>이메일 {BIZ_INFO.email}</span>
            <span>개인정보 보호책임자 {BIZ_INFO.owner}</span>
          </div>
          <p className="footer-copyright">© 2026 {BIZ_INFO.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
