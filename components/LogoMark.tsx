// 천운 로고 — 원본은 디자이너가 준 대표로고.svg / 심볼로고.svg
// - Logo: 심볼 + "천운" 글자 (내비·푸터·모바일 로그인 카드). 어두운 배경용으로 글자만 밝은색으로 바꾼 public/images/logo.svg
// - LogoMark: 심볼만 (로그인·회원가입 왼쪽 큰 마크). public/images/logo-symbol.svg
// 탭 아이콘은 app/icon.svg, 홈 화면 아이콘은 app/apple-icon.png, 카톡 공유 이미지는 public/og-image.png

export function Logo({ className }: { className?: string }) {
  return <img className={className} src="/images/logo.svg" alt="천운" />
}

export default function LogoMark({ className }: { className?: string }) {
  return <img className={className} src="/images/logo-symbol.svg" alt="" aria-hidden="true" />
}
