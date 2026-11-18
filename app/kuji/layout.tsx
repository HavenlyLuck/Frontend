import type { Metadata } from 'next'

// 페이지 제목 ("쿠지 | 천운") — 페이지 파일이 화면 코드('use client')라 제목은 여기 둔다
export const metadata: Metadata = {
  title: '쿠지',
  description: '제비를 골라 뽑는 온라인 쿠지. 등급별 경품과 라스트원상까지.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
