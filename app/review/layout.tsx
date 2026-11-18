import type { Metadata } from 'next'

// 페이지 제목 ("후기/문의 | 천운") — 페이지 파일이 화면 코드('use client')라 제목은 여기 둔다
export const metadata: Metadata = {
  title: '후기/문의',
  description: '천운 당첨 후기와 문의 게시판.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
