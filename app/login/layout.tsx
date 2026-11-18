import type { Metadata } from 'next'

// 페이지 제목 ("로그인 | 천운") — 페이지 파일이 화면 코드('use client')라 제목은 여기 둔다
export const metadata: Metadata = {
  title: '로그인',
  description: '천운 로그인.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
