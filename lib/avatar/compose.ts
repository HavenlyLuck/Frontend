// 아바타 설정(JSON) → 픽셀 합성. 브라우저 API를 쓰지 않는 순수 함수라
// 미리보기 스크립트나 다른 캔버스에서도 그대로 재사용할 수 있다.
//
// 그림은 hd.ts — 기본 캐릭터(똥머리·흰 티) 위에 문신·표정·하의·신발·상의·머리·모자·손 층을 차례로 덮어 그린다.
// 원본 그림에는 잔디 발판이 붙어 있어서, 여기서 발판을 떼고 캐릭터만 남긴다 (stripTile).

import { HD_BASE, HD_ITEMS, HD_PALETTE, HD_W } from './hd'
import { AVATAR_SHOP_ITEMS, HAIRS, LAYER_ORDER, WEAR_SLOTS, type HairId, type WearSlot } from './shopItems'

export type { HairId, WearSlot }
export { WEAR_SLOTS }

export interface AvatarConfig {
  v: 3
  hair: HairId // 무료 머리 모양 (hairItem을 입으면 가려진다)
  // 칸마다 착용한 쌀포인트 상점 아이템 id (shopItems.ts). 없으면 기본 그림 그대로
  hairItem?: string
  face?: string
  tattoo?: string
  top?: string
  bottom?: string
  hat?: string
  shoes?: string
  held?: string
  background?: string
}

// 발판을 뗀 캐릭터 그림 크기 — 37행(0~36)까지가 캐릭터, 그 아래는 원본의 잔디 발판이라 버린다
export const AVATAR_W = HD_W
export const AVATAR_H = 37
// 발 바닥 행 — 받침대·선반 위에 세울 때 기준
export const AVATAR_FEET_ROW = 35

export const DEFAULT_AVATAR: AvatarConfig = { v: 3, hair: 'buns' }

const HAIR_IDS = new Set<string>(HAIRS.map(h => h.id))
const FULL_HEADS = new Set<string>(AVATAR_SHOP_ITEMS.filter(i => i.fullHead).map(i => i.id))
const itemSlot = new Map(AVATAR_SHOP_ITEMS.map(i => [i.id, i.slot]))

// 서버에서 받은 값이 비었거나 예전 형식(v2)이어도 항상 그릴 수 있는 설정으로 맞춘다.
// 예전 캐릭터는 성별만 살린다: 남자 → 짧은 머리, 여자 → 똥머리 (예전 아이템은 그림이 없어 벗긴다).
export function normalizeAvatar(raw: unknown): AvatarConfig {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  if (src.v !== 3) return { v: 3, hair: src.gender === 'm' ? 'short' : 'buns' }
  const out: AvatarConfig = { v: 3, hair: typeof src.hair === 'string' && HAIR_IDS.has(src.hair) ? (src.hair as HairId) : 'buns' }
  // 예전 "옷" 칸(outfit)에 입던 아이템은 지금 상의 칸 아이템이다
  const legacy = src.top == null && typeof src.outfit === 'string' ? { ...src, top: src.outfit } : src
  for (const slot of WEAR_SLOTS) {
    const id = legacy[slot]
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
  return [c.v, c.hair, ...WEAR_SLOTS.map(slot => c[slot] ?? 'x')].join('-')
}

// 겹쳐 그릴 층 (뒤 → 앞)
function layersOf(c: AvatarConfig): string[][] {
  // 상점 머리를 입었으면 무료 머리 모양 대신 그 머리를 그린다
  const hair = c.hairItem ?? HAIRS.find(h => h.id === c.hair)?.layer
  const ids = LAYER_ORDER.flatMap(slot => (slot === 'hat' ? [hair, c.hat] : [c[slot]]))
  return ids.filter((id): id is string => !!id && !!ITEMS[id]).map(id => ITEMS[id])
}

// 배경을 깔 때 쓰는 색 (참고 그림의 연두색)
export const AVATAR_BG = '#dce594'

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const RGB: Record<string, [number, number, number]> = Object.fromEntries(Object.entries(HD_PALETTE).map(([k, v]) => [k, hexToRgb(v)]))

// ── 잔디 발판 떼기 ──
// 원본 그림은 29행부터 다리와 잔디 발판이 겹친다. 다리는 가운데(14~23열)에만 있고, 발판은 초록 잔디·흙색이다.
const LEG_ROW = 29
const LEG_COLS: [number, number] = [14, 23]
const ITEM_COLS: [number, number] = [13, 25] // 부츠처럼 발판 쪽으로 조금 넓게 내려오는 아이템
const isGrass = (ch: string) => {
  const c = RGB[ch]
  if (!c) return false
  const [r, g, b] = c
  return r + g + b >= 260 && g >= r - 5 && g > b + 20
}
function stripTile(rows: string[], item: boolean): string[] {
  const [c0, c1] = item ? ITEM_COLS : LEG_COLS
  return rows.slice(0, AVATAR_H).map((row, y) => {
    if (y < LEG_ROW || (item && y < LEG_ROW + 2)) return row // 손에 든 꽃다발처럼 옆으로 나온 건 그대로
    if (!item && y > AVATAR_FEET_ROW) return '.'.repeat(row.length)
    return [...row].map((ch, x) => (x >= c0 && x <= c1 && ch !== '-' && !isGrass(ch) ? ch : '.')).join('')
  })
}
const BASE = stripTile(HD_BASE, false)
const ITEMS: Record<string, string[]> = Object.fromEntries(Object.entries(HD_ITEMS).map(([id, rows]) => [id, stripTile(rows, true)]))

// 눈 칸 (그림 좌표) — 양쪽 눈이 세로 4칸씩. 깜빡일 땐 위아래 칸을 피부색으로 덮고 한 줄만 남겨 감은 눈으로 만든다.
const EYE_COLUMNS = [15, 22]
const EYE_ROWS = [13, 14, 15, 16]
const EYE_CLOSED_ROW = 15
const SKIN = hexToRgb('#fde2cd')

// RGBA 픽셀 (AVATAR_W × AVATAR_H). background면 연두색 배경을 깐다. blink면 눈을 감은 모습.
export function composeAvatar(c: AvatarConfig, { background = false, blink = false } = {}): Uint8ClampedArray<ArrayBuffer> {
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
  paint(BASE)
  layersOf(c).forEach(paint)
  // 얼굴까지 바꾸는 머리는 눈 자리가 달라 깜빡이지 않는다
  if (blink && !FULL_HEADS.has(c.hairItem ?? '')) for (const x of EYE_COLUMNS) for (const y of EYE_ROWS) if (y !== EYE_CLOSED_ROW) set(x, y, SKIN)
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
