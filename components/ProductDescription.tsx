// 상품 설명 — "항목: 값" 모양의 줄(상품정보제공고시)은 표로, 나머지 줄은 소개 글로 보여준다.
// 관리자 상품 등록 화면의 "고시 양식 넣기"(lib/productInfo.ts)로 채운 줄이 표가 된다. 값을 비운 줄은 보이지 않는다.
// "[랜덤 상품 안내]"처럼 대괄호 제목 줄로 나눈 부분은 고시 표와 같은 모양의 접는 칸으로 보여준다.

import { parseProductDescription } from '@/lib/productInfo'

// part: "intro"는 소개 글만, "notices"는 접는 칸(고시 표 · [제목] 칸)만 — 상세 화면은 소개 글은 오른쪽 정보 칸에,
// 접는 칸은 사진 아래(.product-notices)에 따로 둔다
export default function ProductDescription({ text, className = 'description', part = 'all' }: {
  text: string
  className?: string
  part?: 'all' | 'intro' | 'notices'
}) {
  const { intro, info, sections } = parseProductDescription(text)
  const showIntro = part !== 'notices'
  const showNotices = part !== 'intro'
  if (part === 'notices' && info.length === 0 && sections.length === 0) return null
  return (
    <>
      {showIntro && intro && <div className={className}>{intro}</div>}
      {showNotices && info.length > 0 && (
        <details className="product-info-notice">
          <summary>상품 정보 (상품정보제공고시)</summary>
          <table className="policy-table">
            <tbody>
              {info.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      {showNotices && sections.map((s, i) => (
        <details key={`${i}-${s.title}`} className="product-info-notice">
          <summary>{s.title}</summary>
          <div className="product-info-section">{s.body}</div>
        </details>
      ))}
    </>
  )
}
