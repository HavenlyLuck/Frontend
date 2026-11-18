import type { MetadataRoute } from 'next'
import type { KujiSetResponse, RaffleProductResponse, StoreProductResponse } from '@/lib/api'
import { fetchForMeta } from '@/lib/seo'

const SITE = 'https://havenlyluck.com'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages = ['', '/eungmo', '/kuji', '/shop', '/guide', '/review', '/notice', '/terms', '/privacy', '/refund']
    .map((p) => ({ url: `${SITE}${p}`, lastModified: now }))
  const [raffles, kuji, store] = await Promise.all([
    fetchForMeta<RaffleProductResponse[]>('/raffles?status=open'),
    fetchForMeta<KujiSetResponse[]>('/kuji'),
    fetchForMeta<StoreProductResponse[]>('/store-products'),
  ])
  return [
    ...pages,
    ...(raffles ?? []).map((r) => ({ url: `${SITE}/eungmo/${r.raffle_product_id}`, lastModified: now })),
    ...(kuji ?? []).filter((k) => k.status === 'open').map((k) => ({ url: `${SITE}/kuji/${k.kuji_set_id}`, lastModified: now })),
    ...(store ?? []).map((s) => ({ url: `${SITE}/shop/${s.store_product_id}`, lastModified: now })),
  ]
}
