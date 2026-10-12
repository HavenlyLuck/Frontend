import { AVATAR_LIMITS, withItem, type AvatarConfig, type AvatarNumberKey } from './avatar/compose'
import { CAPES, HATS, WEAPONS } from './avatar/parts'
import { mulberry32 } from './lightningDraw/scene'

/*
 * 아바타 자랑 대회 — 서버 API 자리. 백엔드가 아직 없어서 지금은 이 파일이 서버 역할을 흉내 낸다.
 * (참가자는 시즌 번호로 만든 샘플 + 내 참가, 내 참가·투표 기록은 이 브라우저 localStorage)
 *
 * 규칙: 무료 참가(현재 저장된 캐릭터로), 1계정 하루 1표, 자기 자신에게 투표 불가, 주간 시즌(월 00:00 ~ 일 23:59, 한국 시간)
 *       1~3등에게 수상자 전용 아바타 아이템 + 쌀 응모권(무료 응모권, 낙첨돼도 환급 없음)
 *
 * TODO(backend):
 *   GET  /contests/current                         → ContestSeason (참가자·득표수·내 참가 id·오늘 투표 여부 포함)
 *   POST /contests/{season_id}/entries             → 내 현재 캐릭터로 참가 (시즌당 1회, 이후 캐릭터를 바꾸면 갱신 여부는 정책 결정)
 *   POST /contests/{season_id}/entries/{id}/vote   → 하루 1표, 자기 자신 금지, 가입 직후 계정 제한 등 어뷰징 방지는 서버에서
 *   시즌 종료 시 순위 확정 → 수상자에게 아이템·쌀 응모권 지급
 */

export interface ContestEntry {
  entry_id: number
  nickname: string
  avatar_config: AvatarConfig
  votes: number
  joined_at: string
}

export interface ContestPrize {
  rank: 1 | 2 | 3
  item: string // 수상자 전용 아바타 아이템
  ssal_ticket: number // 쌀 응모권(무료 응모권, 낙첨돼도 환급 없음) 장수 — 쌀포인트를 새로 만들지 않으려고 쌀포인트 대신 준다
}

export interface ContestSeason {
  season_id: number
  title: string
  starts_at: string
  ends_at: string
  prizes: ContestPrize[]
  entries: ContestEntry[]
  my_entry_id: number | null
  voted_today: boolean
}

// 임시 상품 — 운영 정책이 정해지면 서버 값으로
const PRIZES: ContestPrize[] = [
  { rank: 1, item: '수상자 전용 금왕관', ssal_ticket: 5 },
  { rank: 2, item: '수상자 전용 은왕관', ssal_ticket: 3 },
  { rank: 3, item: '수상자 전용 동왕관', ssal_ticket: 1 },
]

const KST_MS = 9 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
// 2026-01-05(월) 00:00 KST를 1주차로 센다
const SEASON_EPOCH = Date.UTC(2026, 0, 5) - KST_MS

function currentWeek(now = Date.now()) {
  const index = Math.floor((now - SEASON_EPOCH) / WEEK_MS)
  const start = SEASON_EPOCH + index * WEEK_MS
  return { seasonId: index + 1, start, end: start + WEEK_MS }
}

// "10월 2주차" — 시즌 시작일(월요일, 한국 시간)이 그 달의 몇 번째 주인지
function seasonTitle(start: number) {
  const d = new Date(start + KST_MS)
  return `${d.getUTCMonth() + 1}월 ${Math.ceil(d.getUTCDate() / 7)}주차`
}

// 오늘(한국 시간) 날짜 — 하루 1표 기준
function todayKst(now = Date.now()) {
  return new Date(now + KST_MS).toISOString().slice(0, 10)
}

const NICKNAMES = [
  '행운의쌀알', '번개맞은자', '쿠지장인', '픽셀패셔니스타', '오늘도당첨', '라스트원헌터',
  '천원의기적', '망토휘날리며', '불칼든해적', '산타는나야', '조용한수집가', '응모권부자',
]

