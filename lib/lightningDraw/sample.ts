import { mulberry32, type SceneEntrant } from './scene'
import { AVATAR_LIMITS, type AvatarConfig, type AvatarNumberKey } from '@/lib/avatar/compose'

// 실제 응모 없이 번개 추첨 장면을 보여줄 때(관리자 데모, 캐릭터 꾸미기 미리보기) 쓰는 샘플 응모자
export const SAMPLE_MY_ENTRY = 3
export const SAMPLE_OTHER_WINNER = 11

// 장면 번호로 만든 샘플 응모자들 — 일부는 캐릭터를 안 꾸민 사람(임시 아바타).
// myAvatar를 주면 SAMPLE_MY_ENTRY 자리에 그 캐릭터를 세운다.
export function sampleEntrants(seed: number, myAvatar?: AvatarConfig | null): SceneEntrant[] {
  const rng = mulberry32(seed * 31 + 7)
  const pick = (k: AvatarNumberKey) => Math.floor(rng() * AVATAR_LIMITS[k])
  const count = 14 + Math.floor(rng() * 8)
  return Array.from({ length: count }, (_, i) => {
    const entryNumber = i + 1
    const avatar: AvatarConfig | null = rng() < 0.2 ? null : {
      v: 2,
      gender: rng() < 0.5 ? 'm' : 'f',
      skin: pick('skin'), hair: pick('hair'), hairColor: pick('hairColor'),
      top: pick('top'), topColor: pick('topColor'), bottom: pick('bottom'), bottomColor: pick('bottomColor'),
    }
    return {
      entryNumber,
      avatar: entryNumber === SAMPLE_MY_ENTRY && myAvatar !== undefined ? myAvatar : avatar,
      ticketCount: sampleTicketCount(seed, entryNumber),
    }
  })
}

// 대부분 1장, 가끔 여러 장 — 별도 난수를 써서 위의 캐릭터 생성 순서는 그대로 둔다
function sampleTicketCount(seed: number, entryNumber: number): number {
  const rng = mulberry32(seed * 97 + entryNumber * 13)
  const r = rng()
  if (r < 0.55) return 1
  if (r < 0.8) return 2 + Math.floor(rng() * 2)
  if (r < 0.95) return 4 + Math.floor(rng() * 3)
  return 8 + Math.floor(rng() * 5)
}
