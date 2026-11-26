// 아바타 머리 모양(무료)과 쌀포인트 상점 "아바타" 탭에서 파는 아이템.
// 그림은 hd.ts(HD_ITEMS)에 있고, 여기 id가 그 층 이름이다. (배경 아이템은 그림 대신 rooms.ts의 방 배경 id를 room에 적는다)
// 백엔드 app/core/avatar_items.py와 id·slot을 맞춰야 한다. 화면의 가격은 서버(/avatar-items) 값으로 덮어쓴다.

import type { RoomBackgroundId } from './rooms'
import type { AuraId } from './auras'
import type { BackId } from './backs'

// 착용 칸 — 칸마다 아이템 하나. 머리 모양은 무료라 상점 아이템 칸이 아니다.
// 순서 = 캐릭터 꾸미기 탭 순서
// hairItem = 상점에서 산 머리 (입으면 무료 머리 모양 대신 이 머리로 그린다)
export type WearSlot = 'hairItem' | 'top' | 'bottom' | 'hat' | 'shoes' | 'held' | 'back' | 'aura' | 'background'
export type HairId = 'buns' | 'short'

export const WEAR_SLOTS: WearSlot[] = ['hairItem', 'top', 'bottom', 'hat', 'shoes', 'held', 'back', 'aura', 'background']
export const SLOT_LABELS: Record<WearSlot, string> = {
  hairItem: '머리',
  top: '상의',
  bottom: '하의',
  hat: '모자',
  shoes: '신발',
  held: '소품',
  back: '등',
  aura: '오라',
  background: '배경',
}

// 그림을 겹치는 순서 (뒤 → 앞). 배경·등·오라는 그림 층이 아니라 캐릭터 방에 따로 그려서 빠진다.
// 문신·눈·입 칸은 없앴다 (2026-11)
export const LAYER_ORDER: WearSlot[] = ['bottom', 'shoes', 'top', 'hairItem', 'hat', 'held']

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
  room?: RoomBackgroundId // 배경 아이템만 — 캐릭터 방에 깔 배경
  aura?: AuraId // 오라 아이템만 — 캐릭터 둘레에 그릴 빛 효과 (auras.ts)
  back?: BackId // 등 아이템만 — 캐릭터 등에 다는 장식 (backs.ts)
  fullHead?: boolean // 머리 아이템만 — 머리카락이 아니라 얼굴까지 통째로 바꾸는 머리 (얼굴이 가려지고 눈을 깜빡이지 않는다)
}

