import Link from "next/link";

const ITEMS = [
  { href: "/products/iphone", img: "/images/iphone14pro.jpg", alt: "아이폰 14 Pro", badge: "🎟 응모 진행 중", title: "아이폰 14 Pro 256GB 스페이스 블랙", price: "650,000원", pct: 76 },
  { href: "/products/notebook", img: "/images/ps5.jpg", alt: "플레이스테이션 5", badge: "🎟 응모 진행 중", title: "플레이스테이션 5 디스크 에디션", price: "450,000원", pct: 92 },
  { href: "/products/notebook", img: "/images/demo-4.jpg", alt: "에어팟 프로 2세대", badge: "🎟 응모 진행 중", title: "에어팟 프로 2세대", price: "180,000원", pct: 22 },
  { href: "/products/notebook", img: "/images/demo-5.jpg", alt: "닌텐도 스위치 OLED", badge: "🎟 응모 진행 중", title: "닌텐도 스위치 OLED", price: "280,000원", pct: 65 },
  { href: "/products/notebook", img: "/images/demo-6.jpg", alt: "갤럭시 워치 6 클래식", badge: "🎟 응모 진행 중", title: "갤럭시 워치 6 클래식", price: "220,000원", pct: 48 },
  { href: "/products/notebook", img: "/images/demo-7.jpg", alt: "소니 WH-1000XM5", badge: "🎟 응모 진행 중", title: "소니 WH-1000XM5", price: "250,000원", pct: 56 },
  { href: "/products/notebook", img: "/images/demo-8.jpg", alt: "아이패드 Air 5세대", badge: "🎟 응모 진행 중", title: "아이패드 Air 5세대 64GB", price: "480,000원", pct: 30 },
  { href: "/products/notebook", img: "/images/demo-9.jpg", alt: "소니 ZV-E10 미러리스", badge: "🎟 응모 진행 중", title: "소니 ZV-E10 미러리스", price: "380,000원", pct: 14 },
];

export default function EungmoPage() {
  return (
    <div className="home-container">
      <div className="section-header">
        <div className="section-title">🎟 응모상품</div>
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
