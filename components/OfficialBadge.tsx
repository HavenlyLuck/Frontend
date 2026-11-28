import { SealCheckIcon } from '@phosphor-icons/react'

/*
 * "천운 공식" 배지 — 천운이 직접 올린 응모 (고객이 상점 상품을 모금으로 전환해 연 응모와 구분, lib/raffle.ts isOfficialRaffle).
 *   overlay: 카드 사진 왼쪽 위에 얹는다. 모바일 2열 카드에서도 카드 높이를 바꾸지 않으려고 글줄 대신 사진 위에 둔다
 *   inline : 상세 페이지 상태 줄 · 메인 배너 카드 머리처럼 글줄 안에
 */
export default function OfficialBadge({ variant = 'inline' }: { variant?: 'overlay' | 'inline' }) {
  return (
    <span className={`official-badge is-${variant}`}>
      <SealCheckIcon size={variant === 'overlay' ? 12 : 13} weight="fill" aria-hidden="true" />
      천운 공식
    </span>
  )
}
