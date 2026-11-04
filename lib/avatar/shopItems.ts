// 아바타 머리 모양(무료)과 쌀포인트 상점 "아바타" 탭에서 파는 아이템.
// 그림은 hd.ts(HD_ITEMS)에 있고, 여기 id가 그 층 이름이다.
// 백엔드 app/core/avatar_items.py와 id·slot을 맞춰야 한다. 화면의 가격은 서버(/avatar-items) 값으로 덮어쓴다.

// 착용 칸 — 머리는 무료라 상점 아이템 칸이 아니다
export type WearSlot = 'outfit' | 'hat' | 'held'
export type HairId = 'buns' | 'short'

export const WEAR_SLOTS: WearSlot[] = ['outfit', 'hat', 'held']
export const SLOT_LABELS: Record<WearSlot, string> = { outfit: '옷', hat: '모자', held: '손' }

// 머리 모양 — 누구나 고를 수 있다. layer가 null이면 기본 그림(똥머리) 그대로
export const HAIRS: { id: HairId; name: string; layer: string | null }[] = [
  { id: 'buns', name: '똥머리', layer: null },
  { id: 'short', name: '짧은 머리', layer: 'hair-short' },
]

export interface AvatarShopItem {
  id: string
  name: string
  description: string
  price: number // 쌀포인트
  slot: WearSlot
}

export const AVATAR_SHOP_ITEMS: AvatarShopItem[] = [
  {
    id: 'outfit-jacket',
    name: '가죽 재킷 세트',
    description: '검정 가죽 재킷에 찢어진 청반바지, 갈색 부츠까지 한 벌로 입어요.',
    price: 3000,
    slot: 'outfit',
  },
  {
    id: 'hat-cap',
    name: '갈색 캡모자',
    description: '챙이 둥근 갈색 캡모자. 어떤 머리 모양에도 잘 어울려요.',
    price: 2000,
    slot: 'hat',
  },
  {
    id: 'held-flowers',
    name: '빨간 꽃다발',
    description: '한 손에 쏙 들어오는 빨간 꽃다발. 당첨 축하용으로도 좋아요.',
    price: 1500,
    slot: 'held',
  },
]
