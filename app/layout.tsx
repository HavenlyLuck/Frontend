import type { Metadata, Viewport } from 'next'
import { Black_Han_Sans } from 'next/font/google'
import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'

const display = Black_Han_Sans({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  title: '천운 - 천원의 행운',
  description: '천원으로 피규어와 굿즈에 응모하는 행운의 마켓, 천운',
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
        </AuthProvider>
      </body>
    </html>
  )
}
