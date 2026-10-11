'use client'

import { useEffect, useRef } from 'react'
import { AVATAR_H, drawAvatar, mulberry32, plotLine, type CastMember } from '@/lib/lightningDraw/scene'
import type { AvatarConfig } from '@/lib/avatar/compose'

/*
 * 쿠지 결과 무대 위의 픽셀 장면 — 내 아바타가 쿠지 상자에서 제비를 뽑고,
 * 라스트원상이면 응모 추첨과 같은 그림체의 번개가 내 아바타에게 떨어진다.
 *  phase 'draw'   : 상자로 다가가 깡총 → 상자가 흔들리고 제비가 count장 튀어 올라 날아감 → onDrawDone
 *  phase 'idle'   : 숨쉬기만
 *  phase 'strike' : 번개 + 감전 번쩍임 + 불꽃 → onStrikeDone
 */

interface Props {
  avatar: AvatarConfig
  count: number
  phase: 'draw' | 'idle' | 'strike'
  onDrawDone?: () => void
  onStrikeDone?: () => void
}

const W = 96
const H = 46
const FLOOR_Y = 40
const BOX_X = 47 // 상자 왼쪽
const BOX_W = 24
const BOX_H = 16
const AVATAR_HOME_X = 31
const AVATAR_NEAR_X = 38

// 타임라인 (ms)
const STEP_MS = 320
const HOP_END = 760
const TICKET_GAP = 120
const TICKET_FLY = 620
const STRIKE_MS = 900

const easeOut = (k: number) => 1 - (1 - k) ** 3
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function drawBox(ctx: CanvasRenderingContext2D, shake: number) {
  const x = BOX_X + shake
  const y = FLOOR_Y - BOX_H
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(x + 1, FLOOR_Y, BOX_W, 2)
  // 몸통 + 금테
  ctx.fillStyle = '#1a1220'
  ctx.fillRect(x - 1, y - 1, BOX_W + 2, BOX_H + 2)
  ctx.fillStyle = '#c22f3f'
  ctx.fillRect(x, y, BOX_W, BOX_H)
  ctx.fillStyle = '#e04a5a'
  ctx.fillRect(x, y, BOX_W, 2)
  ctx.fillStyle = '#e3b341'
  ctx.fillRect(x, y + 3, BOX_W, 1)
  ctx.fillRect(x, y + BOX_H - 2, BOX_W, 1)
  // 손 넣는 구멍
  ctx.fillStyle = '#1a1220'
  ctx.fillRect(x + 7, y, 10, 2)
  // 가운데 별 장식
  ctx.fillStyle = '#ffd966'
  const cx = x + 12
  const cy = y + 9
  ctx.fillRect(cx - 1, cy - 2, 2, 5)
  ctx.fillRect(cx - 3, cy, 6, 1)
  ctx.fillRect(cx - 2, cy - 1, 4, 3)
}

function drawTicket(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#1a1220'
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 6, 7)
  ctx.fillStyle = '#f6ecd2'
  ctx.fillRect(Math.round(x), Math.round(y), 4, 5)
  ctx.fillStyle = '#c22f3f'
  ctx.fillRect(Math.round(x), Math.round(y) + 2, 4, 1)
  ctx.globalAlpha = 1
}

