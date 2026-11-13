'use client'

import AvatarRoom from '@/components/AvatarRoom'
import PixelAvatar from '@/components/PixelAvatar'
import type { AvatarConfig, WearSlot } from '@/lib/avatar/compose'

// 아이템을 입은 모습 썸네일 (상점·캐릭터 꾸미기) — 배경 아이템은 캐릭터만으론 차이가 안 보여서 방 배경째로 보여준다
export default function AvatarItemPreview({ config, slot, size, alt = '' }: {
  config: AvatarConfig
  slot: WearSlot
  size: number
  alt?: string
}) {
  if (slot === 'background') {
    return (
      <span className="avatar-bg-thumb" style={{ width: size }}>
        <AvatarRoom config={config} label={alt || '배경 미리보기'} />
      </span>
    )
  }
  return <PixelAvatar config={config} size={size} alt={alt} />
}
