import type { Metadata } from 'next'
import type { KujiSetResponse } from '@/lib/api'
import { fetchForMeta, productMeta } from '@/lib/seo'

// 상품 상세의 제목·설명·공유 그림 — "상품명 | 천운"
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await fetchForMeta<KujiSetResponse>(`/kuji/${encodeURIComponent(params.id)}`)
  return productMeta(p?.title, p?.description, p?.image_url, '쿠지를 뽑아 보세요')
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
