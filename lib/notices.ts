// 공지사항 — 누구나 볼 수 있고, 작성·수정·고정·삭제는 관리자만 (서버에서 관리자 권한을 확인한다)

import { request } from './api'

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

// 서버가 고정글 먼저 → 최신순으로 정렬해서 준다
export function getNotices() {
  return request<Notice[]>('/notices')
}

export function createNotice(token: string, input: NoticeInput) {
  return request<Notice>('/notices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export function updateNotice(token: string, id: number, input: Partial<NoticeInput>) {
  return request<Notice>(`/notices/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function deleteNotice(token: string, id: number): Promise<void> {
  await request<null>(`/notices/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
