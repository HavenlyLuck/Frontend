// 오라 — 캐릭터 등 뒤(일부는 앞까지)에서 움직이는 빛 효과. 쌀포인트 상점 "오라" 칸 아이템.
// 그림 파일이 아니라 코드로 그린다. 캐릭터 방(AvatarRoom)의 칸 좌표(60×60, 그림 1칸 = 1)에 그린다.
// drawAura(..., 'back')은 캐릭터를 그리기 전에, drawAura(..., 'front')는 캐릭터를 그린 뒤에 부른다.

import { hash01 } from '@/lib/lightningDraw/scene'

export type AuraId = 'gold-halo' | 'thunder' | 'blue-flame' | 'sakura' | 'angel-wings'

// 캐릭터 기준점 (AvatarRoom 칸 좌표) — 머리 가운데, 발바닥
export interface AuraAnchor {
  cx: number // 캐릭터 가운데 x
  headY: number // 머리 가운데 y
  feetY: number // 발바닥 y
}

type Ctx = CanvasRenderingContext2D

function px(ctx: Ctx, color: string, x: number, y: number, alpha = 1, w = 1, h = 1) {
  if (alpha <= 0) return
  ctx.globalAlpha = Math.min(1, alpha)
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

// 부드럽게 퍼지는 둥근 빛 (가운데가 진하다)
function glow(ctx: Ctx, color: string, cx: number, cy: number, r: number, alpha: number) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y) / r
      if (d > 1) continue
      px(ctx, color, cx + x, cy + y, alpha * (1 - d) * (1 - d))
    }
  }
}

// 반짝이 — 가운데 한 칸 + 십자 네 칸
function twinkle(ctx: Ctx, x: number, y: number, size: number, alpha: number, core = '#ffffff', arm = '#fff3b0') {
  px(ctx, core, x, y, alpha)
  for (let i = 1; i <= size; i++) {
    const a = alpha * (1 - i / (size + 1))
    px(ctx, arm, x + i, y, a)
    px(ctx, arm, x - i, y, a)
    px(ctx, arm, x, y + i, a)
    px(ctx, arm, x, y - i, a)
  }
}

// ── 1. 금빛 후광 — 머리 뒤로 큰 금빛 고리가 돌고, 고리 위에서 별이 반짝인다 ──
function goldHalo(ctx: Ctx, a: AuraAnchor, t: number, layer: 'back' | 'front') {
  const cy = a.headY + 2
  if (layer === 'back') {
    glow(ctx, '#f5c842', a.cx, cy, 24, 0.22)
    const rx = 23
    const ry = 22
    const head = (t / 1400) % (Math.PI * 2) // 밝은 부분이 고리를 따라 돈다
    const steps = 180
    for (let i = 0; i < steps; i++) {
      const ang = (i / steps) * Math.PI * 2
      const x = a.cx + Math.cos(ang) * rx
      const y = cy + Math.sin(ang) * ry
      let d = Math.abs(((ang - head + Math.PI * 3) % (Math.PI * 2)) - Math.PI) // 0 = 가장 밝은 곳
      d = 1 - d / Math.PI
      const bright = Math.pow(d, 3)
      px(ctx, '#c9921c', x, y, 0.55)
      if (bright > 0.08) px(ctx, bright > 0.6 ? '#fff3b0' : '#f5c842', x, y, 0.4 + bright * 0.6)
    }
    // 안쪽 얇은 고리
    for (let i = 0; i < 120; i++) {
      const ang = (i / 120) * Math.PI * 2
      px(ctx, '#f5c842', a.cx + Math.cos(ang) * 19, cy + Math.sin(ang) * 18, 0.18)
    }
    return
  }
  // 고리 위 별 6개 — 차례로 반짝인다
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + t / 5000
    const phase = ((t / 1600 + i / 6) % 1)
    const s = Math.sin(phase * Math.PI)
    if (s < 0.25) continue
    twinkle(ctx, a.cx + Math.cos(ang) * 23, cy + Math.sin(ang) * 22, s > 0.8 ? 2 : 1, s)
  }
}

