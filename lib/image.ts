// 상품 사진 주소 도우미 (화면·서버 공용)

// Cloudinary 사진 주소에 크기·형식 자동 변환을 붙인다 (원본 그대로면 장당 수백 KB).
// 다른 곳의 사진이거나 이미 변환이 붙어 있으면 그대로 둔다
export function cloudinarySized(url: string, width: number): string {
  const marker = '/image/upload/'
  const i = url.indexOf(marker)
  if (i < 0 || !url.includes('res.cloudinary.com')) return url
  const rest = url.slice(i + marker.length)
  if (/^(f_|q_|w_|c_|t_)/.test(rest)) return url
  return `${url.slice(0, i + marker.length)}f_auto,q_auto,c_limit,w_${width}/${rest}`
}
