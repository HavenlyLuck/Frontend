// 아바타 머리 모양(무료)과 쌀포인트 상점 "아바타" 탭에서 파는 아이템.
// 그림은 hd.ts(HD_ITEMS)에 있고, 여기 id가 그 층 이름이다. (배경 아이템은 그림 대신 rooms.ts의 방 배경 id를 room에 적는다)
// 백엔드 app/core/avatar_items.py와 id·slot을 맞춰야 한다. 화면의 가격은 서버(/avatar-items) 값으로 덮어쓴다.

import type { RoomBackgroundId } from './rooms'

// 착용 칸 — 칸마다 아이템 하나. 머리 모양은 무료라 상점 아이템 칸이 아니다.
// 순서 = 캐릭터 꾸미기 탭 순서
// hairItem = 상점에서 산 머리 (입으면 무료 머리 모양 대신 이 머리로 그린다)
export type WearSlot = 'hairItem' | 'face' | 'tattoo' | 'top' | 'bottom' | 'hat' | 'shoes' | 'held' | 'background'
export type HairId = 'buns' | 'short'

export const WEAR_SLOTS: WearSlot[] = ['hairItem', 'face', 'tattoo', 'top', 'bottom', 'hat', 'shoes', 'held', 'background']
export const SLOT_LABELS: Record<WearSlot, string> = {
  hairItem: '머리',
  face: '표정',
  tattoo: '문신',
  top: '상의',
  bottom: '하의',
  hat: '모자',
  shoes: '신발',
  held: '손',
  background: '배경',
}

// 그림을 겹치는 순서 (뒤 → 앞). 배경은 그림 층이 아니라 방 배경이라 빠진다. 머리(무료 머리 모양 또는 hairItem)는 상의와 모자 사이에 들어간다
export const LAYER_ORDER: WearSlot[] = ['tattoo', 'face', 'bottom', 'shoes', 'top', 'hat', 'held']

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
  fullHead?: boolean // 머리 아이템만 — 머리카락이 아니라 얼굴까지 통째로 바꾸는 머리 (표정·문신이 가려지고 눈을 깜빡이지 않는다)
}

