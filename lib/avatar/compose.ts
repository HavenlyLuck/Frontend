// 아바타 설정(JSON) → 픽셀 합성. 브라우저 API를 쓰지 않는 순수 함수라
// 미리보기 스크립트나 추첨 화면 같은 다른 캔버스에서도 그대로 재사용할 수 있다.

import {
  BASE, BOTTOMS, COSTUMES, BOTTOM_COLORS, FIXED_COLORS, HAIRS, HAIR_COLORS, SKIN_TONES,
  CAPES, HATS, HELD_OUTLINED, SPRITE_H, SPRITE_W, TOPS, TOP_COLORS, WEAPONS,
  type Gender, type HeldItem, type Layer,
} from './parts'

export interface AvatarConfig {
  v: 2
  gender: Gender
  skin: number
  hair: number
  hairColor: number
  top: number
  topColor: number
  bottom: number
  bottomColor: number
  // 쌀포인트 상점 아이템 — 손에 든 무기(WEAPONS 번호), 머리에 쓴 모자(HATS 번호), 망토(CAPES 번호). 없으면 안 그린다.
  weapon?: number
  hat?: number
  cape?: number
  // 전체 스킨(COSTUMES 번호) — 끼면 몸 전체를 스킨으로 그리고 무기·모자·망토와는 같이 못 낀다
  costume?: number
}

// 상점 아이템 칸 — 겹쳐 그리는 순서(뒤 → 앞)이기도 하다
export const ITEM_SLOTS = { cape: CAPES, hat: HATS, weapon: WEAPONS } as const
export type ItemSlot = keyof typeof ITEM_SLOTS
// 상점에서 낄 수 있는 칸 — 겹쳐 끼는 아이템 + 전체 스킨
export type WearSlot = ItemSlot | 'costume'

export type AvatarNumberKey = Exclude<keyof AvatarConfig, 'v' | 'gender' | WearSlot>

export const DEFAULT_AVATARS: Record<Gender, AvatarConfig> = {
  m: { v: 2, gender: 'm', skin: 0, hair: 0, hairColor: 0, top: 0, topColor: 0, bottom: 0, bottomColor: 0 },
  f: { v: 2, gender: 'f', skin: 0, hair: 0, hairColor: 1, top: 0, topColor: 0, bottom: 0, bottomColor: 0 },
}
export const DEFAULT_AVATAR = DEFAULT_AVATARS.m

// 각 항목이 고를 수 있는 개수. 성별마다 머리·하의 종류는 달라도 개수는 같다.
// 백엔드 검증(Backend/app/schemas/avatar.py)과 반드시 맞춰야 한다.
export const AVATAR_LIMITS: Record<AvatarNumberKey, number> = {
  skin: SKIN_TONES.length,
  hair: HAIRS.m.length,
  hairColor: HAIR_COLORS.length,
  top: TOPS.length,
  topColor: TOP_COLORS.length,
  bottom: BOTTOMS.m.length,
  bottomColor: BOTTOM_COLORS.length,
}

// 서버에서 받은 값이 비었거나 예전 형식이어도 항상 그릴 수 있는 설정으로 맞춘다.
export function normalizeAvatar(raw: unknown): AvatarConfig {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const gender: Gender = src.gender === 'f' ? 'f' : 'm'
  const out = { ...DEFAULT_AVATARS[gender] }
  if (src.v !== 2) return out
  for (const key of Object.keys(AVATAR_LIMITS) as AvatarNumberKey[]) {
    const v = src[key]
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < AVATAR_LIMITS[key]) out[key] = v
  }
  for (const slot of Object.keys(ITEM_SLOTS) as ItemSlot[]) {
    const v = src[slot]
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < ITEM_SLOTS[slot].length) out[slot] = v
  }
  const costume = src.costume
  if (typeof costume === 'number' && Number.isInteger(costume) && costume >= 0 && costume < COSTUMES.length) {
    return withItem(out, 'costume', costume)
  }
  return out
}

