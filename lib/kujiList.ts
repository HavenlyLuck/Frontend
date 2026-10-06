// 쿠지 목록 카드 데이터 (쿠지 목록 · 검색 결과가 같이 쓴다)
// TODO(backend): 쿠지 백엔드가 생기면 서버 목록으로 교체 — 지금은 데모 데이터
export interface KujiListItem {
  href: string
  img: string
  alt: string
  badge: string
  title: string
  price: string
  pct: number
  count: number
  max: number
}

export const KUJI_LIST: KujiListItem[] = [
  { href: '/kuji/naoya', img: '/images/naoya.jpg', alt: '나오야 젠인 쿠지', badge: '쿠지 진행 중', title: '주술회전 나오야 젠인 쿠지', price: '10,000 운포인트 / 1장', pct: 60, count: 60, max: 100 },
  { href: '/kuji/onepiece', img: '/images/demo-5.jpg', alt: '원피스 쿠지', badge: '쿠지 진행 중', title: '원피스 A상 루피 쿠지', price: '10,000 운포인트 / 1장', pct: 45, count: 45, max: 100 },
  { href: '/kuji/kimetsu', img: '/images/demo-6.jpg', alt: '귀멸의 칼날 쿠지', badge: '쿠지 진행 중', title: '귀멸의 칼날 최애의 쿠지', price: '10,000 운포인트 / 1장', pct: 30, count: 30, max: 100 },
  { href: '/kuji/dragonball', img: '/images/demo-7.jpg', alt: '드래곤볼 쿠지', badge: '쿠지 진행 중', title: '드래곤볼 갓 오브 데스티니 쿠지', price: '10,000 운포인트 / 1장', pct: 55, count: 55, max: 100 },
  { href: '/kuji/conan', img: '/images/demo-8.jpg', alt: '명탐정 코난 쿠지', badge: '쿠지 진행 중', title: '명탐정 코난 랜덤 쿠지', price: '10,000 운포인트 / 1장', pct: 18, count: 18, max: 100 },
  { href: '/kuji/sanrio', img: '/images/demo-9.jpg', alt: '산리오 쿠지', badge: '쿠지 진행 중', title: '산리오 캐릭터즈 쿠지', price: '10,000 운포인트 / 1장', pct: 65, count: 65, max: 100 },
]
