import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: '천운 - 응모형 중고 마켓',
  description: '원하는 중고 상품에 응모하고 추첨으로 득템하세요',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <NavbarWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
