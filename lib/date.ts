import { parseServerTime } from './raffle'

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

// 알림처럼 분 단위가 의미 있는 곳용 — 하루가 지나면 formatRelativeDate와 같은 표기
export function formatTimeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`
  return formatRelativeDate(iso)
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주일 전`
  return date.toLocaleDateString('ko-KR')
}

// ── 한국 시간 기준 날짜 (서버 시각은 끝에 Z 없는 UTC라서 parseServerTime으로 읽는다) ──
const KST_PARTS = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
})

function kstParts(iso: string) {
  const parts = Object.fromEntries(KST_PARTS.formatToParts(new Date(parseServerTime(iso))).map(p => [p.type, p.value]))
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), time: `${parts.hour}:${parts.minute}` }
}

// "2026-11" — 월별로 묶을 때 쓰는 키
export function kstMonthKey(iso: string): string {
  const { year, month } = kstParts(iso)
  return `${year}-${String(month).padStart(2, '0')}`
}

// "2026-11" → "2026년 11월"
export function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return `${y}년 ${Number(m)}월`
}

// "2026. 11. 1. 17:46"
export function formatKstDateTime(iso: string): string {
  const { year, month, day, time } = kstParts(iso)
  return `${year}. ${month}. ${day}. ${time}`
}

// "2026. 11. 1."
export function formatKstDate(iso: string): string {
  const { year, month, day } = kstParts(iso)
  return `${year}. ${month}. ${day}.`
}
