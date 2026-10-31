import Link from "next/link";

// 이용약관 · 개인정보처리방침 · 환불 정책 페이지가 함께 쓰는 문서 틀
export const BIZ_INFO = {
  name: "천운",
  owner: "김경호",
  bizNo: "418-33-01775",
  address: "서울특별시 성북구 삼선교로16길 35, 104동 304호 (삼선동3가, 삼선 SK VIEW 아파트)",
  phone: "010-9831-1138",
  email: "havenlyluck@gmail.com",
};

const DOCS = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/refund", label: "취소·환불 정책" },
];

export function PolicyDoc({
  title,
  current,
  effectiveDate,
  intro,
  children,
}: {
  title: string;
  current: string;
  effectiveDate: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="home-container policy-doc" style={{ maxWidth: 820 }}>
      <div className="policy-tabs" role="navigation" aria-label="정책 문서">
        {DOCS.map((d) => (
          <Link key={d.href} href={d.href} className={`policy-tab ${d.href === current ? "active" : ""}`}>
            {d.label}
          </Link>
        ))}
      </div>
      <h1 className="policy-title">{title}</h1>
      <p className="policy-date">시행일 {effectiveDate}</p>
      {intro && <div className="policy-intro">{intro}</div>}
      {children}
    </div>
  );
}

export function PolicySection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="policy-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
