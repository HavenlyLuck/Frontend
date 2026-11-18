import type { Metadata } from 'next'

// 페이지 제목 ("가이드 | 천운") — 페이지 파일이 화면 코드('use client')라 제목은 여기 둔다
export const metadata: Metadata = {
  title: '가이드',
  description: '응모·쿠지·상점 이용 방법과 쌀포인트·쌀 응모권, 환불 규칙을 정리했어요.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
