// 아바타 설정(JSON) → 픽셀 합성. 브라우저 API를 쓰지 않는 순수 함수라
// 미리보기 스크립트나 추첨 화면 같은 다른 캔버스에서도 그대로 재사용할 수 있다.

import {
  BASE, BOTTOMS, BOTTOM_COLORS, FIXED_COLORS, HAIRS, HAIR_COLORS, SKIN_TONES,
  SPRITE_H, SPRITE_W, TOPS, TOP_COLORS,
  type Gender, type Layer,
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
}

export type AvatarNumberKey = Exclude<keyof AvatarConfig, 'v' | 'gender'>

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
  return out
}

// 캐시 키로 쓰는 짧은 문자열. 순서가 고정이라 같은 설정이면 항상 같은 값이 나온다.
export function avatarKey(c: AvatarConfig): string {
  return [c.v, c.gender, c.skin, c.hair, c.hairColor, c.top, c.topColor, c.bottom, c.bottomColor].join('-')
}

// ───────── 스프라이트 ─────────

// 외곽선까지 붙인 스프라이트 크기
export const OUTLINED_W = SPRITE_W + 2
export const OUTLINED_H = SPRITE_H + 2

// 설정 → 외곽선 포함 문자 격자. 추첨 화면처럼 직접 칸을 칠하는 곳에서 쓴다.
export function buildAvatarGrid(c: AvatarConfig): string[] {
  const grid: string[][] = Array.from({ length: SPRITE_H }, () => Array(SPRITE_W).fill('.'))
  const draw = (layers: Layer[]) => {
    for (const layer of layers) {
      layer.rows.forEach((raw, dy) => {
        const row = raw.length === SPRITE_W ? raw : `.${raw}.`
        for (let x = 0; x < SPRITE_W; x++) if (row[x] !== '.') grid[layer.y + dy][x] = row[x]
      })
    }
  }
  // 그리는 순서 = 겹치는 순서(뒤 → 앞)
  draw(BASE)
  draw(BOTTOMS[c.gender][c.bottom].layers)
  draw(TOPS[c.top].layers)
  draw(HAIRS[c.gender][c.hair].layers)

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

export function avatarColors(c: AvatarConfig): Record<string, string> {
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

  const colors = avatarColors(c)
  buildAvatarGrid(c).forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue
      put(ox + x, oy + y, hexToRgb(colors[row[x]]))
    }
  })
  return px
}
