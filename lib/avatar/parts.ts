// 추첨 화면(lib/lightningDraw/scene.ts)의 쪼꼬미와 같은 비율의 픽셀 캐릭터 파츠.
//
// 몸은 8×11 칸이고, 양갈래처럼 몸 밖으로 나가는 머리를 위해 좌우 1칸씩 여유를 둔 10칸 폭에 그린다.
// - 행 길이가 8이면 좌우에 1칸씩 붙여 10칸으로 맞춘다.
// - 행 길이가 10이면 그대로 쓴다.
// 문자: H 머리, S 피부, E 눈, T 상의, P 하의, B 신발, W 흰색 장식, '.' 투명
// 외곽선(O)은 합성할 때 자동으로 붙인다.

export type Gender = 'm' | 'f'

export interface Layer {
  y: number
  rows: string[]
}

export interface Part {
  name: string
  layers: Layer[]
}

export const SPRITE_W = 10
export const SPRITE_H = 11

// ───────── 팔레트 (추첨 화면 팔레트 기반) ─────────

export interface Swatch { name: string; color: string }

export const SKIN_TONES: Swatch[] = [
  { name: '밝은 피부', color: '#f5d3b3' },
  { name: '보통 피부', color: '#eab890' },
  { name: '구릿빛 피부', color: '#c99066' },
  { name: '어두운 피부', color: '#8f5b3c' },
]

export const HAIR_COLORS: Swatch[] = [
  { name: '흑발', color: '#2b2118' },
  { name: '갈색', color: '#5a3a22' },
  { name: '금발', color: '#c9a063' },
  { name: '남색', color: '#1f1f2e' },
  { name: '빨강', color: '#a83f3a' },
  { name: '백발', color: '#ece4d4' },
  { name: '핑크', color: '#e58fb5' },
  { name: '하늘', color: '#6aa8e0' },
]

export const TOP_COLORS: Swatch[] = [
  { name: '천운 레드', color: '#d93347' },
  { name: '파랑', color: '#4a7fd6' },
  { name: '주황', color: '#e3a33a' },
  { name: '초록', color: '#46b37b' },
  { name: '보라', color: '#9a6fd8' },
  { name: '하양', color: '#e0e0e0' },
  { name: '청록', color: '#39a6b3' },
  { name: '분홍', color: '#e872a0' },
  { name: '회색', color: '#6b7280' },
]

export const BOTTOM_COLORS: Swatch[] = [
  { name: '네이비', color: '#2d3a5c' },
  { name: '차콜', color: '#3b3b44' },
  { name: '브라운', color: '#5c4630' },
  { name: '데님', color: '#4a6fa5' },
  { name: '아이보리', color: '#e5e1d8' },
  { name: '로즈', color: '#d97a9a' },
]

export const FIXED_COLORS: Record<string, string> = {
  O: '#1d1a22', // 외곽선
  E: '#1a1a22', // 눈
  B: '#2a2420', // 신발
  W: '#f4f1ea', // 흰색 장식
}

// ───────── 몸 ─────────

export const BASE: Layer[] = [{
  y: 0,
  rows: [
    '........',
    '.SSSSSS.',
    '.SSSSSS.',
    '.SESSES.',
    '..SSSS..',
    '........',
    'S......S',
    '........',
    '..S..S..',
    '..S..S..',
    '.BB..BB.',
  ],
}]

// ───────── 머리 (성별마다 따로, 개수는 같게) ─────────

export const HAIRS: Record<Gender, Part[]> = {
  m: [
    { name: '짧은머리', layers: [{ y: 0, rows: [
      '..HHHH..',
      '.HHHHHH.',
      '.H....H.',
    ] }] },
    { name: '삐죽머리', layers: [{ y: 0, rows: [
      '.H.HH.H.',
      '.HHHHHH.',
      '.H....H.',
    ] }] },
    { name: '가르마', layers: [{ y: 0, rows: [
      '..HHHH..',
      '.HHHHHH.',
      '.HHH..H.',
    ] }] },
    { name: '바가지머리', layers: [{ y: 0, rows: [
      '..HHHH..',
      '.HHHHHH.',
      '.HHHHHH.',
      '.H....H.',
    ] }] },
  ],
  f: [
    { name: '긴머리', layers: [{ y: 0, rows: [
      '..HHHH..',
      '.HHHHHH.',
      '.H....H.',
      'H......H',
      'HH....HH',
      'H......H',
    ] }] },
    { name: '단발', layers: [{ y: 0, rows: [
      '..HHHH..',
      '.HHHHHH.',
      'HHH..HHH',
      'H......H',
      'HH....HH',
    ] }] },
    { name: '포니테일', layers: [{ y: 0, rows: [
      '...HHHH...',
      '..HHHHHHH.',
      '..H....HHH',
      '.........H',
      '.........H',
    ] }] },
    { name: '양갈래', layers: [{ y: 0, rows: [
      '...HHHH...',
      'H.HHHHHH.H',
      'HHH....HHH',
      'H........H',
      'H........H',
    ] }] },
  ],
}

// ───────── 상의 ─────────

export const TOPS: Part[] = [
  { name: '티셔츠', layers: [{ y: 5, rows: [
    '.TTTTTT.',
    'STTTTTTS',
    '..TTTT..',
  ] }] },
  { name: '긴팔티', layers: [{ y: 5, rows: [
    '.TTTTTT.',
    'TTTTTTTT',
    'S.TTTT.S',
  ] }] },
  { name: '후드티', layers: [{ y: 4, rows: [
    '.T....T.',
    '.TTWWTT.',
    'STTWWTTS',
    '..TTTT..',
  ] }] },
  { name: '줄무늬티', layers: [{ y: 5, rows: [
    '.TTTTTT.',
    'SWWWWWWS',
    '..TTTT..',
  ] }] },
]

// ───────── 하의 (성별마다 따로, 개수는 같게) ─────────

export const BOTTOMS: Record<Gender, Part[]> = {
  m: [
    { name: '긴바지', layers: [{ y: 8, rows: [
      '..PPPP..',
      '..P..P..',
    ] }] },
    { name: '반바지', layers: [{ y: 8, rows: [
      '..PPPP..',
    ] }] },
    { name: '와이드팬츠', layers: [{ y: 8, rows: [
      '..PPPP..',
      '.PP..PP.',
    ] }] },
  ],
  f: [
    { name: '치마', layers: [{ y: 8, rows: [
      '.PPPPPP.',
    ] }] },
    { name: '롱스커트', layers: [{ y: 8, rows: [
      '.PPPPPP.',
      '.PPPPPP.',
    ] }] },
    { name: '긴바지', layers: [{ y: 8, rows: [
      '..PPPP..',
      '..P..P..',
    ] }] },
  ],
}
