import { cloudinarySized } from '@/lib/image'

// 상품 카드 사진 — 사진 전체가 보이도록 contain으로 그리고, 남는 여백은 같은 사진을 흐리게 깔아 채운다.
// (.card-img 안에 넣어서 사용. 비율이 제각각인 상품 사진이 잘리지 않게 하기 위함)
// Cloudinary 사진은 크기를 줄여 받는다 — 흐린 배경은 아주 작게, 본 사진은 카드 크기의 2배쯤
export default function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <>
      <img className="card-img-backdrop" src={cloudinarySized(src, 160)} alt="" aria-hidden="true" />
      <img className="card-img-main" src={cloudinarySized(src, 640)} loading="lazy" decoding="async" alt={alt} />
    </>
  )
}