// 아이템을 끼우거나(index) 벗긴다(undefined). 전체 스킨과 무기·모자·망토는 같이 못 끼므로
// 스킨을 끼면 다른 아이템을 벗기고, 다른 아이템을 끼면 스킨을 벗긴다.
export function withItem(c: AvatarConfig, slot: WearSlot, index: number | undefined): AvatarConfig {
  const next = { ...c }
  if (index == null) {
    delete next[slot]
    return next
  }
  if (slot === 'costume') {
    for (const s of Object.keys(ITEM_SLOTS) as ItemSlot[]) delete next[s]
  } else {
    delete next.costume
  }
  next[slot] = index
  return next
}

// 캐시 키로 쓰는 짧은 문자열. 순서가 고정이라 같은 설정이면 항상 같은 값이 나온다.
export function avatarKey(c: AvatarConfig): string {
  return [c.v, c.gender, c.skin, c.hair, c.hairColor, c.top, c.topColor, c.bottom, c.bottomColor, c.cape ?? 'x', c.hat ?? 'x', c.weapon ?? 'x', c.costume ?? 'x'].join('-')
}

// ───────── 스프라이트 ─────────

// 외곽선까지 붙인 스프라이트 크기
export const OUTLINED_W = SPRITE_W + 2
export const OUTLINED_H = SPRITE_H + 2

