// 기능 켜기/끄기 스위치 — 값만 바꾸면 화면이 바로 따라간다.

// 컨텐츠 메뉴 전체 — 아바타 아이디어 공모전(서버 있음)이 열려 있어 켠다.
export const CONTENTS_OPEN = true;

// 아바타 자랑 대회: 참가·투표·보상 서버 API가 아직 없어(lib/avatarContest.ts가 흉내만 냄) "준비 중"으로 둔다.
// 백엔드(/contests ...)가 준비되면 true로 바꾸면 컨텐츠 카드와 페이지가 열린다.
export const AVATAR_CONTEST_OPEN = false;

// 메인 배너 두 번째 장에 우선으로 띄울 응모 상품 번호 (앞에 있을수록 먼저).
// 판매 중(매진 전)일 때만 뜨고, 끝났거나 없으면 평소처럼 가장 많이 팔린 응모를 띄운다. 비우면 평소대로
export const HERO_PINNED_RAFFLE_IDS: number[] = [
  7, // 극장판 체인소맨 레제편 레제 (S-FIRE)
]
