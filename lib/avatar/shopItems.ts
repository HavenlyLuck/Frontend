// 쌀포인트 상점 "아바타" 탭에서 파는 아이템. 픽셀 파츠는 코드(parts.ts)에 그려져 있어서
// 관리자 상품 등록이 아니라 여기 목록으로 관리한다.
// 백엔드 app/core/avatar_items.py와 id·slot·index를 맞춰야 한다. 화면의 가격은 서버(/avatar-items) 값으로 덮어쓴다.

import type { WearSlot } from './compose'

export interface AvatarShopItem {
  id: string
  name: string
  description: string
  price: number // 쌀포인트
  slot: WearSlot
  index: number // 해당 칸의 파츠 번호 (WEAPONS, HATS, CAPES, COSTUMES)
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
  {
    id: 'nanami-skin',
    name: '나나미 스킨',
    description: '베이지 정장에 초록 고글, 표범무늬 넥타이, 점박이 천을 감은 식칼까지. 캐릭터 전체가 바뀌어서 무기·모자·망토와는 같이 못 껴요.',
    price: 5000,
    slot: 'costume',
    index: 0,
  },
  {
    id: 'warwick-skin',
    name: '워윅 스킨',
    description: '송곳니를 드러낸 채 노려보는 늑대 인간. 어깨 뒤 초록 화학 탱크와 청동 건틀릿까지. 캐릭터 전체가 바뀌어서 무기·모자·망토와는 같이 못 껴요.',
    price: 5000,
    slot: 'costume',
    index: 1,
  },
]
