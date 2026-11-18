import type { Metadata } from 'next'
import type { StoreProductResponse } from '@/lib/api'
import { fetchForMeta, productMeta } from '@/lib/seo'

// 상품 상세의 제목·설명·공유 그림 — "상품명 | 천운"
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await fetchForMeta<StoreProductResponse>(`/store-products/${encodeURIComponent(params.id)}`)
  return productMeta(p?.product_name, p?.description, p?.image_url, '만나 보세요')
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
