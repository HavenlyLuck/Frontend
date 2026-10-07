'use client'

import { useEffect, useState } from 'react'
import { itemToDataUrl } from '@/lib/avatar/render'
import type { WearSlot } from '@/lib/avatar/compose'

interface Props {
  slot: WearSlot
  index: number
  size: number
  alt?: string
}

// 상점 아이템만 단독으로 그린 픽셀 이미지. 캔버스가 필요해 클라이언트에서만 그린다.
export default function PixelItem({ slot, index, size, alt = '' }: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    setSrc(itemToDataUrl(slot, index))
  }, [slot, index])

  const box: React.CSSProperties = { width: size, height: size, display: 'block', imageRendering: 'pixelated' }
  return src ? <img src={src} alt={alt} width={size} height={size} style={box} draggable={false} /> : <span style={box} />
}
