import Link from "next/link";
import { BIZ_INFO } from "./PolicyDoc";
import EscrowMark from "./EscrowMark";
import { Logo } from "./LogoMark";


// 사업자 정보는 components/PolicyDoc.tsx의 BIZ_INFO 한 곳에서 관리한다 (사업자등록증 2026-10-26 기준).
// 개인사업자라 상호에 "(주)"를 붙이면 안 됨.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-logo">
            <Logo />
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
            <span>통신판매업신고 {BIZ_INFO.mailOrderNo}</span>
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

        <EscrowMark />
      </div>
    </footer>
  );
}
