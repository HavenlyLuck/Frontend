import type { Metadata } from 'next'

// 페이지 제목 ("응모 | 천운") — 페이지 파일이 화면 코드('use client')라 제목은 여기 둔다
export const metadata: Metadata = {
  title: '응모',
  description: '천원짜리 응모권으로 피규어·굿즈에 응모하고, 응모권이 다 팔리면 바로 추첨해요.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
