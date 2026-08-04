import Link from "next/link";

const ITEMS = [
  { href: "/products/notebook", img: "/images/naoya.jpg", alt: "나오야 젠인 쿠지", badge: "🎁 쿠지 진행 중", title: "주술회전 나오야 젠인 쿠지", price: "1,000원부터 응모 가능", pct: 42 },
  { href: "/products/notebook", img: "/images/demo-5.jpg", alt: "원피스 쿠지", badge: "🎁 쿠지 진행 중", title: "원피스 A상 루피 쿠지", price: "1,000원부터 응모 가능", pct: 68 },
  { href: "/products/notebook", img: "/images/demo-6.jpg", alt: "귀멸의 칼날 쿠지", badge: "🎁 쿠지 진행 중", title: "귀멸의 칼날 최애의 쿠지", price: "1,000원부터 응모 가능", pct: 25 },
  { href: "/products/notebook", img: "/images/demo-7.jpg", alt: "드래곤볼 쿠지", badge: "🎁 쿠지 진행 중", title: "드래곤볼 갓 오브 데스티니 쿠지", price: "1,000원부터 응모 가능", pct: 55 },
  { href: "/products/notebook", img: "/images/demo-8.jpg", alt: "명탐정 코난 쿠지", badge: "🎁 쿠지 진행 중", title: "명탐정 코난 랜덤 쿠지", price: "1,000원부터 응모 가능", pct: 18 },
  { href: "/products/notebook", img: "/images/demo-9.jpg", alt: "산리오 쿠지", badge: "🎁 쿠지 진행 중", title: "산리오 캐릭터즈 쿠지", price: "1,000원부터 응모 가능", pct: 61 },
];

export default function KujiPage() {
  return (
    <div className="home-container">
      <div className="section-header">
        <div className="section-title">🎁 쿠지상품</div>
      </div>

      <div className="product-grid-home">
        {ITEMS.map((item, i) => (
          <Link key={i} className="product-card-home" href={item.href}>
            <div className="card-img">
              <img src={item.img} alt={item.alt} />
            </div>
            <div className="card-body">
              <div className="card-raffle-badge">{item.badge}</div>
              <div className="card-title">{item.title}</div>
              <div className="card-price">{item.price}</div>
              <div className="card-progress-row">
                <div className="card-progress-bar">
                  <div
                    className="card-progress-fill"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="card-progress-pct">{item.pct}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
