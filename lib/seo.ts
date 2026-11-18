// 검색·공유용 페이지 정보 (서버에서만 쓴다) — 상품 상세의 제목·설명·대표 이미지를 상품 이름으로 만든다.
// 서버가 응답하지 않으면 사이트 기본값(app/layout.tsx)이 그대로 쓰인다.

import type { Metadata } from 'next'
import { API_URL } from './api'
import { cloudinarySized } from './image'

// 5분마다 새로 받는다 — 상품 이름·사진은 자주 바뀌지 않는다
export async function fetchForMeta<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// 상품 한 개의 페이지 정보 — 제목은 "상품명" (뒤에 " | 천운"이 붙는다), 카톡 공유 그림은 상품 사진
export function productMeta(name: string | undefined, description: string | null | undefined, image: string | null | undefined, kind: string): Metadata {
  if (!name) return {}
  const desc = (description?.trim() || `${name} — 천운에서 ${kind}`).slice(0, 120)
  return {
    title: name,
    description: desc,
    openGraph: {
      title: `${name} | 천운`,
      description: desc,
      ...(image ? { images: [{ url: cloudinarySized(image, 1200) }] } : {}),
    },
  }
}
