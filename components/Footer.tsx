import Link from "next/link";

const CLOUD_MARK_PATH =
  "M6 20 C6 15.5 9.6 12.5 13.5 13.2 C14.6 9.6 19 8.3 22 11 C25.6 11.4 28 14.3 27 17.8 C29.2 19 29.2 22.4 26.5 23.3 C25.5 25.6 22.6 26.2 20.8 24.6 C19.4 26.4 16.4 26.3 15.1 24.4 C12.8 25.6 9.8 24.3 9.3 21.8 C7.4 21.9 6 21.2 6 20 Z";

// TODO: 아래 사업자 정보는 전부 임시값입니다. 실제 사업자등록번호/통신판매업신고번호/대표자/주소/연락처가
// 정해지면 이 컴포넌트에서 바로 교체해주세요.
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

        <div className="footer-biz">
          <div className="footer-biz-row">
            <span>상호명 천운(주)</span>
            <span>대표 홍길동</span>
            <span>사업자등록번호 123-45-67890</span>
            <span>통신판매업신고 제2026-서울강남-01234호</span>
          </div>
          <div className="footer-biz-row">
            <span>주소 서울특별시 강남구 테헤란로 123, 4층</span>
            <span>대표전화 1588-0000</span>
            <span>이메일 help@cheonun.co.kr</span>
          </div>
          <p className="footer-copyright">© 2026 천운(주). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
