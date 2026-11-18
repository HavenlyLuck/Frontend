// 상품정보제공고시 — 정식 칸이 서버에 생기기 전까지, 상품 설명란에 "항목: 값" 줄로 적고 상세 화면에서 표로 보여준다.
// 항목은 피규어·완구 기준(공정위 「전자상거래 등에서의 상품 등의 정보제공에 관한 고시」 완구 품목)으로 잡았다.
// ※ 품목별 정확한 항목은 고시 원문으로 다시 확인할 것.

export const PRODUCT_INFO_FIELDS = [
  '품명 및 모델명',
  '정품 여부',
  'KC 인증정보',
  '크기·중량',
  '색상',
  '재질',
  '사용연령',
  '출시년월',
  '제조자(수입자)',
  '제조국',
  '취급 시 주의사항',
  '품질보증기준',
  'A/S 책임자와 전화번호',
] as const

// 관리자 화면의 "고시 양식 넣기" — 늘 같은 값은 미리 채워 둔다
const PREFILLED: Partial<Record<(typeof PRODUCT_INFO_FIELDS)[number], string>> = {
  '정품 여부': '정품',
  '품질보증기준': '제품 하자 시 소비자분쟁해결기준에 따라 교환·환불',
  'A/S 책임자와 전화번호': '천운 고객센터 010-9831-1138',
}

export function productInfoTemplate(): string {
  return PRODUCT_INFO_FIELDS.map((k) => `${k}: ${PREFILLED[k] ?? ''}`).join('\n')
}

const FIELD_SET = new Set<string>(PRODUCT_INFO_FIELDS)

// 설명을 소개 글과 고시 표로 나눈다. 고시 항목 이름으로 시작하는 줄만 표로 간다 (소개 글에 ":"가 있어도 섞이지 않게)
export function parseProductDescription(text: string): { intro: string; info: [string, string][] } {
  const intro: string[] = []
  const info: [string, string][] = []
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([^:：]{1,30}?)\s*[:：]\s*(.*)$/)
    if (m && FIELD_SET.has(m[1].trim())) {
      if (m[2].trim()) info.push([m[1].trim(), m[2].trim()])
      continue
    }
    intro.push(line)
  }
  return { intro: intro.join('\n').trim(), info }
}
