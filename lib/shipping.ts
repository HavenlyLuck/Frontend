// 배송 규칙 — 화면 안내 문구가 모두 이 값을 쓴다 (2026-11 결정)
// 배송비는 보관함에서 배송 신청할 때 한 번 결제한다. 여러 상품을 한 번에 신청하면 묶어서 한 상자로 보내고 배송비도 한 번만.
// ※ 실제 결제(배송 신청 시 카드 결제)는 백엔드 결제 종류 추가가 필요하다 — 그 전까지는 안내만 보인다.
export const SHIPPING_FEE = 4000
export const SHIP_WITHIN_BUSINESS_DAYS = 3

export const SHIPPING_FEE_TEXT = `${SHIPPING_FEE.toLocaleString()}원`
// 한 줄 안내 — 상품 상세·결제 창·보관함에 그대로 쓴다
export const SHIPPING_NOTICE = `배송비 ${SHIPPING_FEE_TEXT}은 보관함에서 배송 신청할 때 따로 결제돼요. 여러 상품을 한 번에 신청하면 묶어서 보내고 배송비도 ${SHIPPING_FEE_TEXT} 한 번만 내요. 신청 후 영업일 기준 ${SHIP_WITHIN_BUSINESS_DAYS}일 안에 발송해요.`
