import { API_URL, ApiError, request } from './api'
import { SLOT_LABELS, WEAR_SLOTS, type WearSlot } from './avatar/shopItems'

/*
 * 아바타 아이디어 공모전 (컨텐츠) — "이런 아바타 아이템이 있으면 좋겠다"를 그림·사진으로 올리고,
 * 한 주(한국 시간 월요일 0시 ~ 다음 월요일 0시)가 끝나면 운영자가 아이디어가 좋은 3명을 뽑는다.
 * 1등 쌀 응모권 10장, 2·3등 5장 — 보관함의 쌀 응모권으로 바로 들어간다.
 */

export interface IdeaEntry {
  entry_id: number
  nickname: string
  category: string    // 아바타 분류 (WearSlot: hat · top · held ...)
  title: string
  description: string | null
  image_url: string
  rank: number | null
  created_at: string  // UTC, 끝에 Z 없음
  mine: boolean
  like_count: number
  liked: boolean      // 로그인한 내가 좋아요를 눌렀는지
}

export interface IdeaAdminEntry extends IdeaEntry {
  user_id: number
  hidden: boolean
}

export interface IdeaWinnersWeek {
  week_start: string  // 그 주 월요일 (한국 날짜, "2026-11-23")
  winners: IdeaEntry[]
}

export interface IdeaContestCurrent {
  week_start: string
  starts_at: string   // UTC
  ends_at: string     // UTC — 다음 월요일 0시(한국 시간)
  prizes: { rank: number; ssal_ticket: number }[]
  max_entries_per_week: number
  my_entry_count: number
  entries: IdeaEntry[]
  recent_winners: IdeaWinnersWeek[]
}

export interface IdeaAdminWeek {
  week_start: string
  entry_count: number
  awarded: boolean
  ongoing: boolean
}

const auth = (token?: string) => (token ? { Authorization: `Bearer ${token}` } : undefined)

export function getIdeaContest(token?: string) {
  return request<IdeaContestCurrent>('/idea-contest/current', { headers: auth(token) })
}

// 응모할 때 고르는 아바타 분류 — 아바타 꾸미기 분류와 같다 (모자 · 상의 · 손 ...)
export const IDEA_CATEGORIES: { id: WearSlot; label: string }[] = WEAR_SLOTS.map(slot => ({ id: slot, label: SLOT_LABELS[slot] }))

export function categoryLabel(id: string): string {
  return SLOT_LABELS[id as WearSlot] ?? id
}

export async function submitIdea(token: string, input: { category: WearSlot; title: string; description: string; image: File }): Promise<IdeaEntry> {
  const form = new FormData()
  form.append('category', input.category)
  form.append('title', input.title.trim())
  if (input.description.trim()) form.append('description', input.description.trim())
  form.append('image', input.image)
  const res = await fetch(`${API_URL}/idea-contest/entries`, { method: 'POST', headers: auth(token), body: form })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, typeof data?.detail === 'string' ? data.detail : '응모하지 못했어요. 잠시 후 다시 시도해 주세요.')
  return data as IdeaEntry
}

export async function deleteIdea(token: string, entryId: number): Promise<void> {
  const res = await fetch(`${API_URL}/idea-contest/entries/${entryId}`, { method: 'DELETE', headers: auth(token) })
  if (res.ok) return
  const data = await res.json().catch(() => null)
  throw new ApiError(res.status, typeof data?.detail === 'string' ? data.detail : '지우지 못했어요.')
}

// 좋아요 / 취소 — 한 계정이 한 응모작에 한 번 (이번 주 응모작만, 내 응모작 제외)
export function setIdeaLike(token: string, entryId: number, like: boolean) {
  return request<{ entry_id: number; like_count: number; liked: boolean }>(`/idea-contest/entries/${entryId}/like`, {
    method: like ? 'POST' : 'DELETE', headers: auth(token),
  })
}

// ── 관리자 ──
export function getIdeaAdminWeeks(token: string) {
  return request<IdeaAdminWeek[]>('/idea-contest/admin/weeks', { headers: auth(token) })
}

export function getIdeaAdminEntries(token: string, weekStart: string) {
  return request<IdeaAdminEntry[]>(`/idea-contest/admin/weeks/${weekStart}`, { headers: auth(token) })
}

// entryIds: 1등부터 차례로 (1~3개)
export function awardIdeaWeek(token: string, weekStart: string, entryIds: number[]) {
  return request<IdeaAdminEntry[]>(`/idea-contest/admin/weeks/${weekStart}/award`, {
    method: 'POST', headers: auth(token), body: JSON.stringify({ entry_ids: entryIds }),
  })
}

export function hideIdea(token: string, entryId: number, hidden: boolean) {
  return request<IdeaAdminEntry>(`/idea-contest/admin/entries/${entryId}/hide`, {
    method: 'POST', headers: auth(token), body: JSON.stringify({ hidden }),
  })
}

// ── 표시 도우미 ──
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// "2026-11-23" → "11월 4주차" (그 주 월요일이 그 달의 몇 번째 주인지)
export function weekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split('-').map(Number)
  return `${m}월 ${Math.ceil(d / 7)}주차`
}

// "2026-11-23" → "11월 23일(월) ~ 11월 29일(일)"
export function weekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const day = (offset: number) => {
    const t = new Date(Date.UTC(y, m - 1, d + offset))
    return `${t.getUTCMonth() + 1}월 ${t.getUTCDate()}일(${WEEKDAYS[t.getUTCDay()]})`
  }
  return `${day(0)} ~ ${day(6)}`
}