// 설정 → 외곽선 포함 문자 격자. 추첨 화면처럼 직접 칸을 칠하는 곳에서 쓴다.
export function buildAvatarGrid(c: AvatarConfig): string[] {
  const costume = c.costume == null ? undefined : COSTUMES[c.costume]
  const grid: string[][] = costume
    ? costume.rows.map(r => r.split(''))
    : Array.from({ length: SPRITE_H }, () => Array(SPRITE_W).fill('.'))
  const draw = (layers: Layer[]) => {
    for (const layer of layers) {
      layer.rows.forEach((raw, dy) => {
        const row = raw.length === SPRITE_W ? raw : `.${raw}.`
        for (let x = 0; x < SPRITE_W; x++) if (row[x] !== '.') grid[layer.y + dy][x] = row[x]
      })
    }
  }
  // 그리는 순서 = 겹치는 순서(뒤 → 앞). 전체 스킨은 격자를 통째로 쓴다.
  if (!costume) {
    draw(BASE)
    draw(BOTTOMS[c.gender][c.bottom].layers)
    draw(TOPS[c.top].layers)
    draw(HAIRS[c.gender][c.hair].layers)
  }

  // 바깥 1칸 외곽선(O) — 잔디 위에서도 실루엣이 또렷하게
  const at = (x: number, y: number) => (y >= 1 && y <= SPRITE_H && x >= 1 && x <= SPRITE_W ? grid[y - 1][x - 1] : '.')
  const out: string[] = []
  for (let y = 0; y < OUTLINED_H; y++) {
    let line = ''
    for (let x = 0; x < OUTLINED_W; x++) {
      const ch = at(x, y)
      line += ch !== '.' ? ch : [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some(n => n !== '.') ? 'O' : '.'
    }
    out.push(line)
  }
  return out
}

// 상점 아이템(모자·무기) → 외곽선(o) 포함 문자 격자. dx/dy는 외곽선 포함 캐릭터 격자의 왼쪽 위 기준.
// 몸 격자 밖으로 나가므로 몸과 따로 만들어 몸 위에 겹쳐 그린다.
export interface HeldGrid {
  dx: number
  dy: number
  rows: string[]
  colors: Record<string, string>
  flicker?: Record<string, string>
  behind?: boolean // 몸보다 먼저(뒤에) 그린다
}

// 낀 아이템들을 그리는 순서(뒤 → 앞)대로
export function buildOverlayGrids(c: AvatarConfig): HeldGrid[] {
  const body = buildAvatarGrid(c)
  const onBody = (x: number, y: number) => (body[y]?.[x] ?? '.') !== '.'
  // 전체 스킨은 다른 아이템을 같이 못 끼고, 스킨에 딸린 소품만 그린다
  const items: HeldItem[] = c.costume != null
    ? [COSTUMES[c.costume]?.held].filter((h): h is HeldItem => !!h)
    : (Object.keys(ITEM_SLOTS) as ItemSlot[]).flatMap((slot) => {
      const idx = c[slot]
      const item = idx == null ? undefined : ITEM_SLOTS[slot][idx]
      return item ? [item] : []
    })
  const out: HeldGrid[] = []
  for (const item of items) {
    const h = item.rows.length
    const w = Math.max(...item.rows.map(r => r.length))
    const at = (x: number, y: number) => (y >= 0 && y < h && x >= 0 && x < w ? item.rows[y][x] ?? '.' : '.')
    const rows: string[] = []
    for (let y = -1; y <= h; y++) {
      let line = ''
      for (let x = -1; x <= w; x++) {
        const ch = at(x, y)
        if (ch !== '.') { line += ch; continue }
        const edge = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some(n => HELD_OUTLINED.has(n))
        // 몸 위에 테두리를 안 그리는 아이템은 맨 바깥(투명한 곳)에만 테두리를 붙인다
        line += edge && (item.outlineOverBody || !onBody(item.dx + x, item.dy + y)) ? 'o' : '.'
      }
      rows.push(line)
    }
    out.push({ dx: item.dx - 1, dy: item.dy - 1, rows, colors: { ...item.colors, o: FIXED_COLORS.O }, flicker: item.flicker, behind: item.behind })
  }
  return out
}

export function avatarColors(c: AvatarConfig): Record<string, string> {
  const costume = c.costume == null ? undefined : COSTUMES[c.costume]
  if (costume) return { ...FIXED_COLORS, ...costume.colors }
  return {
    ...FIXED_COLORS,
    S: SKIN_TONES[c.skin].color,
    H: HAIR_COLORS[c.hairColor].color,
    T: TOP_COLORS[c.topColor].color,
    P: BOTTOM_COLORS[c.bottomColor].color,
  }
}

// ───────── 프로필 이미지 ─────────

// 잔디 배경 위에 캐릭터를 올린 정사각형 이미지
export const AVATAR_CANVAS = 16
const GRASS = ['#5f9446', '#568a3f', '#6aa150']

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function composeAvatar(c: AvatarConfig, { background = true } = {}): Uint8ClampedArray<ArrayBuffer> {
  const size = AVATAR_CANVAS
  const px = new Uint8ClampedArray(size * size * 4)
  const put = (x: number, y: number, rgb: [number, number, number], a = 255) => {
    const i = (y * size + x) * 4
    const k = a / 255
    px[i] = Math.round(rgb[0] * k + px[i] * (1 - k))
    px[i + 1] = Math.round(rgb[1] * k + px[i + 1] * (1 - k))
    px[i + 2] = Math.round(rgb[2] * k + px[i + 2] * (1 - k))
    px[i + 3] = Math.max(px[i + 3], a)
  }

  const ox = Math.floor((size - OUTLINED_W) / 2)
  const oy = 1
  const footY = oy + OUTLINED_H

  if (background) {
    // 고정된 무늬라 같은 설정이면 항상 같은 이미지가 나온다
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const h = ((x * 73856093) ^ (y * 19349663)) >>> 0
        const tone = h % 11 === 0 ? 1 : h % 13 === 0 ? 2 : 0
        put(x, y, hexToRgb(GRASS[tone]))
      }
    }
    // 발밑 그림자
    const shadow: [number, number, number] = [0, 0, 0]
    for (let x = ox + 3; x < ox + OUTLINED_W - 3; x++) put(x, footY - 1, shadow, 70)
    for (let x = ox + 4; x < ox + OUTLINED_W - 4; x++) put(x, footY, shadow, 70)
  }

  // 상점 아이템 — 캔버스 밖으로 나가는 칸(외곽선 일부)은 잘라낸다
  const overlays = buildOverlayGrids(c)
  const drawOverlay = (held: HeldGrid) => {
    held.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const px0 = ox + held.dx + x
        const py0 = oy + held.dy + y
        if (row[x] === '.' || px0 < 0 || py0 < 0 || px0 >= size || py0 >= size) continue
        put(px0, py0, hexToRgb(held.colors[row[x]]))
      }
    })
  }

  // 망토처럼 등 뒤에 두르는 것 → 몸 → 모자·무기 순으로 겹친다
  overlays.filter(o => o.behind).forEach(drawOverlay)
  const colors = avatarColors(c)
  buildAvatarGrid(c).forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue
      put(ox + x, oy + y, hexToRgb(colors[row[x]]))
    }
  })
  overlays.filter(o => !o.behind).forEach(drawOverlay)
  return px
}
