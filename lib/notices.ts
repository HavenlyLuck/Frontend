/*
 * 공지사항 — 서버 API 자리. 운영 서버에 공지사항 API가 아직 없어서 지금은 이 브라우저(localStorage)에만 저장한다.
 * → 관리자가 지금 쓴 글은 그 관리자 브라우저에서만 보인다. 실제 공지로 쓰려면 아래 API가 필요하다.
 *
 * TODO(backend):
 *   GET    /notices            — 목록 (누구나, 고정글 먼저 → 최신순)
 *   POST   /notices            — 작성 (관리자만, 서버에서 관리자 권한 확인 필수)
 *   PATCH  /notices/{id}       — 수정·고정 (관리자만)
 *   DELETE /notices/{id}       — 삭제 (관리자만)
 *   Notice: { notice_id, title, content, pinned, created_at }
 *   교체할 때 화면(app/notice)은 그대로 두고 이 파일의 함수 내부만 fetch로 바꾸면 된다.
 */

export interface Notice {
  notice_id: number
  title: string
  content: string
  pinned: boolean
  created_at: string
}

export interface NoticeInput {
  title: string
  content: string
  pinned: boolean
}

const KEY = 'notices'

function readAll(): Notice[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list: Notice[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

// 고정글 먼저, 그 안에서 최신순
export function sortNotices(list: Notice[]): Notice[] {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.created_at < b.created_at ? 1 : -1))
}

export async function getNotices(): Promise<Notice[]> {
  return sortNotices(readAll())
}

// token: 서버가 생기면 관리자 확인에 쓰인다 (지금은 화면에서만 관리자에게 버튼을 보여준다)
export async function createNotice(_token: string, input: NoticeInput): Promise<Notice> {
  const list = readAll()
  const notice: Notice = {
    notice_id: list.reduce((max, n) => Math.max(max, n.notice_id), 0) + 1,
    title: input.title,
    content: input.content,
    pinned: input.pinned,
    created_at: new Date().toISOString(),
  }
  writeAll([notice, ...list])
  return notice
}

export async function updateNotice(_token: string, id: number, input: Partial<NoticeInput>): Promise<Notice> {
  const list = readAll()
  const target = list.find(n => n.notice_id === id)
  if (!target) throw new Error('공지사항을 찾을 수 없어요.')
  Object.assign(target, input)
  writeAll(list)
  return target
}

export async function deleteNotice(_token: string, id: number): Promise<void> {
  writeAll(readAll().filter(n => n.notice_id !== id))
}
