// 등 장식 — 날개·망토처럼 캐릭터 등에 다는 움직이는 장식. 쌀포인트 상점 "등" 칸 아이템.
// 오라(auras.ts)와 따로 입을 수 있다. 그리는 순서: 오라(뒤) → 등 장식(뒤) → 캐릭터 → 오라(앞) → 등 장식(앞)
// 좌표는 오라와 같은 캐릭터 방 칸 좌표(60×60)다.

import { hash01 } from '@/lib/lightningDraw/scene'
import { glow, px, twinkle, type AuraAnchor, type Ctx } from './auras'

export type BackId = 'angel-wings'

// ── 천사 날개 — 등 뒤에서 하얀 날개가 천천히 퍼덕인다 ──
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

const DRAW: Record<BackId, (ctx: Ctx, a: AuraAnchor, t: number, layer: 'back' | 'front') => void> = {
  'angel-wings': angelWings,
}

export function drawBack(ctx: Ctx, id: BackId, anchor: AuraAnchor, t: number, layer: 'back' | 'front') {
  ctx.save()
  DRAW[id](ctx, anchor, t, layer)
  ctx.restore()
}
