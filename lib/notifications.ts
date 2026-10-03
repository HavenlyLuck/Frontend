/*
 * 마이페이지 "최근 알림" + 화면 팝업에 쓰는 알림 저장소.
 * TODO(backend): 알림 API가 생기면 서버 목록으로 교체 — 지금은 사이트를 열어둔 동안 프론트가 감지한 알림만
 * 이 브라우저에 쌓인다 (다른 기기에서는 안 보이고, 사이트를 안 보고 있을 땐 받을 수 없음).
 */
export interface AppNotification {
  id: string
  kind: 'raffle-soldout'
  title: string
  body: string
  href?: string
  createdAt: string
  read: boolean
}

export const NOTIFICATIONS_UPDATED_EVENT = 'notifications-updated'
const KEY_PREFIX = 'notifications:'
const MAX_ITEMS = 50

function storageKey(): string {
  return KEY_PREFIX + (localStorage.getItem('userId') ?? '')
}

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey()) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save(list: AppNotification[]) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(list.slice(0, MAX_ITEMS)))
  } catch {
    // 저장이 막힌 환경에서는 팝업만 보이고 목록엔 남지 않는다
  }
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
}

// 같은 id 알림이 이미 있으면 추가하지 않고 false를 반환 (중복 팝업 방지)
export function addNotification(n: Omit<AppNotification, 'createdAt' | 'read'>): boolean {
  const list = getNotifications()
  if (list.some(item => item.id === n.id)) return false
  save([{ ...n, createdAt: new Date().toISOString(), read: false }, ...list])
  return true
}

export function markAllNotificationsRead() {
  const list = getNotifications()
  if (!list.some(n => !n.read)) return
  save(list.map(n => ({ ...n, read: true })))
}
