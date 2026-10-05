'use client'

import { useEffect, useState } from 'react'
import { avatarToDataUrl } from '@/lib/avatar/render'
import type { AvatarConfig } from '@/lib/avatar/compose'

interface Props {
  config: AvatarConfig
  size: number
  alt?: string
  background?: boolean
  persist?: boolean
  style?: React.CSSProperties
}

// 캐싱된 합성 PNG를 픽셀이 뭉개지지 않게 표시한다.
// 캔버스가 필요해 클라이언트에서만 그리며, 그 전에는 같은 크기의 빈 칸을 둔다.
export default function PixelAvatar({ config, size, alt = '', background = true, persist = false, style }: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    setSrc(avatarToDataUrl(config, { background, persist }))
  }, [config, background, persist])

  const box: React.CSSProperties = { width: size, height: size, display: 'block', imageRendering: 'pixelated', ...style }
  return src ? <img src={src} alt={alt} width={size} height={size} style={box} draggable={false} /> : <span style={box} />
}
