#!/usr/bin/env node
// AI가 그린 아바타 그림(PNG) → 아바타 아이템 층(lib/avatar/hdExtra.ts)
//
// 쓰는 법
//   1) scripts/avatar-base/short.png (똥머리 기준이면 buns.png)를 PixelLab·제미나이·챗GPT 등에 올려
//      "빨간 비니 씌워줘"처럼 고친다. 크기(64x64)와 캐릭터 위치는 그대로여야 한다.
//   2) node scripts/import-avatar-item.mjs --in 결과.png --id hat-red-beanie --part hat
//   3) lib/avatar/shopItems.ts에 같은 id로 상점 아이템을 추가한다 (+ 서버 avatar_items.py 등록)
//
// 하는 일: 기본 그림과 달라진 칸 중 --part(부위) 범위 안의 칸만 떼어 아이템 층으로 만든다.
// AI가 몸통 픽셀을 조금씩 바꿔 놓아도 부위 밖은 버리므로 기본 캐릭터가 흔들리지 않는다.
// 색은 기존 팔레트와 가까우면(--tol) 그 색을 쓰고, 아니면 새 색으로 추가한다.
//
// 옵션
//   --in <png>        AI 결과 (64x64, 기본 그림과 같은 자리)
//   --base <png>      기준 그림 (기본: scripts/avatar-base/short.png)
//   --id <id>         아이템 id (이미 있으면 덮어쓴다)
//   --part <이름>     떼어 올 부위: hat | hair | eyes | mouth | face | top | bottom | shoes | held | all
//   --rows a:b        부위 대신 직접 줄 범위 (원래 그림 기준, 위쪽 여유는 -6~-1)
//   --tol <n>         기존 색에 붙이는 색 거리 (기본 28)
//   --dry             파일은 안 바꾸고 결과만 출력

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HD_FILE = path.join(ROOT, 'lib/avatar/hd.ts')
const EXTRA_FILE = path.join(ROOT, 'lib/avatar/hdExtra.ts')

// 64x64 그림 안에서 원래 그림(0행·0열)이 놓인 자리 — scripts/avatar-base/*.png와 같다
const ORIGIN_X = 13
const ORIGIN_Y = 14
const TOP = 6 // hdExtra.ts HD_EXTRA_TOP
const W = 38
const H = 48 // hd.ts HD_H

// 부위별 줄 범위 (원래 그림 기준. 눈은 13~16행, 목 20행, 몸통 21~28행, 다리 29행~)
const PARTS = {
  hat: [-6, 12],
  hair: [-6, 22],
  eyes: [11, 16],
  mouth: [17, 20],
  face: [9, 20],
  top: [19, 31],
  bottom: [26, 34],
  shoes: [31, 36],
  held: [14, 36],
  all: [-6, 36],
}

// ── 인자 ──
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true])
    return acc
  }, []),
)
if (!args.in || !args.id) {
  console.error('사용법: node scripts/import-avatar-item.mjs --in 결과.png --id 아이템id --part hat|hair|face|top|bottom|shoes|held|all')
  process.exit(1)
}
const basePath = args.base ?? path.join(ROOT, 'scripts/avatar-base/short.png')
const [r0, r1] = args.rows ? args.rows.split(':').map(Number) : PARTS[args.part ?? 'all']
if (r0 == null || r1 == null) throw new Error(`알 수 없는 부위: ${args.part}`)
const TOL = Number(args.tol ?? 28)

// ── PNG 읽기 (8비트 RGBA/RGB, 인터레이스 없음) ──
function readPng(file) {
  const buf = fs.readFileSync(file)
  let pos = 8
  let width = 0, height = 0, colorType = 0, bitDepth = 0, interlace = 0
  let palette = null, trns = null
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]; interlace = data[12]
    } else if (type === 'PLTE') palette = data
    else if (type === 'tRNS') trns = data
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (bitDepth !== 8 || interlace) throw new Error(`${file}: 8비트·인터레이스 없는 PNG만 읽을 수 있어요`)
  const bpp = { 6: 4, 2: 3, 3: 1, 0: 1, 4: 2 }[colorType]
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const out = Buffer.alloc(width * height * 4)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      let v = line[i]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      line[i] = v & 255
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4
      if (colorType === 6) line.copy(out, o, x * 4, x * 4 + 4)
      else if (colorType === 2) { out[o] = line[x * 3]; out[o + 1] = line[x * 3 + 1]; out[o + 2] = line[x * 3 + 2]; out[o + 3] = 255 }
      else if (colorType === 3) { const k = line[x]; out[o] = palette[k * 3]; out[o + 1] = palette[k * 3 + 1]; out[o + 2] = palette[k * 3 + 2]; out[o + 3] = trns && k < trns.length ? trns[k] : 255 }
      else if (colorType === 0) { out[o] = out[o + 1] = out[o + 2] = line[x]; out[o + 3] = 255 }
      else if (colorType === 4) { out[o] = out[o + 1] = out[o + 2] = line[x * 2]; out[o + 3] = line[x * 2 + 1] }
    }
    prev = line
  }
  return { width, height, px: out }
}