function sampleAvatar(rng: () => number): AvatarConfig {
  const pick = (k: AvatarNumberKey) => Math.floor(rng() * AVATAR_LIMITS[k])
  let c: AvatarConfig = {
    v: 2, gender: rng() < 0.5 ? 'm' : 'f',
    skin: pick('skin'), hair: pick('hair'), hairColor: pick('hairColor'),
    top: pick('top'), topColor: pick('topColor'), bottom: pick('bottom'), bottomColor: pick('bottomColor'),
  }
  // 대회라 다들 꾸미고 나온다 — 아이템을 몇 개씩
  if (rng() < 0.5) c = withItem(c, 'hat', Math.floor(rng() * HATS.length))
  if (rng() < 0.4) c = withItem(c, 'cape', Math.floor(rng() * CAPES.length))
  if (rng() < 0.4) c = withItem(c, 'weapon', Math.floor(rng() * WEAPONS.length))
  return c
}

function sampleEntries(seasonId: number, start: number): ContestEntry[] {
  const rng = mulberry32(seasonId * 7349 + 11)
  return NICKNAMES.map((nickname, i) => ({
    entry_id: 1000 + i,
    nickname,
    avatar_config: sampleAvatar(rng),
    votes: Math.floor(rng() * 40),
    joined_at: new Date(start + Math.floor(rng() * 3) * 86_400_000 + i * 3_600_000).toISOString(),
  }))
}

// ── 이 브라우저에 남기는 내 기록 (서버가 생기면 없어진다) ──

interface LocalState {
  myEntry?: ContestEntry
  votes: Record<number, number> // 내가 준 표 (entry_id → 표 수)
  lastVoteDay?: string
}

const key = (seasonId: number) => `avatarContest:${seasonId}:${localStorage.getItem('userId') ?? ''}`

function readLocal(seasonId: number): LocalState {
  try {
    const parsed = JSON.parse(localStorage.getItem(key(seasonId)) ?? 'null')
    return parsed && typeof parsed === 'object' ? { votes: {}, ...parsed } : { votes: {} }
  } catch {
    return { votes: {} }
  }
}

function writeLocal(seasonId: number, state: LocalState) {
  localStorage.setItem(key(seasonId), JSON.stringify(state))
}

// ── 화면이 부르는 API ──

export async function getCurrentContest(): Promise<ContestSeason> {
  const { seasonId, start, end } = currentWeek()
  const local = readLocal(seasonId)
  const entries = [...sampleEntries(seasonId, start), ...(local.myEntry ? [local.myEntry] : [])]
    .map(e => ({ ...e, votes: e.votes + (local.votes[e.entry_id] ?? 0) }))
  return {
    season_id: seasonId,
    title: `${seasonTitle(start)} 아바타 자랑 대회`,
    starts_at: new Date(start).toISOString(),
    ends_at: new Date(end).toISOString(),
    prizes: PRIZES,
    entries,
    my_entry_id: local.myEntry?.entry_id ?? null,
    voted_today: local.lastVoteDay === todayKst(),
  }
}

// token·nickname: 서버가 생기면 토큰으로 본인 확인 (지금은 화면이 넘겨준 내 정보로 흉내)
export async function joinContest(_token: string, me: { nickname: string; avatar: AvatarConfig }): Promise<ContestSeason> {
  const { seasonId } = currentWeek()
  const local = readLocal(seasonId)
  if (local.myEntry) throw new Error('이번 시즌에는 이미 참가했어요.')
  local.myEntry = { entry_id: 1, nickname: me.nickname, avatar_config: me.avatar, votes: 0, joined_at: new Date().toISOString() }
  writeLocal(seasonId, local)
  return getCurrentContest()
}

export async function voteContest(_token: string, entryId: number): Promise<ContestSeason> {
  const { seasonId } = currentWeek()
  const local = readLocal(seasonId)
  if (local.lastVoteDay === todayKst()) throw new Error('오늘은 이미 투표했어요. 내일 다시 투표할 수 있어요.')
  if (local.myEntry?.entry_id === entryId) throw new Error('내 아바타에는 투표할 수 없어요.')
  local.votes[entryId] = (local.votes[entryId] ?? 0) + 1
  local.lastVoteDay = todayKst()
  writeLocal(seasonId, local)
  return getCurrentContest()
}
