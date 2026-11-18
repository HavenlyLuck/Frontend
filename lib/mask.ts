// 화면에 남의 닉네임을 보여줄 때 가운데를 가린다: 럭키별 → 럭*별, 구름 → 구*
export function maskNickname(name: string): string {
  const chars = [...name]
  if (chars.length <= 1) return name
  if (chars.length === 2) return `${chars[0]}*`
  return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`
}