// ── 2. 천운 번개 — 등 뒤 주황빛 속에서 번개가 갈래로 친다 (로고 번개 색) ──
function zigzag(seed: number, x0: number, y0: number, x1: number, y1: number, n: number): [number, number][] {
  const pts: [number, number][] = [[x0, y0]]
  for (let i = 1; i < n; i++) {
    const f = i / n
    const off = (hash01(seed * 31 + i) - 0.5) * 7
    pts.push([x0 + (x1 - x0) * f + off, y0 + (y1 - y0) * f + (hash01(seed * 17 + i) - 0.5) * 3])
  }
  pts.push([x1, y1])
  return pts
}
function line(ctx: Ctx, color: string, x0: number, y0: number, x1: number, y1: number, alpha: number) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= n; i++) px(ctx, color, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, alpha)
}
function thunder(ctx: Ctx, a: AuraAnchor, t: number, layer: 'back' | 'front') {
  const PERIOD = 1300
  const cycle = Math.floor(t / PERIOD)
  const local = (t % PERIOD) / PERIOD
  const flash = local < 0.16 ? 1 - local / 0.16 : 0
  const tick = Math.floor(t / 90) // 지지직거리는 전기는 0.09초마다 모양이 바뀐다
  if (layer === 'back') {
    const pulse = 0.85 + Math.sin(t / 260) * 0.15
    glow(ctx, '#ff9700', a.cx, a.headY + 6, 27, 0.32 * pulse + flash * 0.3)
    // 몸을 둘러싼 전기 고리 — 짧은 갈래들이 계속 지지직거린다
    const ARCS = 9
    for (let i = 0; i < ARCS; i++) {
      if (hash01(tick * 13 + i) < 0.35) continue
      const ang = (i / ARCS) * Math.PI * 2 + hash01(tick * 7 + i) * 0.5
      const r0 = 20
      const x0 = a.cx + Math.cos(ang) * r0
      const y0 = a.headY + 6 + Math.sin(ang) * (r0 - 1)
      const ang1 = ang + 0.35
      const x1 = a.cx + Math.cos(ang1) * (r0 + 2)
      const y1 = a.headY + 6 + Math.sin(ang1) * (r0 + 1)
      const pts = zigzag(tick * 31 + i, x0, y0, x1, y1, 3)
      for (let k = 0; k < pts.length - 1; k++) {
        line(ctx, '#ff9700', pts[k][0], pts[k][1] + 1, pts[k + 1][0], pts[k + 1][1] + 1, 0.6)
        line(ctx, '#ffd23f', pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 0.95)
      }
    }
    // 큰 번개 두 갈래 — 위에서 양옆으로 내리친다
    if (flash > 0) {
      for (const side of [-1, 1]) {
        const seed = cycle * 2 + (side > 0 ? 1 : 0)
        const top: [number, number] = [a.cx + side * (4 + hash01(seed) * 8), 0]
        const end: [number, number] = [a.cx + side * (24 + hash01(seed + 9) * 5), a.headY + 10 + hash01(seed + 5) * 12]
        const pts = zigzag(seed, top[0], top[1], end[0], end[1], 7)
        for (let i = 0; i < pts.length - 1; i++) {
          const [x0, y0] = pts[i]
          const [x1, y1] = pts[i + 1]
          line(ctx, '#ff9700', x0 - 1, y0, x1 - 1, y1, flash * 0.7)
          line(ctx, '#ff9700', x0 + 1, y0, x1 + 1, y1, flash * 0.7)
          line(ctx, '#fff3b0', x0, y0, x1, y1, flash)
        }
      }
    }
    return
  }
  // 몸 앞을 지나가는 작은 불꽃
  for (let i = 0; i < 7; i++) {
    const ang = t / 700 + (i / 7) * Math.PI * 2
    const r = 22 + Math.sin(t / 300 + i) * 2
    const x = a.cx + Math.cos(ang) * r
    const y = a.headY + 10 + Math.sin(ang) * 14
    if (Math.sin(ang) < -0.2) continue // 뒤쪽은 캐릭터에 가려진 것처럼 안 그린다
    const s = 0.6 + 0.4 * Math.sin(t / 90 + i * 2)
    px(ctx, '#ffd23f', x, y, s)
    px(ctx, '#ff9700', x - Math.cos(ang) * 1.5, y - Math.sin(ang), s * 0.6)
  }
}

