// 쿠지 목록 카드 데이터 (홈 · 쿠지 목록 · 검색 결과가 같이 쓴다)
// TODO(backend): 쿠지 API가 연결되면 서버 목록으로 교체 — 지금은 테스트 쿠지만 있다
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
  test?: boolean // 화면 확인용 — 홈에는 안 보인다
}

export const KUJI_LIST: KujiListItem[] = [
  // 뽑기·결과 연출을 화면에서 확인하는 테스트 쿠지 — 홈에는 안 보이고 쿠지 목록에만 (kujiData.ts에도 있음)
  { href: '/kuji/test5', img: '/images/demo-1.jpg', alt: '테스트 쿠지', badge: '테스트', title: '[테스트] 5장 쿠지', price: '10,000 운포인트 / 1장', pct: 0, count: 0, max: 5, test: true },
]
