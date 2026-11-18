import type { Metadata } from 'next'

// 페이지 제목 ("회원가입 | 천운") — 페이지 파일이 화면 코드('use client')라 제목은 여기 둔다
export const metadata: Metadata = {
  title: '회원가입',
  description: '천운 회원가입.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
