/*
 * 번개 추첨 연출의 장면 데이터 — 공원 배경, 아바타 배치, 먹구름 경로, 번개 모양.
 * 같은 seed(응모 상품 ID)면 누가 봐도 같은 장면이 나오도록 전부 시드 난수로 만든다.
 * 연출은 이미 정해진 당첨 결과를 보여주기만 한다 — 여기서 당첨자를 고르지 않는다.
 */

export const WORLD_W = 208
export const WORLD_H = 156
// 먹구름이 아바타 머리 위 얼마나 높이 떠 있는지 (월드 픽셀)
export const CLOUD_ALT = 40

type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 프레임마다 다시 계산해도 같은 값이 나오는 0~1 해시 (빗줄기, 불꽃 등)
export function hash01(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

function lerpNum(a: number, b: number, k: number): number {
  return a + (b - a) * k
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ── 아바타 ──

export interface AvatarLook {
  skin: string
  hair: string
  shirt: string
  pants: string
  longHair: boolean
}

export interface CastMember {
  x: number // 발 위치
  y: number
  look: AvatarLook
  isMe: boolean
  isWinner: boolean
  phase: number // 숨쉬기/눈깜빡임 타이밍을 사람마다 어긋나게
}

const SKINS = ['#f5d3b3', '#eab890', '#c99066', '#8f5b3c'] as const
const HAIRS = ['#2b2118', '#5a3a22', '#c9a063', '#1f1f2e', '#a83f3a', '#ece4d4'] as const
const SHIRTS = ['#4a7fd6', '#e3a33a', '#46b37b', '#9a6fd8', '#e0e0e0', '#39a6b3', '#e872a0', '#6b7280'] as const
const PANTS = ['#2d3a5c', '#3b3b44', '#5c4630', '#26303a'] as const
// 내 아바타는 브랜드 레드 셔츠로 고정 — 꾸미기가 생기면 저장된 착장으로 교체
const MY_SHIRT = '#d93347'

function randomLook(rng: Rng, shirt?: string): AvatarLook {
  return {
    skin: pick(rng, SKINS),
    hair: pick(rng, HAIRS),
    shirt: shirt ?? pick(rng, SHIRTS),
    pants: pick(rng, PANTS),
    longHair: rng() < 0.4,
  }
}

// 8x11 픽셀 사람 — H 머리, S 피부, E 눈, T 상의, P 하의, B 신발
const BODY_SHORT = [
  '..HHHH..',
  '.HHHHHH.',
  '.HSSSSH.',
  '.SESSES.',
  '..SSSS..',
  '.TTTTTT.',
  'STTTTTTS',
  '..TTTT..',
  '..PPPP..',
  '..P..P..',
  '.BB..BB.',
]
const BODY_LONG = [
  '..HHHH..',
  '.HHHHHH.',
  '.HSSSSH.',
  'HSESSESH',
  'HHSSSSHH',
  'HTTTTTTH',
  'STTTTTTS',
  '..TTTT..',
  '..PPPP..',
  '..P..P..',
  '.BB..BB.',
]
export const AVATAR_H = 11

// 바깥 1픽셀 테두리(O)를 붙여서 잔디 위에서도 실루엣이 또렷하게
function withOutline(rows: string[]): string[] {
  const h = rows.length + 2
  const w = rows[0].length + 2
  const at = (x: number, y: number) => (y >= 1 && y <= rows.length && x >= 1 && x <= rows[0].length ? rows[y - 1][x - 1] : '.')
  const out: string[] = []
  for (let y = 0; y < h; y++) {
    let line = ''
    for (let x = 0; x < w; x++) {
      const c = at(x, y)
      if (c !== '.') line += c
      else line += [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some(n => n !== '.') ? 'O' : '.'
    }
    out.push(line)
  }
  return out
}

const SPRITES = {
  short: withOutline(BODY_SHORT),
  long: withOutline(BODY_LONG),
  shortBlink: withOutline(BODY_SHORT.map(r => r.replace(/E/g, 'S'))),
  longBlink: withOutline(BODY_LONG.map(r => r.replace(/E/g, 'S'))),
}

export interface AvatarDrawOptions {
  lift?: number // 위로 뜬 높이 (점프, 숨쉬기)
  blink?: boolean
  zap?: 0 | 1 | null // 번개 맞은 직후 번쩍임 (두 색을 번갈아)
  outline?: string
}

export function drawAvatar(ctx: CanvasRenderingContext2D, m: CastMember, opts: AvatarDrawOptions = {}) {
  const lift = Math.round(opts.lift ?? 0)
  // 그림자는 땅에 붙어 있고, 몸만 뜬다
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
  ctx.fillRect(m.x - 3, m.y, 7, 1)
  ctx.fillRect(m.x - 2, m.y + 1, 5, 1)

  const key = (m.look.longHair ? 'long' : 'short') + (opts.blink ? 'Blink' : '')
  const grid = SPRITES[key as keyof typeof SPRITES]
  const ox = m.x - 5
  const oy = m.y - AVATAR_H - 1 - lift
  const zapColor = opts.zap === 0 ? '#ffffff' : '#ffe66b'
  const colors: Record<string, string> = opts.zap != null
    ? { H: zapColor, S: zapColor, E: '#3a2a00', T: zapColor, P: zapColor, B: zapColor, O: '#fff3a0' }
    : { H: m.look.hair, S: m.look.skin, E: '#1a1a22', T: m.look.shirt, P: m.look.pants, B: '#2a2420', O: opts.outline ?? '#16200f' }

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]
    for (let x = 0; x < row.length; x++) {
      const c = row[x]
      if (c === '.') continue
      ctx.fillStyle = colors[c]
      ctx.fillRect(ox + x, oy + y, 1, 1)
    }
  }
}

// ── 먹구름 ──

export function buildCloudSprites(): { dark: HTMLCanvasElement; lit: HTMLCanvasElement } {
  const w = 46
  const h = 26
  const blobs: [number, number, number][] = [[12, 15, 9], [23, 11, 11], [34, 15, 9], [18, 18, 7], [29, 18, 7]]
  const inside = (x: number, y: number) => blobs.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r)
  const paint = (top: string, mid: string, bottom: string, edge: string) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (inside(x, y)) {
          ctx.fillStyle = y < 9 ? top : y > 19 ? bottom : mid
        } else if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) {
          ctx.fillStyle = edge
        } else continue
        ctx.fillRect(x, y, 1, 1)
      }
    }
    return c
  }
  return {
    dark: paint('#6a7086', '#474c5e', '#2c303d', '#1a1d26'),
    lit: paint('#f2f4ff', '#c4cae6', '#949cbe', '#5c6384'),
  }
}

