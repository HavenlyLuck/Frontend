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

// ───────── 무기 (쌀포인트 상점 아이템) ─────────
//
// 몸 격자(10칸) 밖으로 튀어나오므로 몸과 따로, 위에 겹쳐 그린다.
// dx/dy는 외곽선 포함 캐릭터 격자(OUTLINED_W × OUTLINED_H)의 왼쪽 위 기준 위치.
// 문자: l 칼날, g 손잡이 장식(금색), h 손잡이, f/y/r 불꽃(외곽선 없음)

export interface HeldItem {
  name: string
  dx: number
  dy: number
  rows: string[]
  colors: Record<string, string>
  // 추첨 화면에서 번갈아 칠할 색(불꽃 깜빡임) — 없으면 그대로
  flicker?: Record<string, string>
  // 외곽선을 몸 위에도 그릴지. 모자처럼 얼굴에 닿는 아이템은 false로 해서 이마를 덮지 않게 한다.
  outlineOverBody?: boolean
  // 몸 뒤에 그릴지(망토처럼 등 뒤로 두르는 것) — 몸이 앞을 가리고 옆·아래로 삐져나온 부분만 보인다
  behind?: boolean
}

export const WEAPONS: HeldItem[] = [
  {
    // 오른손에 쥐고 머리 옆으로 비스듬히 치켜든 해적 칼, 칼날을 따라 불이 붙어 있다
    name: '불칼',
    dx: 9,
    dy: 0,
    rows: [
      '...yr',
      '..fl.',
      '.fyl.',
      '.yl..',
      '..l..',
      '.l...',
      'ggg..',
      '.h...',
      '.h...',
    ],
    colors: { l: '#dfe6f0', g: '#e3b341', h: '#5a3a22', f: '#ff7a1a', y: '#ffd23f', r: '#e8401c' },
    flicker: { f: '#ffd23f', y: '#ff7a1a', r: '#ff9a3c' },
    outlineOverBody: true,
  },
]

// ───────── 모자 (쌀포인트 상점 아이템) ─────────
// 머리 위에 겹쳐 그린다. 문자: c 빨강, d 빨강 그늘, w 흰 털, p 방울

export const HATS: HeldItem[] = [
  {
    // 고깔 끝이 왼쪽으로 늘어져 방울이 달린 산타 모자 — 흰 털 테두리가 이마 위를 두른다
    name: '산타 모자',
    dx: 1,
    dy: 0,
    rows: [
      'pcccc....',
      '..ccccdd.',
      '..wwwwww.',
    ],
    colors: { c: '#d63a3a', d: '#a82a2a', w: '#f4f1ea', p: '#ffffff' },
  },
]

// ───────── 망토 (쌀포인트 상점 아이템) ─────────
// 등 뒤에 두르는 것이라 몸 뒤에 그린다. 문자: k 망토, n 망토 그늘(밑단)

export const CAPES: HeldItem[] = [
  {
    // 어깨에서 시작해 아래로 갈수록 넓게 퍼지는 빨간 망토 — 팔 바깥과 다리 사이로 보인다
    name: '빨간 망토',
    dx: 0,
    dy: 5,
    rows: [
      '...kkkkkk...',
      '.kkkkkkkkkk.',
      'kkkkkkkkkkkk',
      'kkkkkkkkkkkk',
      'kkkkkkkkkkkk',
      'nkkkkkkkkkkn',
      '.nnnnnnnnnn.',
    ],
    colors: { k: '#c22f3f', n: '#8a1f2c' },
    behind: true,
  },
]

// ───────── 전체 스킨 (쌀포인트 상점 아이템) ─────────
// 몸 전체(10×11칸)를 통째로 바꾸는 스킨. 끼면 피부·머리·옷 설정과 무기·모자·망토는 쓰지 않는다.
// 문자는 스킨마다 colors에 정의한다(O·o는 외곽선이라 쓰지 않는다). E를 쓰면 추첨 화면에서 눈을 깜빡인다.

export interface Costume {
  name: string
  rows: string[] // SPRITE_W × SPRITE_H
  colors: Record<string, string>
  // 스킨에 딸린 소품(손에 든 무기 등) — 무기 아이템처럼 몸 위에 겹쳐 그린다
  held?: HeldItem
}

export const COSTUMES: Costume[] = [
  {
    // 금발 가르마, 초록 고글, 밝은 베이지 정장에 파란 셔츠·표범무늬 넥타이, 오른손에 천을 감은 식칼
    // 문자: H 머리, S 피부, G 고글 렌즈, F 고글 테, J 정장, U 셔츠, Y 넥타이, D 넥타이 무늬, L 바지, B 구두
    name: '나나미',
    rows: [
      '...HHHH...',
      '..HHHHHH..',
      '..HHSSSH..',
      '..SGFFGS..',
      '...SSSS...',
      '..JUYDUJ..',
      '.SJJYJJJS.',
      '..JJYJJJ..',
      '...LLLL...',
      '...L..L...',
      '..BB..BB..',
    ],
    colors: {
      H: '#d9cf86', S: '#f2cfae', G: '#3f8f5a', F: '#c9ccd2', J: '#ddd8cf',
      U: '#3f6f95', Y: '#cdb43c', D: '#4a3a1a', L: '#cfc9be', B: '#8a4a2a',
    },
    held: {
      // 오른손 옆에 세워 쥔 넓적한 식칼 — 칼날에 흰 바탕·남색 점박이 천을 감았다
      // 문자: w 천(흰색), k 천 무늬(남색), h 손잡이
      name: '점박이 식칼',
      dx: 10,
      dy: 1,
      rows: [
        '.wk',
        'wkw',
        'kww',
        'wwk',
        'wkw',
        'kwk',
        'h..',
        'h..',
      ],
      colors: { w: '#f4f2ec', k: '#1f2547', h: '#4a4458' },
    },
  },
  {
    // 어두운 털의 늑대 인간 — 찌푸린 눈썹 아래 빨간 눈, 크게 벌린 입과 위아래 송곳니,
    // 머리 옆으로 삐친 털, 어깨 뒤 초록 화학 탱크, 초록 약품이 든 청동 건틀릿
    // 문자: F 털, D 찌푸린 눈썹, M 주둥이·가슴 털, N 코, R 눈, W 송곳니, K 벌린 입, r 귀 안쪽,
    //       Z 청동, G 화학 약품(초록), C 발톱(금색), P 발
    name: '워윅',
    rows: [
      '.Fr....rF.',
      '.FFFFFFFF.',
      'FDDFFFFDDF',
      '.FRDFFDRF.',
      'ZFMMNNMMFZ',
      'GFWWKKWWFG',
      'GZZWFFWF.G',
      'ZGGZFMFFF.',
      'ZGGZFFFFC.',
      'CZZC.F..FC',
      'C..C.PP.PP',
    ],
    colors: {
      F: '#3d4a44', D: '#101512', M: '#6f7c74', N: '#141414', R: '#ff2a1a', W: '#f4f1ea', K: '#6a1212',
      r: '#c8452f', Z: '#a8823a', G: '#62f04a', C: '#e3c25a', P: '#2a332f',
    },
  },
]

// 외곽선을 붙이는 아이템 문자 (불꽃은 테두리 없이 번지듯이)
export const HELD_OUTLINED = new Set(['l', 'g', 'h', 'c', 'd', 'w', 'p', 'k', 'n'])

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
