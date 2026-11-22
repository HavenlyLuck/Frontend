'use client'

import { useEffect, useState } from 'react'
import { avatarToDataUrl } from '@/lib/avatar/render'
import { AVATAR_BODY_H, AVATAR_H, AVATAR_W, type AvatarConfig } from '@/lib/avatar/compose'

interface Props {
  config: AvatarConfig
  // 그림 높이(px). 너비는 그림 비율대로 정해진다.
  size: number
  alt?: string
  background?: boolean
  persist?: boolean
  style?: React.CSSProperties
}

// 캐싱된 합성 PNG를 픽셀이 뭉개지지 않게 표시한다.
// 캔버스가 필요해 클라이언트에서만 그리며, 그 전에는 같은 크기의 빈 칸을 둔다.
export default function PixelAvatar({ config, size, alt = '', background = false, persist = false, style }: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    setSrc(avatarToDataUrl(config, { background, persist }))
  }, [config, background, persist])

  // size = 몸(원래 그림 37줄) 높이. 그림 틀 위쪽 여유(높은 모자 자리)는 칸 위로 삐져나오게 그려서,
  // 틀을 넓혀도 썸네일 크기와 줄맞춤은 예전 그대로다
  const width = Math.round((size * AVATAR_W) / AVATAR_BODY_H)
  const fullH = Math.round((size * AVATAR_H) / AVATAR_BODY_H)
  const box: React.CSSProperties = { width, height: size, display: 'block', position: 'relative', ...style }
  if (!src) return <span style={box} />
  return (
    <span style={box}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={fullH}
        style={{ position: 'absolute', left: 0, bottom: 0, width, height: fullH, maxWidth: 'none', imageRendering: 'pixelated' }}
        draggable={false}
      />
    </span>
  )
}