// ── 공원 + 배치 ──

const Ground = { Grass: 0, Path: 1, Water: 2, Tree: 3, Bench: 4 } as const

export interface Scene {
  base: HTMLCanvasElement
  cast: CastMember[]
  me: CastMember
  winner: CastMember
  cloudStops: CastMember[] // 먹구름이 들르는 순서 (마지막이 번개 직전에 멈추는 사람)
  fakeTarget: CastMember | null // 구름은 이 사람 위에 있는데 번개는 당첨자에게 꺾여 가는 반전 (없으면 null)
  bolt: { x: number; y: number }[][] // [본줄기, 곁가지...]
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function buildScene(seed: number, opts: { meIsWinner: boolean; crowdSize: number }): Scene {
  const rng = mulberry32(seed * 7919 + 17)
  const W = WORLD_W
  const H = WORLD_H
  const img = new ImageData(W, H)
  const ground = new Uint8Array(W * H)
  const set = (x: number, y: number, hex: string) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const [r, g, b] = hexToRgb(hex)
    const i = (y * W + x) * 4
    img.data[i] = r
    img.data[i + 1] = g
    img.data[i + 2] = b
    img.data[i + 3] = 255
  }

  // 잔디: 4x4 타일마다 살짝 다른 초록 + 풀포기
  const grassTones = ['#4e8a3b', '#54913f', '#4a8438']
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tone = grassTones[Math.floor(hash01(((x >> 2) * 73856093) ^ ((y >> 2) * 19349663) ^ seed) * 3)]
      const r = rng()
      set(x, y, r < 0.03 ? '#3d7330' : r < 0.04 ? '#6aa84f' : tone)
    }
  }

  // 산책로: 가운데 타원 고리 + 아래·왼쪽으로 빠지는 길
  const pcx = 104
  const pcy = 82
  const prx = 70
  const pry = 44
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.sqrt(((x - pcx) / prx) ** 2 + ((y - pcy) / pry) ** 2)
      const ringDist = Math.abs(d - 1) * 56
      const onSpur = (x >= 100 && x <= 108 && y > pcy + pry) || (y >= 78 && y <= 86 && x < pcx - prx)
      const spurEdge = (x >= 99 && x <= 109 && y > pcy + pry) || (y >= 77 && y <= 87 && x < pcx - prx)
      if (ringDist < 3.6 || onSpur) {
        set(x, y, rng() < 0.05 ? '#b5935c' : '#c8a46a')
        ground[y * W + x] = Ground.Path
      } else if (ringDist < 4.6 || spurEdge) {
        set(x, y, '#a88650')
        ground[y * W + x] = Ground.Path
      }
    }
  }

  // 연못 (왼쪽 위)
  const wcx = 30
  const wcy = 24
  const wrx = 22
  const wry = 13
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.sqrt(((x - wcx) / wrx) ** 2 + ((y - wcy) / wry) ** 2)
      if (d < 0.86) set(x, y, '#3b7cb5')
      else if (d < 1) set(x, y, '#2c5d8a')
      else if (d < 1.16) set(x, y, '#d8c08a')
      else continue
      ground[y * W + x] = Ground.Water
    }
  }
  for (let i = 0; i < 5; i++) {
    const hx = wcx - 12 + Math.floor(rng() * 22)
    const hy = wcy - 6 + Math.floor(rng() * 11)
    for (let k = 0; k < 3; k++) set(hx + k, hy, '#9fd0f0')
  }

  // 벤치 (산책로 안쪽)
  const benches: [number, number][] = [[pcx - 30, pcy - pry + 8], [pcx + 38, pcy + 20], [pcx - 44, pcy + 22]]
  for (const [bx, by] of benches) {
    for (let x = 0; x < 9; x++) {
      set(bx + x, by, '#8a5a34')
      set(bx + x, by + 1, '#6e4528')
      ground[by * W + bx + x] = Ground.Bench
      ground[(by + 1) * W + bx + x] = Ground.Bench
    }
    set(bx, by + 2, '#3e2a1a')
    set(bx + 8, by + 2, '#3e2a1a')
  }

  // 꽃
  const flowers = ['#f7f1e3', '#f6c945', '#ef8fb0', '#b9a0f0']
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(rng() * W)
    const y = Math.floor(rng() * H)
    if (ground[y * W + x] === Ground.Grass) set(x, y, pick(rng, flowers))
  }

  // 나무: 가장자리를 따라 둘러서, 아바타가 나무에 가려질 일이 없게
  const trees: [number, number, number][] = []
  for (let x = 8; x < W; x += 15 + Math.floor(rng() * 6)) {
    trees.push([x + Math.floor(rng() * 4), 3 + Math.floor(rng() * 4), 6 + Math.floor(rng() * 3)])
    trees.push([x + Math.floor(rng() * 4), H - 3 - Math.floor(rng() * 4), 6 + Math.floor(rng() * 3)])
  }
  for (let y = 24; y < H - 16; y += 16 + Math.floor(rng() * 6)) {
    trees.push([2 + Math.floor(rng() * 4), y, 6 + Math.floor(rng() * 3)])
    trees.push([W - 3 - Math.floor(rng() * 4), y, 6 + Math.floor(rng() * 3)])
  }
  const isPondArea = (x: number, y: number) => ((x - wcx) / (wrx + 8)) ** 2 + ((y - wcy) / (wry + 8)) ** 2 < 1
  const keptTrees = trees.filter(([x, y]) => !isPondArea(x, y))
  for (const [tx, ty, r] of keptTrees) {
    for (let y = -r - 2; y <= r + 4; y++) {
      for (let x = -r - 2; x <= r + 4; x++) {
        const sd = (x - 2) ** 2 + (y - 3) ** 2
        if (sd <= r * r && x * x + y * y > (r + 1) ** 2) set(tx + x, ty + y, '#3a6a2d')
      }
    }
    for (let y = -r - 1; y <= r + 1; y++) {
      for (let x = -r - 1; x <= r + 1; x++) {
        const d2 = x * x + y * y
        const px = tx + x
        const py = ty + y
        if (d2 <= r * r) {
          const s = x + y
          set(px, py, s < -r * 0.5 ? '#4f9a3f' : s > r * 0.6 ? '#245a22' : '#2f7329')
        } else if (d2 <= (r + 1) ** 2) {
          set(px, py, '#1a3a17')
        } else continue
        if (px >= 0 && py >= 0 && px < W && py < H) ground[py * W + px] = Ground.Tree
      }
    }
  }

  const base = document.createElement('canvas')
  base.width = W
  base.height = H
  base.getContext('2d')!.putImageData(img, 0, 0)

  // 아바타 배치: 물·나무·벤치를 피하고, 서로 너무 붙지 않게
  const canStand = (fx: number, fy: number, placed: { x: number; y: number }[]) => {
    if (fx < 12 || fx > W - 12 || fy < 18 || fy > H - 8) return false
    for (let y = fy - AVATAR_H - 1; y <= fy + 1; y++) {
      for (let x = fx - 5; x <= fx + 5; x++) {
        const g = ground[y * W + x]
        if (g === Ground.Water || g === Ground.Tree || g === Ground.Bench) return false
      }
    }
    return placed.every(p => (p.x - fx) ** 2 + (p.y - fy) ** 2 >= 13 * 13)
  }
  const spots: { x: number; y: number }[] = []
  for (let tries = 0; tries < 6000 && spots.length < opts.crowdSize; tries++) {
    const x = 12 + Math.floor(rng() * (W - 24))
    const y = 18 + Math.floor(rng() * (H - 26))
    if (canStand(x, y, spots)) spots.push({ x, y })
  }

  const cast: CastMember[] = spots.map((s, i) => ({
    x: s.x,
    y: s.y,
    look: randomLook(rng),
    isMe: false,
    isWinner: false,
    phase: Math.floor(hash01(seed + i * 31) * 4000),
  }))

  // 먹구름은 머리 위 CLOUD_ALT 높이에 뜨므로, 구름이 들르는 사람은 위쪽에 여유가 있어야 화면 밖으로 안 잘린다
  const underOpenSky = (m: CastMember) => m.y >= CLOUD_ALT + 16
  const skyCast = cast.filter(underOpenSky)
  const orAll = (list: CastMember[], fallback: CastMember[]) => (list.length > 0 ? list : fallback)

  // 나는 화면 가운데 쪽 사람으로 — 첫 클로즈업이 공원 구석에 박히지 않게
  const centerScore = (m: CastMember) => (m.x - W / 2) ** 2 + ((m.y - H / 2) * 1.3) ** 2
  const meCandidates = orAll(skyCast, cast)
  const nearCenter = [...meCandidates].sort((a, b) => centerScore(a) - centerScore(b)).slice(0, Math.max(1, Math.ceil(meCandidates.length / 3)))
  const me = pick(rng, nearCenter)
  me.isMe = true
  me.look = randomLook(rng, MY_SHIRT)

  let winner = me
  if (!opts.meIsWinner) {
    const others = cast.filter(m => m !== me)
    winner = others.length > 0 ? pick(rng, orAll(others.filter(underOpenSky), others)) : me
  }
  winner.isWinner = true

  // 반전: 가끔은 구름이 엉뚱한 사람(근처) 위에서 충전하다가 번개를 옆으로 꺾어 진짜 당첨자에게 쏜다.
  // 낙첨인데 내가 근처에 있으면 내가 "가짜 표적"이 될 확률을 높여서 더 아슬아슬하게.
  const distTo = (a: CastMember, b: CastMember) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  const fakeCandidates = cast.filter(m => m !== winner && underOpenSky(m) && distTo(m, winner) >= 20 && distTo(m, winner) <= 70)
  let fakeTarget: CastMember | null = null
  if (fakeCandidates.length > 0 && rng() < 0.4) {
    fakeTarget = !opts.meIsWinner && fakeCandidates.includes(me) && rng() < 0.5 ? me : pick(rng, fakeCandidates)
  }
  const hoverTarget = fakeTarget ?? winner

  // 먹구름 동선: 다른 사람 머리 위를 지나 (내가 낙첨이면 내 위에서 한 번 멈칫) → 마지막으로 멈추는 사람
  const decoyPool = orAll(skyCast, cast).filter(m => m !== me && m !== winner && m !== hoverTarget)
  const far = [...decoyPool].sort((a, b) => distTo(b, hoverTarget) - distTo(a, hoverTarget))
  const cloudStops: CastMember[] = []
  if (far.length > 0) cloudStops.push(pick(rng, far.slice(0, Math.max(1, Math.ceil(far.length / 2)))))
  if (!opts.meIsWinner && hoverTarget !== me) cloudStops.push(me)
  else {
    const second = decoyPool.filter(m => !cloudStops.includes(m))
    if (second.length > 0) cloudStops.push(pick(rng, second))
  }
  cloudStops.push(hoverTarget)

  // 번개: 구름 밑에서 당첨자 머리까지 지그재그 + 곁가지 (반전이면 비스듬히 꺾여 내려간다)
  const top = { x: hoverTarget.x, y: hoverTarget.y - CLOUD_ALT + 6 }
  const end = { x: winner.x, y: winner.y - AVATAR_H - 1 }
  const len = Math.sqrt((end.x - top.x) ** 2 + (end.y - top.y) ** 2)
  const steps = Math.max(6, Math.round(len / 7))
  // 진행 방향에 수직으로 흔들어야 비스듬한 번개도 지그재그로 보인다
  const nx = -(end.y - top.y) / len
  const ny = (end.x - top.x) / len
  const main = [top]
  for (let i = 1; i < steps; i++) {
    const k = i / steps
    const jitter = (rng() - 0.5) * 9
    main.push({ x: Math.round(lerpNum(top.x, end.x, k) + nx * jitter), y: Math.round(lerpNum(top.y, end.y, k) + ny * jitter) })
  }
  main.push(end)
  const fork = main[2]
  const dir = rng() < 0.5 ? -1 : 1
  const branch = [fork, { x: fork.x + dir * 4, y: fork.y + 4 }, { x: fork.x + dir * 6, y: fork.y + 9 }]

  return { base, cast, me, winner, cloudStops, fakeTarget, bolt: [main, branch] }
}

// ── 픽셀 도형 도우미 ──

export function plotLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, size = 1) {
  let x = Math.round(x0)
  let y = Math.round(y0)
  const tx = Math.round(x1)
  const ty = Math.round(y1)
  const dx = Math.abs(tx - x)
  const dy = -Math.abs(ty - y)
  const sx = x < tx ? 1 : -1
  const sy = y < ty ? 1 : -1
  let err = dx + dy
  const off = Math.floor(size / 2)
  for (;;) {
    ctx.fillRect(x - off, y - off, size, size)
    if (x === tx && y === ty) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x += sx }
    if (e2 <= dx) { err += dx; y += sy }
  }
}

export function fillPixelEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  const ry0 = Math.round(ry)
  for (let y = -ry0; y <= ry0; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))))
    if (half > 0) ctx.fillRect(Math.round(cx) - half, Math.round(cy) + y, half * 2 + 1, 1)
  }
}

export function strokePixelCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const steps = Math.max(12, Math.round(r * 7))
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.6), 1, 1)
  }
}
