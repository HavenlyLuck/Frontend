'use client'

import PixelAvatar from '@/components/PixelAvatar'
import type { AvatarConfig } from '@/lib/avatar/compose'

interface Props {
  config: AvatarConfig
  className?: string
  label?: string
}

// 마이페이지 프로필 카드·캐릭터 꾸미기·상점 미리보기에 쓰는 큰 캐릭터 칸 — 발판 위 캐릭터를 연두색 공간 가운데에 세운다
export default function AvatarRoom({ config, className, label }: Props) {
  return (
    <div className={`avatar-room${className ? ` ${className}` : ''}`} role="img" aria-label={label ?? '내 캐릭터'}>
      <PixelAvatar config={config} size={200} persist style={{ width: '78%', height: 'auto' }} />
    </div>
  )
}
