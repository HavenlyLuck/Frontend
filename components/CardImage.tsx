// 상품 카드 사진 — 사진 전체가 보이도록 contain으로 그리고, 남는 여백은 같은 사진을 흐리게 깔아 채운다.
// (.card-img 안에 넣어서 사용. 비율이 제각각인 상품 사진이 잘리지 않게 하기 위함)
export default function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <>
      <img className="card-img-backdrop" src={src} alt="" aria-hidden="true" />
      <img className="card-img-main" src={src} alt={alt} />
    </>
  )
}