// ── 팔레트 ──
const hdText = fs.readFileSync(HD_FILE, 'utf8')
const HD_PALETTE = JSON.parse(hdText.match(/export const HD_PALETTE[^=]*=\s*(\{[^\n]*\})/)[1])
const extraText = fs.readFileSync(EXTRA_FILE, 'utf8')
const readObj = (name) => {
  const m = extraText.match(new RegExp(`export const ${name}[^=]*=\\s*(\\{[\\s\\S]*?\\n\\}|\\{\\})`))
  return m ? JSON.parse(m[1]) : {}
}
const EXTRA_PALETTE = readObj('HD_EXTRA_PALETTE')
const EXTRA_ITEMS = readObj('HD_EXTRA_ITEMS')
const palette = { ...HD_PALETTE, ...EXTRA_PALETTE }
const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
// 사람 눈에 가까운 색 거리 (가중 RGB)
const dist = (a, b) => Math.sqrt(2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2) / 3
const used = new Set(Object.keys(palette))
const pool = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ'].concat(Array.from({ length: 2000 }, (_, i) => String.fromCharCode(0xac00 + i)))
let added = 0
function charFor(r, g, b) {
  let best = null, bestD = Infinity
  for (const [k, h] of Object.entries(palette)) { const d = dist([r, g, b], rgb(h)); if (d < bestD) { bestD = d; best = k } }
  if (bestD <= TOL) return best
  const k = pool.find((c) => !used.has(c))
  used.add(k)
  palette[k] = EXTRA_PALETTE[k] = hex(r, g, b)
  added++
  return k
}

// ── 비교해서 층 만들기 ──
const base = readPng(basePath)
const ai = readPng(args.in)
if (ai.width !== base.width || ai.height !== base.height) throw new Error(`크기가 달라요: 결과 ${ai.width}x${ai.height}, 기준 ${base.width}x${base.height}`)
const rows = []
let changed = 0, erased = 0, ignored = 0
for (let sy = -TOP; sy < H; sy++) {
  let line = ''
  for (let sx = 0; sx < W; sx++) {
    const x = ORIGIN_X + sx, y = ORIGIN_Y + sy
    if (x < 0 || y < 0 || x >= ai.width || y >= ai.height) { line += '.'; continue }
    const o = (y * ai.width + x) * 4
    const A = ai.px.subarray(o, o + 4), B = base.px.subarray(o, o + 4)
    const aOn = A[3] >= 128, bOn = B[3] >= 128
    const same = aOn === bOn && (!aOn || (A[0] === B[0] && A[1] === B[1] && A[2] === B[2]))
    if (same) { line += '.'; continue }
    if (sy < r0 || sy > r1) { ignored++; line += '.'; continue }
    if (!aOn) { erased++; line += '-'; continue }
    changed++
    line += charFor(A[0], A[1], A[2])
  }
  rows.push(line)
}

console.log(`${args.id}: 바뀐 칸 ${changed}개, 지운 칸 ${erased}개, 부위 밖이라 버린 칸 ${ignored}개, 새 색 ${added}개`)
console.log(rows.map((r, i) => `${String(i - TOP).padStart(3)} ${r}`).join('\n'))
if (args.dry) process.exit(0)

EXTRA_ITEMS[args.id] = rows
const obj = (o) => (Object.keys(o).length ? JSON.stringify(o, null, 1).replace(/\n\s*\]/g, '\n ]') : '{}')
const out = extraText
  .replace(/export const HD_EXTRA_PALETTE[^=]*=\s*(\{[\s\S]*?\n\}|\{\})/, `export const HD_EXTRA_PALETTE: Record<string, string> = ${obj(EXTRA_PALETTE)}`)
  .replace(/export const HD_EXTRA_ITEMS[^=]*=\s*(\{[\s\S]*?\n\}|\{\})/, `export const HD_EXTRA_ITEMS: Record<string, string[]> = ${obj(EXTRA_ITEMS)}`)
fs.writeFileSync(EXTRA_FILE, out)
console.log(`→ ${path.relative(ROOT, EXTRA_FILE)}에 저장했어요. shopItems.ts에 '${args.id}' 아이템을 추가하세요.`)