// ── 3. 푸른 도깨비불 — 발밑에서 푸른 불길이 일렁이며 몸을 감싼다 ──
// 칸마다 불길 높이를 정해 아래(하얀 속불) → 위(파란 끝)로 칠한다. 0.08초마다 높이가 흔들린다.
function blueFlame(ctx: Ctx, a: AuraAnchor, t: number, layer: 'back' | 'front') {
  const tick = Math.floor(t / 80)
  if (layer === 'back') {
    glow(ctx, '#3fc8e0', a.cx, a.feetY - 14, 26, 0.22)
    for (let dx = -25; dx <= 25; dx++) {
      const ad = Math.abs(dx)
      // 몸 옆(가운데에서 10~20칸)이 가장 높고, 바깥으로 갈수록 낮다
      const profile = ad < 10 ? 0.75 : ad < 20 ? 1 : Math.max(0, 1 - (ad - 20) / 6)
      if (profile <= 0) continue
      const wave = Math.sin(tick * 0.9 + dx * 1.3) * 0.5 + Math.sin(tick * 0.55 - dx * 0.7) * 0.5
      const h = Math.round(26 * profile * (0.72 + 0.28 * wave) + hash01(tick * 41 + dx) * 2)
      for (let k = 0; k < h; k++) {
        const u = k / h // 0 = 바닥, 1 = 불길 끝
        const color = u < 0.22 ? '#d4f8ff' : u < 0.5 ? '#3fc8e0' : u < 0.8 ? '#2f8fe0' : '#2f5fc0'
        px(ctx, color, a.cx + dx, a.feetY - k, u < 0.8 ? 0.95 : 0.95 * (1 - (u - 0.8) / 0.2) + 0.15)
      }
      // 불길 끝에서 떨어져 나간 불티
      if (hash01(tick * 7 + dx * 3) > 0.9) px(ctx, '#3fc8e0', a.cx + dx, a.feetY - h - 2 - hash01(tick + dx) * 4, 0.8)
    }
    return
  }
  // 발 앞쪽에 낮게 깔리는 불길
  for (let dx = -12; dx <= 12; dx++) {
    const wave = Math.sin(tick * 1.1 + dx * 1.7)
    const h = Math.round(1.5 + wave + hash01(tick * 5 + dx) * 1.5)
    for (let k = 0; k < h; k++) {
      const u = k / h
      px(ctx, u < 0.4 ? '#d4f8ff' : '#3fc8e0', a.cx + dx, a.feetY + 1 - k, 0.5 * (1 - u * 0.5)) // 다리가 가려지지 않게 옅게
    }
  }
}

// ── 4. 벚꽃 바람 — 꽃잎이 캐릭터 둘레를 돌며 흩날린다 (앞으로 지날 땐 캐릭터 앞에 그린다) ──
function sakura(ctx: Ctx, a: AuraAnchor, t: number, layer: 'back' | 'front') {
  if (layer === 'back') glow(ctx, '#ff9db5', a.cx, a.headY + 8, 26, 0.26)
  const N = 30
  for (let i = 0; i < N; i++) {
    const speed = 0.0011 + hash01(i * 3) * 0.0006
    const ang = t * speed + (i / N) * Math.PI * 2
    const front = Math.sin(ang) > 0
    if ((layer === 'front') !== front) continue
    const rx = 21 + hash01(i * 7) * 5
    const ry = 5 + hash01(i * 11) * 3
    const baseY = a.headY - 6 + hash01(i * 5) * 30 // 머리 위부터 발 근처까지 높이가 제각각
    const bob = Math.sin(t / 500 + i) * 2
    const x = a.cx + Math.cos(ang) * rx
    const y = baseY + Math.sin(ang) * ry + bob
    const flip = Math.floor(t / 180 + i) % 4 // 꽃잎이 뒤집히며 모양이 바뀐다
    const depth = layer === 'back' ? 0.7 : 1
    const c1 = i % 3 === 0 ? '#ffd1dc' : '#ff9db5'
    const c2 = '#e8668a'
    if (flip === 0) { px(ctx, c1, x, y, depth, 2, 1); px(ctx, c2, x + 1, y + 1, depth * 0.8) }
    else if (flip === 1) { px(ctx, c1, x, y, depth, 1, 2); px(ctx, c2, x + 1, y + 1, depth * 0.8) }
    else if (flip === 2) { px(ctx, c1, x, y, depth, 2, 2); px(ctx, '#ffffff', x, y, depth * 0.7) }
    else px(ctx, c1, x, y, depth)
  }
}

