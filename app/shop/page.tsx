import Link from "next/link";

const ITEMS = [
  { href: "/products/notebook", img: "/images/demo-1.jpg", alt: "굿즈 스티커 세트", badge: "🏪 즉시구매", title: "캐릭터 굿즈 스티커 세트", price: "12,000원" },
  { href: "/products/notebook", img: "/images/demo-2.jpg", alt: "아크릴 스탠드", badge: "🏪 즉시구매", title: "인기 캐릭터 아크릴 스탠드", price: "18,000원" },
  { href: "/products/notebook", img: "/images/demo-4.jpg", alt: "미니 피규어", badge: "🏪 즉시구매", title: "데스크용 미니 피규어", price: "25,000원" },
  { href: "/products/notebook", img: "/images/ps5.jpg", alt: "PS5 무선 컨트롤러", badge: "🏪 즉시구매", title: "PS5 듀얼센스 무선 컨트롤러", price: "78,000원" },
  { href: "/products/iphone", img: "/images/iphone14pro.jpg", alt: "아이폰 케이스", badge: "🏪 즉시구매", title: "아이폰 14 Pro 투명 케이스", price: "15,000원" },
  { href: "/products/notebook", img: "/images/demo-3.jpg", alt: "피규어 진열 케이스", badge: "🏪 즉시구매", title: "피규어 먼지방지 진열 케이스", price: "9,000원" },
];

export default function ShopPage() {
  return (
    <div className="home-container">
      <div className="section-header">
        <div className="section-title">🏪 상점</div>
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
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
