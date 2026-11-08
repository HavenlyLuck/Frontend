// 천운 로고 마크 (번개 + 구름) — 내비·푸터·로그인·회원가입이 모두 이걸 쓴다
// 원본: 검은 배경 로고에서 배경을 투명하게 뺀 이미지. 파비콘은 app/icon.png (검은 배경 그대로)
export default function LogoMark({ className }: { className?: string }) {
  return <img className={className} src="/images/logo-mark.png" alt="" aria-hidden="true" />
}
