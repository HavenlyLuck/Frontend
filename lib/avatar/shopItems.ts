// 쌀포인트 상점 "아바타" 탭에서 파는 아이템. 픽셀 파츠는 코드(parts.ts)에 그려져 있어서
// 관리자 상품 등록이 아니라 여기 목록으로 관리한다.
// TODO(backend): 아이템 구매(쌀포인트 차감)·보유 목록 API — 생기면 가격도 서버 기준으로 맞춘다

import type { ItemSlot } from './compose'

export interface AvatarShopItem {
  id: string
  name: string
  description: string
  price: number // 쌀포인트
  slot: ItemSlot
  index: number // 해당 칸의 파츠 번호 (WEAPONS, HATS)
}

export const AVATAR_SHOP_ITEMS: AvatarShopItem[] = [
  {
    id: 'flame-cutlass',
    name: '불칼',
    description: '칼날을 따라 불이 붙은 해적 칼. 추첨 화면에서는 불꽃이 일렁여요.',
    price: 3000,
    slot: 'weapon',
    index: 0,
  },
  {
    id: 'santa-hat',
    name: '산타 모자',
    description: '끝에 하얀 방울이 달린 빨간 산타 모자. 어떤 머리 위에도 쓸 수 있어요.',
    price: 2000,
    slot: 'hat',
    index: 0,
  },
  {
    id: 'red-cape',
    name: '빨간 망토',
    description: '어깨에서 아래로 넓게 퍼지는 빨간 망토. 등 뒤로 둘러서 팔 옆과 다리 사이로 보여요.',
    price: 2500,
    slot: 'cape',
    index: 0,
  },
]
