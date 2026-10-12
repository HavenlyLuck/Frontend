// 캐릭터 방 배경 — 마이페이지 프로필 카드에서 내 캐릭터 뒤에 깔리는 픽셀 배경.
// 지금은 기본 "진열장"만. 나머지는 쌀포인트 상점 아이템으로 팔 예정이라 id로 관리한다.
// TODO(backend): 프로필에 배경 저장 필드가 생기면 서버로 — 지금은 이 브라우저(localStorage)에만 저장

import { hash01 } from '@/lib/lightningDraw/scene'

export type RoomBackgroundId = 'case' | 'lucky' | 'stage' | 'night' | 'park'

// 지금 쓸 수 있는 배경 — 기본 "진열장" 하나 (캐릭터를 내 컬렉션 피규어처럼 보여준다)
export const ROOM_BACKGROUNDS: { id: RoomBackgroundId; name: string; swatch: string }[] = [
  { id: 'case', name: '진열장', swatch: '#2a2733' },
]
// TODO: 쌀포인트 상점 판매 예정 배경 — 그림(drawRoom)은 있지만 아직 고를 수 없다. 상점에 붙이면 보유한 배경만 ROOM_BACKGROUNDS처럼 노출
export const SHOP_ROOM_BACKGROUNDS: { id: RoomBackgroundId; name: string; swatch: string }[] = [
  { id: 'lucky', name: '행운', swatch: '#d4af6a' },
  { id: 'stage', name: '무대', swatch: '#951a2e' },
  { id: 'night', name: '밤하늘', swatch: '#232a52' },
  { id: 'park', name: '공원', swatch: '#5f9446' },
]
export const DEFAULT_ROOM_BACKGROUND: RoomBackgroundId = 'case'

export const ROOM_UPDATED_EVENT = 'avatar-room-updated'
const KEY_PREFIX = 'avatarRoom:'

function key() {
  return KEY_PREFIX + (localStorage.getItem('userId') ?? '')
}

export function getRoomBackground(): RoomBackgroundId {
  try {
    const v = localStorage.getItem(key())
    return ROOM_BACKGROUNDS.some(b => b.id === v) ? (v as RoomBackgroundId) : DEFAULT_ROOM_BACKGROUND
  } catch {
    return DEFAULT_ROOM_BACKGROUND
  }
}

export function setRoomBackground(id: RoomBackgroundId) {
  try {
    localStorage.setItem(key(), id)
  } catch {
    // 저장이 막힌 환경에서는 이번 화면에서만 바뀐다
  }
  window.dispatchEvent(new CustomEvent(ROOM_UPDATED_EVENT, { detail: id }))
}

// ── 그리기 (방 크기 ROOM × ROOM 칸, t = ms) ──

export const ROOM = 30
export const ROOM_FLOOR_Y = 24 // 캐릭터 발 위치

function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const cx = Math.round(x)
  rect(ctx, '#ffffff', cx + 1, y, 4, 1)
  rect(ctx, '#ffffff', cx, y + 1, 7, 2)
  rect(ctx, '#e3f2fb', cx + 1, y + 3, 5, 1)
}

// 피규어 진열장 — 어두운 아크릴 케이스, 위 조명, 금테 받침대와 명패
function drawCase(ctx: CanvasRenderingContext2D, t: number) {
  const W = ROOM
  const H = ROOM
  const back = ['#121119', '#16151e', '#1a1923', '#1f1d29']
  for (let y = 0; y < 24; y++) rect(ctx, back[Math.min(back.length - 1, Math.floor(y / 6))], 0, y, W, 1)

  // 위에서 떨어지는 따뜻한 조명
  ctx.globalAlpha = 0.1
  for (let y = 2; y < 25; y++) {
    const half = 3 + y * 0.42
    rect(ctx, '#ffe9b8', Math.round(15 - half), y, Math.round(half * 2), 1)
  }
  ctx.globalAlpha = 1
  rect(ctx, '#fff3d6', 10, 1, 10, 1)
  ctx.globalAlpha = 0.35
  rect(ctx, '#ffe9b8', 9, 2, 12, 1)
  ctx.globalAlpha = 1

  // 받침대 — 금테 윗면, 검은 몸통, 가운데 금색 명패
  for (let y = 24; y < H; y++) rect(ctx, '#0d0c12', 0, y, W, 1)
  rect(ctx, '#e3b341', 6, 24, 18, 1)
  rect(ctx, '#a8842f', 6, 25, 18, 1)
  rect(ctx, '#1d1b24', 6, 26, 18, 3)
  rect(ctx, '#26232f', 6, 26, 1, 3)
  rect(ctx, '#8a6d33', 11, 26, 8, 2)
  rect(ctx, '#d4af6a', 12, 26, 6, 1)
  rect(ctx, '#c29d58', 12, 27, 6, 1)

  // 아크릴 테두리와 유리 반사
  rect(ctx, '#3a3644', 0, 0, W, 1)
  rect(ctx, '#3a3644', 0, 0, 1, 24)
  rect(ctx, '#3a3644', W - 1, 0, 1, 24)
  ctx.globalAlpha = 0.09
  for (let i = 0; i < 12; i++) rect(ctx, '#ffffff', 4 + Math.floor(i / 2), 3 + i, 1, 1)
  for (let i = 0; i < 6; i++) rect(ctx, '#ffffff', 7 + Math.floor(i / 2), 3 + i, 1, 1)
  ctx.globalAlpha = 1
  // 5초마다 유리 위로 반짝임 하나가 미끄러진다
  const k = (t % 5000) / 900
  if (k < 1) {
    ctx.globalAlpha = 0.5 * (1 - Math.abs(k - 0.5) * 2)
    rect(ctx, '#ffffff', 4 + Math.floor(k * 6), 3 + Math.floor(k * 12), 1, 1)
    ctx.globalAlpha = 1
  }
}