export const AVATAR_SHOP_ITEMS: AvatarShopItem[] = [
  {
    id: 'outfit-jacket',
    name: '가죽 재킷 세트',
    description: '검정 가죽 재킷에 찢어진 청반바지, 갈색 부츠까지 한 벌로 입어요.',
    price: 3000,
    slot: 'top', // 하의·신발까지 한 그림이라 상의 칸에 넣는다
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
  {
    id: 'face-smile',
    name: '해맑은 미소',
    description: '눈웃음에 발그레한 볼, 보기만 해도 기분 좋아지는 표정이에요.',
    price: 1000,
    slot: 'face',
  },
  {
    id: 'tattoo-star',
    name: '별빛 볼 문신',
    description: '오른쪽 볼에 반짝이는 작은 금빛 별 하나.',
    price: 800,
    slot: 'tattoo',
  },
  {
    id: 'top-cat-hoodie',
    name: '냥냥 후드티',
    description: '가슴에 흰 고양이가 그려진 까만 후드티. 소매가 길어 포근해요.',
    price: 2500,
    slot: 'top',
  },
  {
    id: 'bottom-check-skirt',
    name: '체크 스커트',
    description: '남색 체크 무늬가 들어간 A라인 치마.',
    price: 2000,
    slot: 'bottom',
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
    price: 3500,
    slot: 'hat',
  },
  {
    id: 'hat-cat-headphones',
    name: '냥냥 헤드폰',
    description: '고양이 귀가 달린 검정 헤드폰.',
    price: 2500,
    slot: 'hat',
  },
  {
    id: 'hat-sprout',
    name: '새싹 머리핀',
    description: '머리 위에 쏙 돋아난 초록 새싹.',
    price: 1000,
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
    id: 'held-star-wand',
    name: '별 요술봉',
    description: '끝에 금빛 별이 달린 요술봉. 주변이 반짝반짝해요.',
    price: 2000,
    slot: 'held',
  },
  {
    id: 'held-milktea',
    name: '밀크티 한 잔',
    description: '쫀득한 펄이 가득한 밀크티.',
    price: 1200,
    slot: 'held',
  },
  {
    id: 'held-balloon',
    name: '하트 풍선',
    description: '손에 쥔 분홍 하트 풍선.',
    price: 1200,
    slot: 'held',
  },
  {
    id: 'bg-night',
    name: '달빛 밤하늘',
    description: '초승달과 별이 반짝이는 밤하늘.',
    price: 3000,
    slot: 'background',
    room: 'night',
  },
  {
    id: 'bg-stage',
    name: '스포트라이트 무대',
    description: '커튼 앞, 흔들리는 조명 아래 무대에 서요.',
    price: 3000,
    slot: 'background',
    room: 'stage',
  },
  {
    id: 'bg-park',
    name: '햇살 공원',
    description: '구름이 천천히 흘러가는 초록 공원.',
    price: 2000,
    slot: 'background',
    room: 'park',
  },
  {
    id: 'bg-lucky',
    name: '천운 행운방',
    description: '천운 레드에 금빛이 반짝이는 행운의 방.',
    price: 3000,
    slot: 'background',
    room: 'lucky',
  },
  {
    id: 'hair-pink-buns',
    name: '벚꽃 핑크 똥머리',
    description: '양쪽으로 동그랗게 묶은 벚꽃빛 분홍 머리.',
    price: 2000,
    slot: 'hairItem',
  },
  {
    id: 'hair-blonde-short',
    name: '햇살 금발 단발',
    description: '햇살처럼 반짝이는 노란 짧은 머리.',
    price: 2000,
    slot: 'hairItem',
  },
  {
    id: 'hair-mint-buns',
    name: '민트 똥머리',
    description: '시원한 민트색으로 물들인 똥머리.',
    price: 2000,
    slot: 'hairItem',
  },
  {
    id: 'hair-twoblock',
    name: '깔끔한 투블럭',
    description: '옆은 짧게, 윗머리는 풍성하게 올린 흑발 투블럭.',
    price: 2500,
    slot: 'hairItem',
  },
  {
    id: 'hair-spiky',
    name: '삐죽삐죽 머리',
    description: '위로 뻗친 밝은 갈색 뾰족 머리. 장난기 가득!',
    price: 2000,
    slot: 'hairItem',
  },
  {
    id: 'hair-dandy-part',
    name: '댄디 가르마',
    description: '옆으로 넘겨 이마가 보이는 짙은 갈색 가르마 머리.',
    price: 2500,
    slot: 'hairItem',
  },
  {
    id: 'hair-buzz',
    name: '짧은 스포츠머리',
    description: '이마가 시원하게 드러나는 짧은 스포츠머리.',
    price: 1500,
    slot: 'hairItem',
  },
  {
    id: 'tattoo-sparkle',
    name: '푸른 별빛 타투',
    description: '눈 옆에서 반짝이는 청록빛 별. 세상에 하나뿐인 문신!',
    price: 1200,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-dark-flame',
    name: '다크 플레임',
    description: '볼 위로 피어오르는 보랏빛 불꽃.',
    price: 1200,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-heart',
    name: '하트 드리프트',
    description: '볼에 콕 찍힌 빨간 하트와 흩날리는 조각.',
    price: 1200,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-crescent',
    name: '초승달 문신',
    description: '금빛 초승달 안에 작은 별이 반짝여요.',
    price: 1200,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-demon-wing',
    name: '데몬 윙',
    description: '검붉은 작은 날개. 살짝 시크하게!',
    price: 1200,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-black-star',
    name: '별 문신',
    description: '볼에 새긴 까만 별. 언제나 사랑받는 클래식.',
    price: 800,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-teardrop',
    name: '눈물방울',
    description: '눈 아래 똑 떨어진 까만 눈물 한 방울.',
    price: 800,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-x',
    name: 'X자 문신',
    description: '볼에 그린 까만 X 표시.',
    price: 800,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-paw',
    name: '발바닥 자국',
    description: '냥이가 콕 찍고 간 발바닥 자국.',
    price: 800,
    slot: 'tattoo',
  },
  {
    id: 'tattoo-bolt',
    name: '번개 문신',
    description: '눈 옆을 가르는 까만 번개.',
    price: 800,
    slot: 'tattoo',
  },
  {
    id: 'top-neko-hoodie',
    name: '네코 후드티',
    description: '볼이 발그레한 흰 고양이가 그려진 까만 후드티. 후드 끈까지 귀여워요.',
    price: 2500,
    slot: 'top',
  },
  {
    id: 'top-aurora-jumper',
    name: '별하늘 오로라 점퍼',
    description: '라벤더빛 점퍼에 금빛 별과 반짝이가 콕콕.',
    price: 3000,
    slot: 'top',
  },
  {
    id: 'top-dracula-cape',
    name: '드라큘라 케이프',
    description: '빨간 리본에 붉은 안감 망토가 펄럭이는 검정 재킷.',
    price: 3500,
    slot: 'top',
  },
  {
    id: 'top-dino-hoodie',
    name: '공룡 후드티',
    description: '어깨에 초록 가시, 옆으로 꼬리가 삐죽 나온 공룡 후드티.',
    price: 3000,
    slot: 'top',
  },
  {
    id: 'top-wizard-robe',
    name: '마법사 로브',
    description: '금빛 테두리와 늘어진 금 장식이 달린 검정 로브.',
    price: 3500,
    slot: 'top',
  },
  {
    id: 'top-blouse',
    name: '베이직 블라우스',
    description: '까만 리본을 단 깔끔한 흰 블라우스.',
    price: 1500,
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
    price: 1500,
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
    id: 'bottom-starry-skirt',
    name: '별하늘 스커트 팬츠',
    description: '금빛 별이 콕콕 박힌 남색 튀튀 치마. 단도 금색이에요.',
    price: 2500,
    slot: 'bottom',
  },
  {
    id: 'bottom-cat-jogger',
    name: '냥냥 점프팬츠',
    description: '무릎에 분홍 발바닥이 찍힌 하얀 조거 팬츠.',
    price: 2500,
    slot: 'bottom',
  },
  {
    id: 'bottom-academy-skirt',
    name: '마법의 아카데미 팬츠',
    description: '금 단추와 금빛 단이 달린 보라 치마바지.',
    price: 3000,
    slot: 'bottom',
  },
  {
    id: 'bottom-cloud-pants',
    name: '구름솜 트레이닝 팬츠',
    description: '흰 구름 무늬가 둥실 떠 있는 하늘빛 통바지.',
    price: 2500,
    slot: 'bottom',
  },
  {
    id: 'bottom-cherry-skirt',
    name: '체리 블룸 스커트팬츠',
    description: '분홍 체리 점에 흰 프릴 단을 단 빨간 치마.',
    price: 2500,
    slot: 'bottom',
  },
  {
    id: 'bottom-denim-shorts',
    name: '데님 쇼츠',
    description: '밑단 올이 살짝 풀린 청 반바지.',
    price: 1500,
    slot: 'bottom',
  },
  {
    id: 'bottom-red-pleats',
    name: '체크 플리츠 스커트',
    description: '빨강·검정 타탄 체크 주름치마.',
    price: 2000,
    slot: 'bottom',
  },
  {
    id: 'bottom-track-shorts',
    name: '트레이닝 반바지',
    description: '바깥쪽에 흰 줄이 들어간 까만 운동 반바지.',
    price: 1500,
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
    id: 'bottom-wide-denim',
    name: '와이드 데님 팬츠',
    description: '통이 넓고 밑단을 접어 올린 청바지.',
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
    price: 3500,
    slot: 'hairItem',
    fullHead: true,
  },
  {
    id: 'hair-alien',
    name: '외계인 머리',
    description: '커다란 까만 눈의 연두색 외계인. 머리를 통째로 바꿔요.',
    price: 3500,
    slot: 'hairItem',
    fullHead: true,
  },
  {
    id: 'hair-dino',
    name: '으르렁 공룡 머리',
    description: '정면을 보고 입을 쩍 벌린 갈색 공룡. 머리를 통째로 바꿔요.',
    price: 3500,
    slot: 'hairItem',
    fullHead: true,
  },
]