export default function KujiAvatarScene({ avatar, count, phase, onDrawDone, onStrikeDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const doneRef = useRef({ onDrawDone, onStrikeDone })
  doneRef.current = { onDrawDone, onStrikeDone }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const n = Math.min(count, 10)
    const drawEnd = HOP_END + Math.max(0, n - 1) * TICKET_GAP + TICKET_FLY
    const rng = mulberry32(count * 97 + 13)
    const ticketPaths = Array.from({ length: n }, () => ({ dx: (rng() - 0.5) * 56, peak: 26 + rng() * 10 }))

    // 번개 모양은 장면마다 한 번 정한다 — 하늘 위에서 아바타 머리까지 지그재그
    const headY = FLOOR_Y - AVATAR_H - 2
    const bolt: { x: number; y: number }[] = [{ x: AVATAR_NEAR_X + 6, y: -2 }]
    for (let i = 1; i < 5; i++) bolt.push({ x: AVATAR_NEAR_X + Math.round((rng() - 0.5) * 10), y: Math.round((headY * i) / 5) })
    bolt.push({ x: AVATAR_NEAR_X, y: headY })

    const me: CastMember = {
      x: phase === 'draw' ? AVATAR_HOME_X : AVATAR_NEAR_X,
      y: FLOOR_Y,
      look: { skin: '#f5d3b3', hair: '#2b2118', shirt: '#d93347', pants: '#2d3a5c', longHair: false },
      avatar,
      isMe: true,
      isWinner: false,
      phase: 0,
    }

    let start = performance.now()
    if (reduceMotion) start -= phase === 'draw' ? drawEnd : phase === 'strike' ? STRIKE_MS : 0
    let finished = false
    let raf = 0

    const loop = (now: number) => {
      const t = now - start
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.imageSmoothingEnabled = false
      ctx.setTransform(w / W, 0, 0, h / H, 0, 0)

      // 바닥 — 무대 조명 아래 살짝 밝은 띠
      ctx.fillStyle = 'rgba(212, 175, 106, 0.10)'
      ctx.fillRect(12, FLOOR_Y + 1, 72, 2)

      let lift = (t % 1000) < 500 ? 0 : 1 // 숨쉬기
      let shake = 0
      let zap: 0 | 1 | null = null

      if (phase === 'draw') {
        // 상자로 다가가기 → 깡총 두 번 (상자도 들썩)
        me.x = Math.round(AVATAR_HOME_X + (AVATAR_NEAR_X - AVATAR_HOME_X) * easeOut(clamp01(t / STEP_MS)))
        if (t > STEP_MS && t < HOP_END) {
          const k = ((t - STEP_MS) % 220) / 220
          lift = Math.round(4 * k * (1 - k) * 3)
          shake = Math.floor(t / 60) % 2 ? 1 : -1
        }
      }

      if (phase === 'strike' && t < STRIKE_MS) {
        if (t < 600) zap = (Math.floor(t / 70) % 2) as 0 | 1
        if (t > 600) lift = Math.round(5 * Math.sin(((t - 600) / 300) * Math.PI))
      }

      drawBox(ctx, shake)
      drawAvatar(ctx, me, { lift, zap, flicker: Math.floor(t / 140) % 2 === 1 })

      // 튀어 오르는 제비
      if (phase === 'draw') {
        ticketPaths.forEach((p, i) => {
          const k = (t - HOP_END - i * TICKET_GAP) / TICKET_FLY
          if (k < 0 || k > 1) return
          const x0 = BOX_X + BOX_W / 2 - 2
          const y0 = FLOOR_Y - BOX_H - 4
          const x = x0 + p.dx * k
          const y = y0 - p.peak * Math.sin(k * Math.PI * 0.9) - k * 14
          drawTicket(ctx, x, y, k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1)
        })
      }

      // 번개 — 세 번 깜빡이며 내 아바타에게
      if (phase === 'strike' && t < 460 && (t < 90 || (t > 150 && t < 240) || t > 300)) {
        ctx.fillStyle = 'rgba(190, 220, 255, 0.85)'
        for (let i = 1; i < bolt.length; i++) plotLine(ctx, bolt[i - 1].x, bolt[i - 1].y, bolt[i].x, bolt[i].y, 3)
        ctx.fillStyle = '#ffffff'
        for (let i = 1; i < bolt.length; i++) plotLine(ctx, bolt[i - 1].x, bolt[i - 1].y, bolt[i].x, bolt[i].y, 1)
      }
      // 불꽃
      if (phase === 'strike' && t > 0 && t < 700) {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2
          const r = 3 + t * 0.03
          ctx.fillStyle = i % 2 ? '#fff6c0' : '#c9b2ff'
          ctx.fillRect(Math.round(AVATAR_NEAR_X + Math.cos(a) * r), Math.round(headY + 4 + Math.sin(a) * r * 0.7), 1, 1)
        }
      }

      if (!finished) {
        if (phase === 'draw' && t >= drawEnd) {
          finished = true
          doneRef.current.onDrawDone?.()
        } else if (phase === 'strike' && t >= STRIKE_MS) {
          finished = true
          doneRef.current.onStrikeDone?.()
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [avatar, count, phase])

  return <canvas ref={canvasRef} className="kuji-avatar-scene" aria-hidden="true" />
}
