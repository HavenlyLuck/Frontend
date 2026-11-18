import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '천운 - 천원의 행운',
    short_name: '천운',
    description: '천원으로 피규어와 굿즈에 응모하는 행운의 마켓, 천운',
    start_url: '/',
    display: 'standalone',
    background_color: '#14151a',
    theme_color: '#14151a',
    lang: 'ko',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
