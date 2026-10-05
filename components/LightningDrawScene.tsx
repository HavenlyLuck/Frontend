'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AVATAR_H, CLOUD_ALT, WORLD_H, WORLD_W,
  buildCloudSprites, buildScene, drawAvatar, fillPixelEllipse, hash01, plotLine, strokePixelCircle,
  type CastMember, type Scene, type SceneEntrant,
} from '@/lib/lightningDraw/scene'

/*
 * 번개 추첨 연출 — 같은 상품이면 모든 응모자가 같은 장면(자리·구름 동선·번개)을 본다.
 * 내 아바타에서 시작해 하늘로 줌아웃 → 먹구름이 사람들 위를 맴돌다
 * 당첨자에게 번개(가끔은 구름 밑 사람을 비껴가 옆 사람에게 꺾여 내리는 반전). 결과(winnerEntryNumber)는 서버가 이미 정한 값이고 이 화면은 보여주기만 한다.
 *
 * entrants(실제 응모자와 마이페이지 캐릭터)를 주면 공원이 그 사람들로 채워진다.
 * 주지 않으면(데모) 시드로 만든 임시 아바타들이 선다.
 */

interface Props {
  seed: number
  myEntryNumbers: number[]
  winnerEntryNumber: number
  entrants?: SceneEntrant[]
  crowdSize?: number
  onFinish?: () => void
}

// 타임라인 (ms)
const HOLD_CLOSE = 900 // 내 아바타 클로즈업으로 잠깐 멈춤
const ZOOM_END = 3200 // 하늘 시점으로 줌아웃 완료
const STORM_START = 2600 // 하늘이 어두워지기 시작
const CLOUD_START = 3000
const LEG_MS = 1200 // 먹구름이 한 사람 위로 이동 + 멈칫
const LEG_MOVE_MS = 850
const CHARGE_MS = 700 // 당첨자 위에서 번쩍번쩍 충전
const AFTER_MS = 2300 // 번개 후 당첨자 클로즈업까지

const CLOSE_ZOOM = 3.2
const WINNER_ZOOM = 2.4

function timeline(scene: Scene) {
  const legs = scene.cloudStops.length
  const arrive = CLOUD_START + (legs - 1) * LEG_MS + LEG_MOVE_MS
  const strike = arrive + CHARGE_MS
  return { arrive, strike, done: strike + AFTER_MS }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

type Cam = { cx: number; cy: number; zoom: number }

function lerpCam(a: Cam, b: Cam, k: number): Cam {
  // 줌은 로그 공간에서 보간해야 속도가 일정하게 느껴진다
  return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), k)) }
}

function clampCam(c: Cam): Cam {
  const hw = WORLD_W / (2 * c.zoom)
  const hh = WORLD_H / (2 * c.zoom)
  return { zoom: c.zoom, cx: Math.min(WORLD_W - hw, Math.max(hw, c.cx)), cy: Math.min(WORLD_H - hh, Math.max(hh, c.cy)) }
}