export const AVATAR_SHOP_ITEMS: AvatarShopItem[] = [
  // ── 오라 — 캐릭터 둘레에서 움직이는 빛 (그림은 auras.ts) ──
  {
    id: 'aura-gold-halo',
    name: '금빛 후광',
    description: '머리 뒤로 커다란 금빛 고리가 천천히 돌고, 고리 위에서 별이 반짝여요.',
    price: 8000,
    slot: 'aura',
    aura: 'gold-halo',
  },
  {
    id: 'aura-thunder',
    name: '정전기',
    description: '등 뒤 주황빛 속에서 정전기가 찌릿찌릿 갈래로 튀어요.',
    price: 8000,
    slot: 'aura',
    aura: 'thunder',
  },
  {
    id: 'aura-blue-flame',
    name: '푸른 도깨비불',
    description: '발밑에서 푸른 불꽃이 피어올라 몸을 감싸요.',
    price: 8000,
    slot: 'aura',
    aura: 'blue-flame',
  },
  {
    id: 'aura-sakura',
    name: '벚꽃 바람',
    description: '분홍 꽃잎이 캐릭터 둘레를 빙글빙글 돌며 흩날려요.',
    price: 8000,
    slot: 'aura',
    aura: 'sakura',
  },
  // ── 등 — 날개·망토처럼 등에 다는 장식 (그림은 backs.ts). 오라와 같이 입을 수 있다 ──
  {
    id: 'back-angel-wings',
    name: '천사 날개',
    description: '등 뒤에서 하얀 날개가 천천히 퍼덕이고, 깃털이 한 장씩 떨어져요.',
    price: 5000,
    slot: 'back',
    back: 'angel-wings',
  },
  {
    id: 'hat-red-beanie',
    name: '빨간 방울 비니',
    description: '포근한 빨간 니트 비니. 꼭대기에 하얀 방울이 달려 있어요.',
    price: 2000,
    slot: 'hat',
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
    price: 2000,
    slot: 'held',
  },
  {
    id: 'top-cat-hoodie',
    name: '냥냥 후드티',
    description: '가슴에 흰 고양이가 그려진 까만 후드티. 소매가 길어 포근해요.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'hat-bunny',
    name: '토끼 귀 머리띠',
    description: '쫑긋 선 하얀 토끼 귀. 귀 안쪽은 분홍색이에요.',
    price: 2000,
    slot: 'hat',
  },
  {
    id: 'hat-crown',
    name: '반짝 왕관',
    description: '빨간 보석이 박힌 금빛 왕관. 오늘의 주인공은 나!',
    price: 2000,
    slot: 'hat',
  },
  {
    id: 'hat-cat-headphones',
    name: '냥냥 헤드폰',
    description: '고양이 귀가 달린 검정 헤드폰.',
    price: 2000,
    slot: 'hat',
  },
  {
    id: 'hat-sprout',
    name: '새싹 머리핀',
    description: '머리 위에 쏙 돋아난 초록 새싹.',
    price: 2000,
    slot: 'hat',
  },
  {
    id: 'shoes-sneakers',
    name: '흰 운동화',
    description: '파란 줄이 들어간 깔끔한 흰 운동화.',
    price: 1500,
    slot: 'shoes',
  },
  {
    id: 'held-milktea',
    name: '밀크티 한 잔',
    description: '쫀득한 펄이 가득한 밀크티.',
    price: 2000,
    slot: 'held',
  },
  {
    id: 'held-balloon',
    name: '하트 풍선',
    description: '손에 쥔 분홍 하트 풍선.',
    price: 2000,
    slot: 'held',
  },
  {
    id: 'bg-night',
    name: '달빛 밤하늘',
    description: '초승달과 별이 반짝이는 밤하늘.',
    price: 5000,
    slot: 'background',
    room: 'night',
  },
  {
    id: 'bg-stage',
    name: '스포트라이트 무대',
    description: '커튼 앞, 흔들리는 조명 아래 무대에 서요.',
    price: 5000,
    slot: 'background',
    room: 'stage',
  },
  {
    id: 'bg-park',
    name: '햇살 공원',
    description: '구름이 천천히 흘러가는 초록 공원.',
    price: 5000,
    slot: 'background',
    room: 'park',
  },
  {
    id: 'top-neko-hoodie',
    name: '네코 후드티',
    description: '볼이 발그레한 흰 고양이가 그려진 까만 후드티. 후드 끈까지 귀여워요.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-aurora-jumper',
    name: '별하늘 오로라 점퍼',
    description: '라벤더빛 점퍼에 금빛 별과 반짝이가 콕콕.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-dracula-cape',
    name: '드라큘라 케이프',
    description: '빨간 리본에 붉은 안감 망토가 펄럭이는 검정 재킷.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-dino-hoodie',
    name: '공룡 후드티',
    description: '어깨에 초록 가시, 옆으로 꼬리가 삐죽 나온 공룡 후드티.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-wizard-robe',
    name: '마법사 로브',
    description: '금빛 테두리와 늘어진 금 장식이 달린 검정 로브.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-blouse',
    name: '베이직 블라우스',
    description: '까만 리본을 단 깔끔한 흰 블라우스.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-school-vest',
    name: '스쿨 니트 조끼',
    description: '흰 셔츠 위에 남색 V넥 조끼와 빨간 넥타이.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-plain-hoodie',
    name: '무지 후드티',
    description: '어디에나 잘 어울리는 회색 무지 후드티.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-knit-sweater',
    name: '니트 스웨터',
    description: '꽈배기 결이 살아 있는 포근한 크림색 니트.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'top-highneck',
    name: '하이넥 티셔츠',
    description: '목까지 올라오는 검정 하이넥에 금색 핀 포인트.',
    price: 2000,
    slot: 'top',
  },
  {
    id: 'bottom-track-shorts',
    name: '트레이닝 반바지',
    description: '바깥쪽에 흰 줄이 들어간 까만 운동 반바지.',
    price: 2000,
    slot: 'bottom',
  },
  {
    id: 'bottom-cargo-pants',
    name: '카고 팬츠',
    description: '허리 벨트와 큰 주머니가 달린 회갈색 긴바지.',
    price: 2000,
    slot: 'bottom',
  },
  {
    id: 'hair-cone-head',
    name: '뾰족 원뿔 머리',
    description: '위로 길쭉하게 솟은 원뿔 머리. 머리를 통째로 바꿔요.',
    price: 3000,
    slot: 'hairItem',
    fullHead: true,
  },
  {
    id: 'hair-monster',
    name: '초록 괴물 머리',
    description: '납작한 앞머리에 꿰맨 자국, 목 옆 볼트까지. 머리를 통째로 바꿔요.',
    price: 3000,
    slot: 'hairItem',
    fullHead: true,
  },
  {
    id: 'hair-alien',
    name: '외계인 머리',
    description: '커다란 까만 눈의 연두색 외계인. 머리를 통째로 바꿔요.',
    price: 3000,
    slot: 'hairItem',
    fullHead: true,
  },
]
