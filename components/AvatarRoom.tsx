'use client'

import { useEffect, useRef } from 'react'
import { AVATAR_FEET_ROW, AVATAR_H, AVATAR_W, avatarKey, composeAvatar, type AvatarConfig } from '@/lib/avatar/compose'
import { DEFAULT_ROOM_BACKGROUND, drawRoom, ROOM, ROOM_FLOOR_Y, type RoomBackgroundId } from '@/lib/avatar/rooms'

interface Props {
  config: AvatarConfig
  background?: RoomBackgroundId
  className?: string
  label?: string
}

// 방은 칸이 아바타 그림의 2배 — 방 1칸 = 그림 2칸. 화면 캔버스는 이 작은 그림을 정수배로 키워 그린다.
const ROOM_SCALE = 2
const WORLD = ROOM * ROOM_SCALE
// 발바닥이 진열장 받침대 금테 바로 위에 오게 세운다
const AVATAR_X = Math.round((WORLD - AVATAR_W) / 2)
const AVATAR_Y = ROOM_FLOOR_Y * ROOM_SCALE - 1 - AVATAR_FEET_ROW

// 설정별로 뜬 눈 / 감은 눈 그림을 한 번만 만든다
const sprites = new Map<string, HTMLCanvasElement>()
function sprite(config: AvatarConfig, blink: boolean): HTMLCanvasElement {
  const key = avatarKey(config) + (blink ? '-b' : '')
  let c = sprites.get(key)
  if (!c) {
    c = document.createElement('canvas')
    c.width = AVATAR_W
    c.height = AVATAR_H
    c.getContext('2d')!.putImageData(new ImageData(composeAvatar(config, { blink }), AVATAR_W, AVATAR_H), 0, 0)
    sprites.set(key, c)
  }
  return c
}

// 마이페이지 프로필 카드·캐릭터 꾸미기·상점 미리보기의 큰 캐릭터 칸 — 픽셀 진열장 안 받침대 위에 캐릭터가 서 있고, 가끔 눈을 깜빡인다
export default function AvatarRoom({ config, background = DEFAULT_ROOM_BACKGROUND, className, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const world = document.createElement('canvas')
    world.width = WORLD
    world.height = WORLD
    const wctx = world.getContext('2d')!
    const open = sprite(config, false)
    const closed = sprite(config, true)

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

      wctx.setTransform(ROOM_SCALE, 0, 0, ROOM_SCALE, 0, 0)
      wctx.clearRect(0, 0, ROOM, ROOM)
      drawRoom(wctx, background, t)
      wctx.setTransform(1, 0, 0, 1, 0, 0)
      // 발밑 그림자
      wctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
      wctx.fillRect(AVATAR_X + 13, ROOM_FLOOR_Y * ROOM_SCALE, 12, 1)
      // 3.6초마다 0.12초 눈 감기
      const blink = !reduceMotion && t % 3600 > 3480
      wctx.drawImage(blink ? closed : open, AVATAR_X, AVATAR_Y)

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