export default function LightningDrawScene({ seed, myEntryNumbers, winnerEntryNumber, entrants, crowdSize, onFinish }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const skipRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const [finished, setFinished] = useState(false)

  const meIsWinner = myEntryNumbers.includes(winnerEntryNumber)
  const myEntryNumber = myEntryNumbers[0]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 응모자 목록이 없으면(데모, 목록을 못 받았을 때) 1번부터 임시 응모자를 세운다 — 나와 당첨자는 꼭 포함
    let cast = entrants
    if (!cast || cast.length === 0) {
      const crowd = crowdSize ?? 14 + Math.floor(hash01(seed) * 8)
      const numbers = new Set([...Array.from({ length: crowd }, (_, i) => i + 1), winnerEntryNumber, ...myEntryNumbers])
      cast = Array.from(numbers, n => ({ entryNumber: n, avatar: null }))
    }
    const scene = buildScene(seed, { entrants: cast, winnerEntryNumber, myEntryNumber })
    const clouds = buildCloudSprites()
    const tl = timeline(scene)
    const { me, winner } = scene

    const frame = document.createElement('canvas')
    frame.width = WORLD_W
    frame.height = WORLD_H
    const fctx = frame.getContext('2d')!
    const overlay = document.createElement('canvas')
    overlay.width = WORLD_W
    overlay.height = WORLD_H
    const octx = overlay.getContext('2d')!

    // 장면은 모두 같고, 시작할 때 카메라가 비추는 곳만 각자 자기 캐릭터다 (내가 못 섰으면 공원 전체에서 시작)
    const fullCam: Cam = { cx: WORLD_W / 2, cy: WORLD_H / 2, zoom: 1 }
    const closeCam: Cam = me ? { cx: me.x, cy: me.y - 6, zoom: CLOSE_ZOOM } : fullCam
    const winnerCam: Cam = { cx: winner.x, cy: winner.y - 8, zoom: WINNER_ZOOM }

    const camAt = (t: number): Cam => {
      if (t < HOLD_CLOSE) return closeCam
      if (t < ZOOM_END) return lerpCam(closeCam, fullCam, easeInOut((t - HOLD_CLOSE) / (ZOOM_END - HOLD_CLOSE)))
      const zs = tl.strike + 500
      if (t < zs) return fullCam
      return lerpCam(fullCam, winnerCam, easeInOut(clamp01((t - zs) / 1200)))
    }

    // 구름이 떠 있는 "땅 위 지점" — 실제 구름은 그 위 CLOUD_ALT만큼 높이 그린다
    const cloudAt = (t: number): { x: number; y: number; alpha: number } | null => {
      if (t < CLOUD_START) return null
      const stops = scene.cloudStops
      const entry = { x: -34, y: 30 }
      let pos = { x: winner.x, y: winner.y }
      for (let i = 0; i < stops.length; i++) {
        const from = i === 0 ? entry : stops[i - 1]
        const to = stops[i]
        const s = CLOUD_START + i * LEG_MS
        if (t < s + LEG_MS || i === stops.length - 1) {
          const k = easeInOut(clamp01((t - s) / LEG_MOVE_MS))
          pos = { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) }
          break
        }
      }
      let alpha = 1
      const leave = tl.strike + 900
      if (t > leave) {
        const k = clamp01((t - leave) / 900)
        pos = { x: pos.x + k * 40, y: pos.y - k * 10 }
        alpha = 1 - k
      }
      // 충전 중엔 부르르 떨린다
      if (t > tl.arrive && t < tl.strike) pos = { x: pos.x + (Math.floor(t / 50) % 2 ? 1 : -1), y: pos.y }
      return alpha > 0 ? { ...pos, alpha } : null
    }

    const hop = (dt: number, start: number, len: number, height: number) => {
      const k = (dt - start) / len
      return k > 0 && k < 1 ? 4 * height * k * (1 - k) : 0
    }

    const renderWorld = (t: number) => {
      const ds = t - tl.strike // 번개 기준 경과 시간
      fctx.clearRect(0, 0, WORLD_W, WORLD_H)
      fctx.drawImage(scene.base, 0, 0)

      const cloud = cloudAt(t)
      if (cloud) {
        fctx.globalAlpha = 0.3 * cloud.alpha
        fctx.fillStyle = '#0b1408'
        fillPixelEllipse(fctx, cloud.x, cloud.y + 1, 17, 5)
        fctx.globalAlpha = 1
      }

      // 땅에 남는 번개 자국
      if (ds >= 0) {
        fctx.globalAlpha = 0.45 * (1 - clamp01((ds - 1200) / 1500))
        fctx.fillStyle = '#2a1d0c'
        fillPixelEllipse(fctx, winner.x, winner.y + 1, 7, 2)
        fctx.globalAlpha = 1
      }

      // 아바타 — 아래쪽(앞)에 선 사람이 위에 그려지도록
      const sorted = [...scene.cast].sort((a, b) => a.y - b.y)
      for (const m of sorted) {
        const local = t + m.phase
        let lift = local % 1000 < 500 ? 0 : 1
        let zap: 0 | 1 | null = null
        let outline: string | undefined
        if (m === winner && ds >= 0) {
          if (ds < 650) zap = (Math.floor(ds / 70) % 2) as 0 | 1
          lift = hop(ds, 650, 400, 5) + hop(ds, 1100, 300, 2)
          outline = ds > 650 ? '#f3c94f' : undefined
        } else if (m === scene.fakeTarget && ds >= 0) {
          lift = hop(ds, 60, 320, 4) // 구름 밑에 있다가 번개가 비껴가서 화들짝
        } else if (ds >= 0 && (m.x - winner.x) ** 2 + (m.y - winner.y) ** 2 < 32 * 32) {
          lift = hop(ds, 80, 260, 3) // 근처 사람들은 깜짝 놀라 펄쩍
        }
        drawAvatar(fctx, m, { lift, blink: (local * 3) % 3400 < 130, zap, outline })
      }

      // 비
      const rain = t < STORM_START + 500 ? 0 : clamp01((t - STORM_START - 500) / 600) * (1 - clamp01((ds - 1000) / 800))
      if (rain > 0) {
        fctx.fillStyle = 'rgba(170, 196, 232, 0.55)'
        const drops = Math.round(54 * rain)
        for (let i = 0; i < drops; i++) {
          const x = Math.floor((((hash01(i * 7 + 1) * WORLD_W - t * 0.035) % WORLD_W) + WORLD_W) % WORLD_W)
          const y = Math.floor((hash01(i * 13 + 5) * (WORLD_H + 12) + t * (0.14 + hash01(i) * 0.05)) % (WORLD_H + 12)) - 6
          fctx.fillRect(x, y, 1, 3)
        }
      }

      // 폭풍 어둠 → 번개 후엔 당첨자만 비추는 스포트라이트로 좁혀진다
      const storm = clamp01((t - STORM_START) / 900) * 0.4
      octx.clearRect(0, 0, WORLD_W, WORLD_H)
      if (ds < 600) {
        octx.fillStyle = `rgba(8, 12, 32, ${storm})`
        octx.fillRect(0, 0, WORLD_W, WORLD_H)
      } else {
        const k = easeInOut(clamp01((ds - 600) / 700))
        octx.fillStyle = `rgba(8, 12, 32, ${lerp(0.4, 0.55, k)})`
        octx.fillRect(0, 0, WORLD_W, WORLD_H)
        octx.globalCompositeOperation = 'destination-out'
        octx.fillStyle = '#000'
        fillPixelEllipse(octx, winner.x, winner.y - 5, lerp(90, 17, k), lerp(70, 14, k))
        octx.globalCompositeOperation = 'source-over'
      }
      if (storm > 0 || ds >= 600) fctx.drawImage(overlay, 0, 0)

      // 충격파 고리 + 불꽃
      if (ds >= 0 && ds < 520) {
        fctx.fillStyle = `rgba(255, 226, 122, ${1 - ds / 520})`
        strokePixelCircle(fctx, winner.x, winner.y, 2 + 22 * easeInOut(ds / 520))
      }
      if (ds >= 0 && ds < 800) {
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + hash01(seed + i) * 0.4
          const v = 0.045 + hash01(seed * 3 + i) * 0.04
          const x = winner.x + Math.cos(a) * v * ds
          const y = winner.y - 7 + Math.sin(a) * v * ds * 0.7 + 0.00004 * ds * ds
          fctx.fillStyle = i % 2 ? '#fff6c0' : '#ffd24a'
          if (hash01(i * 97 + Math.floor(ds / 60)) > ds / 900) fctx.fillRect(Math.round(x), Math.round(y), 1, 1)
        }
      }
      // 당첨자 주위 반짝이
      if (ds > 900) {
        for (let i = 0; i < 4; i++) {
          const cyc = Math.floor((ds + i * 260) / 1040)
          const k = ((ds + i * 260) % 1040) / 1040
          if (k > 0.5) continue
          const sx = winner.x + Math.round((hash01(cyc * 11 + i) - 0.5) * 22)
          const sy = winner.y - 6 + Math.round((hash01(cyc * 17 + i) - 0.5) * 18)
          fctx.fillStyle = '#ffe27a'
          fctx.fillRect(sx, sy, 1, 1)
          if (k > 0.12 && k < 0.38) {
            fctx.fillRect(sx - 1, sy, 3, 1)
            fctx.fillRect(sx, sy - 1, 1, 3)
          }
        }
      }

      // 먹구름 (충전/번개 순간엔 번쩍)
      if (cloud) {
        const charging = t > tl.strike - 420 && t < tl.strike && Math.floor((t - tl.strike) / 70) % 3 === 0
        const flashing = ds >= 0 && ds < 420 && Math.floor(ds / 60) % 2 === 0
        const sprite = charging || flashing ? clouds.lit : clouds.dark
        const bob = Math.round(Math.sin(t / 320))
        fctx.globalAlpha = cloud.alpha
        fctx.drawImage(sprite, Math.round(cloud.x - sprite.width / 2), Math.round(cloud.y - CLOUD_ALT - sprite.height / 2 + bob))
        fctx.globalAlpha = 1
      }

      // 번개 — 세 번 깜빡이며 내리꽂힌다
      const boltOn = ds >= 0 && (ds < 90 || (ds > 140 && ds < 220) || (ds > 260 && ds < 420))
      if (boltOn) {
        scene.bolt.forEach((path, idx) => {
          fctx.fillStyle = 'rgba(255, 236, 140, 0.85)'
          for (let i = 1; i < path.length; i++) plotLine(fctx, path[i - 1].x, path[i - 1].y, path[i].x, path[i].y, idx === 0 ? 3 : 2)
          fctx.fillStyle = '#ffffff'
          for (let i = 1; i < path.length; i++) plotLine(fctx, path[i - 1].x, path[i - 1].y, path[i].x, path[i].y, 1)
        })
      }
    }

    const drawLabel = (text: string, m: CastMember, cam: Cam, scale: number, ox: number, oy: number, gold: boolean, dpr: number) => {
      const px = ox + (m.x - (cam.cx - WORLD_W / (2 * cam.zoom))) * scale
      const py = oy + (m.y - AVATAR_H - 3 - (cam.cy - WORLD_H / (2 * cam.zoom))) * scale - 6 * dpr
      ctx.font = `800 ${12 * dpr}px Pretendard, system-ui, sans-serif`
      const tw = ctx.measureText(text).width
      const pw = tw + 14 * dpr
      const ph = 20 * dpr
      const x = px - pw / 2
      const y = py - ph
      ctx.fillStyle = gold ? '#f3c94f' : '#d93347'
      ctx.beginPath()
      ctx.roundRect(x, y, pw, ph, 6 * dpr)
      ctx.moveTo(px - 4 * dpr, y + ph)
      ctx.lineTo(px + 4 * dpr, y + ph)
      ctx.lineTo(px, y + ph + 5 * dpr)
      ctx.fill()
      ctx.fillStyle = gold ? '#2a1d05' : '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, px, y + ph / 2 + dpr)
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let startedAt = performance.now() - (reduceMotion ? tl.done : 0)
    let finishedCalled = false
    let raf = 0

    const loop = (now: number) => {
      if (skipRef.current) {
        skipRef.current = false
        startedAt = Math.min(startedAt, now - tl.done)
      }
      const t = now - startedAt
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      renderWorld(t)

      const cam = clampCam(camAt(t))
      const scale = (w / WORLD_W) * cam.zoom
      const ds = t - tl.strike
      const shake = ds >= 0 && ds < 450 ? 6 * dpr * (1 - ds / 450) : 0
      const ox = Math.round(Math.sin(t * 1.7) * shake)
      const oy = Math.round(Math.cos(t * 2.3) * shake)
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = '#0d120c'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(
        frame,
        Math.round(w / 2 - cam.cx * scale) + ox,
        Math.round(h / 2 - cam.cy * scale) + oy,
        Math.round(WORLD_W * scale),
        Math.round(WORLD_H * scale),
      )

      // 이름표
      const winnerLabelOn = ds > 700
      if (me && !(me === winner && winnerLabelOn)) drawLabel('나', me, cam, scale, ox, oy, false, dpr)
      if (winnerLabelOn) drawLabel(me === winner ? '당첨! 나' : `당첨 #${winnerEntryNumber}`, winner, cam, scale, ox, oy, true, dpr)

      // 번개 섬광
      let flash = 0
      if (ds >= 0 && ds < 380) flash = 0.85 * (1 - ds / 380) ** 2
      if (ds > 140 && ds < 300) flash = Math.max(flash, 0.35)
      if (flash > 0) {
        ctx.fillStyle = `rgba(255, 252, 235, ${flash})`
        ctx.fillRect(0, 0, w, h)
      }

      if (!finishedCalled && t >= tl.done) {
        finishedCalled = true
        setFinished(true)
        onFinishRef.current?.()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // myEntryNumbers는 배열이라 매 렌더 새로 만들어지므로 의존성에서 빼고 첫 번호(myEntryNumber)로 대신한다
  }, [seed, myEntryNumber, winnerEntryNumber, entrants, crowdSize])

  return (
    <div className="draw-scene">
      <canvas
        ref={canvasRef}
        className="draw-scene-canvas"
        role="img"
        aria-label={meIsWinner ? '번개 추첨 연출: 내 아바타에 번개가 떨어졌어요' : `번개 추첨 연출: ${winnerEntryNumber}번 응모자에게 번개가 떨어졌어요`}
      />
      {!finished && (
        <button type="button" className="draw-scene-skip" onClick={() => { skipRef.current = true }}>
          건너뛰기
        </button>
      )}
    </div>
  )
}
