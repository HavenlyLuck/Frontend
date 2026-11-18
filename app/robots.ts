import type { MetadataRoute } from 'next'

const SITE = 'https://havenlyluck.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/mypage', '/payment', '/login', '/signup', '/find-id', '/find-password'] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
