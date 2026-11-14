'use client'

import AvatarRoom from '@/components/AvatarRoom'
import PixelAvatar from '@/components/PixelAvatar'
import type { AvatarConfig, WearSlot } from '@/lib/avatar/compose'

// 아이템을 입은 모습 썸네일 (상점·캐릭터 꾸미기) — 배경·오라 아이템은 캐릭터만으론 차이가 안 보여서 방째로(오라는 움직이게) 보여준다
export default function AvatarItemPreview({ config, slot, size, alt = '' }: {
  config: AvatarConfig
  slot: WearSlot
  size: number
  alt?: string
}) {
  if (slot === 'background' || slot === 'aura') {
    return (
      <span className="avatar-bg-thumb" style={{ width: size }}>
        <AvatarRoom config={config} label={alt || (slot === 'aura' ? '오라 미리보기' : '배경 미리보기')} />
      </span>
    )
  }
  return <PixelAvatar config={config} size={size} alt={alt} />
}
