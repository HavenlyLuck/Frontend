import type { Metadata, Viewport } from 'next'
import { Black_Han_Sans } from 'next/font/google'
import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import RaffleAlertWatcher from '@/components/RaffleAlertWatcher'

const display = Black_Han_Sans({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' })

const SITE_TITLE = '천운 - 천원의 행운'
const SITE_DESCRIPTION = '천원으로 피규어와 굿즈에 응모하는 행운의 마켓, 천운'

// 카톡·SNS 공유 미리보기. 없으면 카톡이 페이지 안의 아무 이미지(푸터 IBK 마크 등)를 가져간다
export const metadata: Metadata = {
  metadataBase: new URL('https://havenlyluck.com'),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: '천운',
    url: '/',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'ko_KR',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '천운 - 천원으로 응모하는 행운의 마켓' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={display.variable}>
      <body>
        <AuthProvider>
          <NavbarWrapper />
          {children}
          <Footer />
          <RaffleAlertWatcher />
        </AuthProvider>
      </body>
    </html>
  )
}
