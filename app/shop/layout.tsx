import type { Metadata } from 'next'

// 페이지 제목 ("상점 | 천운") — 페이지 파일이 화면 코드('use client')라 제목은 여기 둔다
export const metadata: Metadata = {
  title: '상점',
  description: '피규어·굿즈를 바로 사는 일반 상점과 쌀포인트로 사는 쌀포인트 상점.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