export function drawRoom(ctx: CanvasRenderingContext2D, id: RoomBackgroundId, t: number) {
  const W = ROOM
  const H = ROOM
  if (id === 'case') {
    drawCase(ctx, t)
    return
  }
  if (id === 'park') {
    const sky = ['#7cc8f2', '#8ed2f5', '#a2dbf7', '#b6e4f9', '#c9ecfb']
    for (let y = 0; y < 18; y++) rect(ctx, sky[Math.min(sky.length - 1, Math.floor(y / 4))], 0, y, W, 1)
    // 구름이 천천히 흘러간다
    cloud(ctx, ((t / 220) % (W + 10)) - 10, 3)
    cloud(ctx, ((t / 340 + 18) % (W + 10)) - 10, 9)
    // 먼 나무 줄
    for (let x = 0; x < W; x++) rect(ctx, x % 5 < 3 ? '#3f7a34' : '#4b8a3d', x, 16 + (x % 5 === 2 ? -1 : 0), 1, 3)
    for (let y = 18; y < H; y++) for (let x = 0; x < W; x++) {
      const h = hash01(x * 31 + y * 17)
      rect(ctx, h < 0.06 ? '#4a7f37' : h < 0.1 ? '#79b65c' : '#5f9446', x, y)
    }
    // 꽃
    ;[[4, 26, '#f6c945'], [24, 27, '#ef8fb0'], [9, 28, '#f7f1e3'], [21, 21, '#b9a0f0']].forEach(([x, y, c]) => rect(ctx, c as string, x as number, y as number))
    return
  }
  if (id === 'night') {
    const sky = ['#0f1330', '#141a3c', '#1a2148', '#202854']
    for (let y = 0; y < 22; y++) rect(ctx, sky[Math.min(sky.length - 1, Math.floor(y / 6))], 0, y, W, 1)
    // 반짝이는 별
    for (let i = 0; i < 16; i++) {
      const x = Math.floor(hash01(i * 13 + 1) * W)
      const y = Math.floor(hash01(i * 7 + 5) * 18)
      const tw = (Math.sin(t / 500 + i * 1.7) + 1) / 2
      ctx.globalAlpha = 0.3 + tw * 0.7
      rect(ctx, i % 4 === 0 ? '#fff6c0' : '#e6ecff', x, y)
      ctx.globalAlpha = 1
    }
    // 달
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
      if (x * x + y * y <= 11) rect(ctx, x + y > 2 ? '#e8dcae' : '#f6eecb', 24 + x, 5 + y)
    }
    for (let y = 22; y < H; y++) rect(ctx, y === 22 ? '#2e4434' : '#1e2a24', 0, y, W, 1)
    return
  }
  if (id === 'stage') {
    // 커튼 주름
    for (let x = 0; x < W; x++) {
      const fold = x % 4
      rect(ctx, fold === 0 ? '#6a1020' : fold === 3 ? '#a8203a' : '#8c1a30', x, 0, 1, 21)
    }
    rect(ctx, '#e3b341', 0, 0, W, 2)
    // 나무 바닥
    for (let y = 21; y < H; y++) for (let x = 0; x < W; x++) rect(ctx, (x + (y % 2) * 3) % 7 === 0 ? '#4a321d' : y % 2 ? '#6b4a2e' : '#5e4128', x, y)
    // 좌우로 살짝 흔들리는 스포트라이트
    const cx = 15 + Math.sin(t / 1200) * 1.5
    ctx.globalAlpha = 0.22
    for (let y = 0; y < H; y++) {
      const half = 2 + y * 0.32
      rect(ctx, '#fff2b0', Math.round(cx - half), y, Math.round(half * 2), 1)
    }
    ctx.globalAlpha = 1
    return
  }
  // lucky — 천운 레드 + 금빛 반짝이
  const bg = ['#8a1d2c', '#a3243a', '#bb2b42', '#d93347']
  for (let y = 0; y < H; y++) rect(ctx, bg[Math.min(bg.length - 1, Math.floor((H - 1 - y) / 8))], 0, y, W, 1)
  for (let y = 22; y < H; y++) rect(ctx, y === 22 ? '#e3b341' : '#7a1828', 0, y, W, 1)
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(hash01(i * 19 + 3) * W)
    const y = Math.floor(hash01(i * 11 + 9) * 20)
    const k = ((t / 900 + hash01(i) * 4) % 4) / 4 // 0~1 주기
    if (k > 0.5) continue
    const big = k > 0.15 && k < 0.35
    rect(ctx, '#ffe27a', x, y)
    if (big) {
      rect(ctx, '#ffe27a', x - 1, y)
      rect(ctx, '#ffe27a', x + 1, y)
      rect(ctx, '#ffe27a', x, y - 1)
      rect(ctx, '#ffe27a', x, y + 1)
    }
  }
}
