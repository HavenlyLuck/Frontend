'use client'

import { useEffect, useRef } from 'react'
import { drawAvatar, type CastMember } from '@/lib/lightningDraw/scene'
import { drawRoom, ROOM, ROOM_FLOOR_Y, type RoomBackgroundId } from '@/lib/avatar/rooms'
import type { AvatarConfig } from '@/lib/avatar/compose'

interface Props {
  config: AvatarConfig
  background: RoomBackgroundId
  className?: string
  label?: string
}

// 캐릭터 방 — 네모난 칸에 배경을 깔고, 내 캐릭터가 눈을 깜빡이며 서 있다 (불꽃 같은 아이템과 배경은 은은하게 움직인다)
export default function AvatarRoom({ config, background, className, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // 방은 칸 단위로 작게 그린 뒤 픽셀 그대로 키운다
    const world = document.createElement('canvas')
    world.width = ROOM
    world.height = ROOM
    const wctx = world.getContext('2d')!

    const me: CastMember = {
      x: ROOM / 2,
      y: ROOM_FLOOR_Y,
      look: { skin: '#f5d3b3', hair: '#2b2118', shirt: '#d93347', pants: '#2d3a5c', longHair: false },
      avatar: config,
      isMe: true,
      isWinner: false,
      phase: 0,
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const start = performance.now()

    const frame = (now: number) => {
      const t = reduceMotion ? 0 : now - start
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      wctx.clearRect(0, 0, ROOM, ROOM)
      drawRoom(wctx, background, t)

      // 방이 크게 확대돼서 몸 전체를 1칸만 움직여도 화면에선 뛰는 것처럼 보인다 — 몸은 가만히, 눈 깜빡임과 아이템·배경만 움직인다
      drawAvatar(wctx, me, {
        blink: t % 3600 > 3480,
        flicker: Math.floor(t / 140) % 2 === 1,
      })

      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(world, 0, 0, w, h)
      if (!reduceMotion) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [config, background])

  return <canvas ref={canvasRef} className={`avatar-room${className ? ` ${className}` : ''}`} role="img" aria-label={label ?? '내 캐릭터'} />
}