// ── 5. 천사 날개 — 등 뒤에서 하얀 날개가 천천히 퍼덕인다 ──
// 깃털 줄마다 어깨에서 바깥 위로 뻗는 선. 줄이 아래로 갈수록 짧다.
function angelWings(ctx: Ctx, a: AuraAnchor, t: number, layer: 'back' | 'front') {
  if (layer === 'front') {
    // 떨어지는 깃털 하나
    const LIFE = 2600
    const age = (t % LIFE) / LIFE
    const gen = Math.floor(t / LIFE)
    const side = gen % 2 ? 1 : -1
    const x = a.cx + side * (16 + hash01(gen) * 6) + Math.sin(age * Math.PI * 3) * 2
    const y = a.headY + 4 + age * 22
    const alpha = age < 0.1 ? age * 10 : 1 - age
    px(ctx, '#ffffff', x, y, alpha, 2, 1)
    px(ctx, '#b9c6dd', x + 1, y + 1, alpha * 0.7)
    return
  }
  glow(ctx, '#ffffff', a.cx, a.headY + 6, 24, 0.12)
  const flap = Math.sin(t / 650) // -1 ~ 1
  const shoulderY = a.headY + 12
  const FEATHERS = 7
  for (const side of [-1, 1]) {
    const sx = a.cx + side * 6
    for (let f = 0; f < FEATHERS; f++) {
      // 위쪽 깃털일수록 길고 위를 향한다. 퍼덕일 때 위쪽 깃털이 더 크게 움직인다
      const k = f / (FEATHERS - 1) // 0 = 맨 위 깃털
      const len = 25 - k * 13
      const ang = (-0.95 + k * 1.15) + flap * (0.22 - k * 0.12)
      const ex = sx + side * Math.cos(ang) * len
      const ey = shoulderY + Math.sin(ang) * len + k * 2
      const n = Math.ceil(len)
      for (let i = 0; i <= n; i++) {
        const u = i / n
        const x = sx + (ex - sx) * u
        const y = shoulderY + k * 2 + (ey - shoulderY - k * 2) * u
        const tip = u > 0.8
        // 깃털 두께 — 가운데는 두 칸, 끝은 한 칸
        px(ctx, tip ? '#e8eef8' : '#ffffff', x, y, 1)
        if (!tip) px(ctx, '#ffffff', x, y + 1, 1)
        px(ctx, '#b9c6dd', x, y + (tip ? 1 : 2), 0.9) // 아랫면 그림자
      }
    }
    // 날개 윤곽 끝 반짝임
    const tipAng = -0.95 + flap * 0.22
    twinkle(ctx, sx + side * Math.cos(tipAng) * 25, shoulderY + Math.sin(tipAng) * 25, 1, 0.5 + 0.5 * Math.sin(t / 300 + side))
  }
}

const DRAW: Record<AuraId, (ctx: Ctx, a: AuraAnchor, t: number, layer: 'back' | 'front') => void> = {
  'gold-halo': goldHalo,
  thunder,
  'blue-flame': blueFlame,
  sakura,
  'angel-wings': angelWings,
}

export function drawAura(ctx: Ctx, id: AuraId, anchor: AuraAnchor, t: number, layer: 'back' | 'front') {
  ctx.save()
  DRAW[id](ctx, anchor, t, layer)
  ctx.restore()
}
