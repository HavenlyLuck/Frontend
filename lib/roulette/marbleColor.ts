// 추첨 구슬 색상 — 응모 번호(entry_number) 기준으로 색상환을 50등분해서 배정한다.
// RaffleDrawCanvas(실제 추첨 애니메이션)와 응모 상세 페이지의 "구슬 색 안내" 팝업이
// 항상 같은 색을 보여주도록 이 함수 하나만 사용한다.
export const MARBLE_COLOR_COUNT = 50

// 1번, 2번, 3번...이 빨강-주황-노랑 순으로 무지개처럼 나란히 이어지지 않도록,
// 색상환 인덱스를 이 값만큼씩 건너뛰며 뒤섞는다. MARBLE_COLOR_COUNT와 서로소여야
// 1~50번이 겹치지 않고 색상환 전체를 한 바퀴 고르게 채운다 (50 = 2×5×5, 37은 소수라 서로소).
const HUE_SHUFFLE_STEP = 37

export function getMarbleColor(entryNumber: number): string {
  const shuffledIndex = (entryNumber * HUE_SHUFFLE_STEP) % MARBLE_COLOR_COUNT
  const hue = Math.round((360 / MARBLE_COLOR_COUNT) * shuffledIndex)
  // 채도/명도를 낮춰 캔디 네온이 아니라 보석(잼톤) 느낌으로 — 사이트의 다크 컬렉터블 톤과 맞춘다.
  // 색상 자체는 여전히 360도를 다 쓰므로 응모자 구분력은 그대로 유지된다.
  return `hsl(${hue}, 62%, 46%)`
}
