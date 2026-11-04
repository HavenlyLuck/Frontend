// 아바타 설정(JSON) → 픽셀 합성. 브라우저 API를 쓰지 않는 순수 함수라
// 미리보기 스크립트나 다른 캔버스에서도 그대로 재사용할 수 있다.
//
// 그림은 hd.ts — 기본 캐릭터(똥머리·흰 티·잔디 발판) 위에 머리·옷·모자·손 층을 차례로 덮어 그린다.

import { HD_BASE, HD_H, HD_ITEMS, HD_PALETTE, HD_W } from './hd'
import { AVATAR_SHOP_ITEMS, HAIRS, WEAR_SLOTS, type HairId, type WearSlot } from './shopItems'

export type { HairId, WearSlot }
export { WEAR_SLOTS }

export interface AvatarConfig {
  v: 3
  hair: HairId
  // 쌀포인트 상점 아이템 id (shopItems.ts). 없으면 기본 그림 그대로
  outfit?: string
  hat?: string
  held?: string
}

export const AVATAR_W = HD_W
export const AVATAR_H = HD_H

export const DEFAULT_AVATAR: AvatarConfig = { v: 3, hair: 'buns' }

const HAIR_IDS = new Set<string>(HAIRS.map(h => h.id))
const itemSlot = new Map(AVATAR_SHOP_ITEMS.map(i => [i.id, i.slot]))

// 서버에서 받은 값이 비었거나 예전 형식(v2)이어도 항상 그릴 수 있는 설정으로 맞춘다.
// 예전 캐릭터는 성별만 살린다: 남자 → 짧은 머리, 여자 → 똥머리 (예전 아이템은 그림이 없어 벗긴다).
export function normalizeAvatar(raw: unknown): AvatarConfig {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  if (src.v !== 3) return { v: 3, hair: src.gender === 'm' ? 'short' : 'buns' }
  const out: AvatarConfig = { v: 3, hair: typeof src.hair === 'string' && HAIR_IDS.has(src.hair) ? (src.hair as HairId) : 'buns' }
  for (const slot of WEAR_SLOTS) {
    const id = src[slot]
    if (typeof id === 'string' && itemSlot.get(id) === slot) out[slot] = id
  }
  return out
}

// 아이템을 입히거나(id) 벗긴다(undefined).
export function withItem(c: AvatarConfig, slot: WearSlot, id: string | undefined): AvatarConfig {
  const next = { ...c }
  if (id == null) delete next[slot]
  else next[slot] = id
  return next
}

// 캐시 키로 쓰는 짧은 문자열. 순서가 고정이라 같은 설정이면 항상 같은 값이 나온다.
export function avatarKey(c: AvatarConfig): string {
  return [c.v, c.hair, c.outfit ?? 'x', c.hat ?? 'x', c.held ?? 'x'].join('-')
}

// 겹쳐 그릴 층 (뒤 → 앞)
function layersOf(c: AvatarConfig): string[][] {
  const ids = [HAIRS.find(h => h.id === c.hair)?.layer, c.outfit, c.hat, c.held]
  return ids.filter((id): id is string => !!id && !!HD_ITEMS[id]).map(id => HD_ITEMS[id])
}

// 배경을 깔 때 쓰는 색 (참고 그림의 연두색)
export const AVATAR_BG = '#dce594'

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const RGB: Record<string, [number, number, number]> = Object.fromEntries(Object.entries(HD_PALETTE).map(([k, v]) => [k, hexToRgb(v)]))

// RGBA 픽셀 (AVATAR_W × AVATAR_H). background면 연두색 배경을 깐다.
export function composeAvatar(c: AvatarConfig, { background = false } = {}): Uint8ClampedArray<ArrayBuffer> {
  const px = new Uint8ClampedArray(AVATAR_W * AVATAR_H * 4)
  const set = (x: number, y: number, rgb: [number, number, number] | null) => {
    const o = (y * AVATAR_W + x) * 4
    if (!rgb) { px[o + 3] = 0; return }
    px[o] = rgb[0]; px[o + 1] = rgb[1]; px[o + 2] = rgb[2]; px[o + 3] = 255
  }
  const paint = (rows: string[]) => rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.') continue
      set(x, y, ch === '-' ? null : RGB[ch])
    }
  })
  paint(HD_BASE)
  layersOf(c).forEach(paint)
  if (background) {
    const bg = hexToRgb(AVATAR_BG)
    for (let i = 0; i < AVATAR_W * AVATAR_H; i++) if (px[i * 4 + 3] === 0) set(i % AVATAR_W, Math.floor(i / AVATAR_W), bg)
  }
  return px
}

// 샘플 화면(추첨 미리보기, 대회 데모)에 세울 아무 캐릭터
export function randomAvatar(rng: () => number): AvatarConfig {
  let c: AvatarConfig = { v: 3, hair: rng() < 0.5 ? 'short' : 'buns' }
  for (const item of AVATAR_SHOP_ITEMS) if (rng() < 0.35) c = withItem(c, item.slot, item.id)
  return c
}
