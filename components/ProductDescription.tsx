// 상품 설명 — "항목: 값" 모양의 줄(상품정보제공고시)은 표로, 나머지 줄은 소개 글로 보여준다.
// 관리자 상품 등록 화면의 "고시 양식 넣기"(lib/productInfo.ts)로 채운 줄이 표가 된다. 값을 비운 줄은 보이지 않는다.

import { parseProductDescription } from '@/lib/productInfo'

export default function ProductDescription({ text, className = 'description' }: { text: string; className?: string }) {
  const { intro, info } = parseProductDescription(text)
  return (
    <>
      {intro && <div className={className}>{intro}</div>}
      {info.length > 0 && (
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
    </>
  )
}
