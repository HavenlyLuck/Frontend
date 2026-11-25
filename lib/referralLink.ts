// 친구 초대 링크 — 상품 페이지 링크 뒤에 ?ref=내 추천인 코드를 붙여 보낸다.
// 친구가 그 링크로 들어오면 코드를 이 브라우저에 기억해 두었다가, 회원가입 화면의 추천인 칸에 미리 채운다.
const KEY = 'chunwoon_ref'
const KEEP_MS = 30 * 24 * 60 * 60 * 1000   // 30일 동안만 기억

const clean = (code: string) => code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20)

// 지금 주소에 ?ref=가 있으면 기억한다 (모든 화면에서 한 번 부른다 — components/ReferralCapture.tsx)
export function captureReferralFromUrl(): void {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (!ref || !clean(ref)) return
    localStorage.setItem(KEY, JSON.stringify({ code: clean(ref), at: Date.now() }))
  } catch {}
}

export function storedReferralCode(): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { code, at } = JSON.parse(raw) as { code?: string; at?: number }
    if (!code || !at || Date.now() - at > KEEP_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return clean(code)
  } catch {
    return null
  }
}

// 지금 보고 있는 페이지 주소에 내 추천인 코드를 붙인 링크 (코드가 없으면 그냥 페이지 주소)
export function inviteLink(path: string, code: string | null): string {
  const url = new URL(path, window.location.origin)
  url.search = ''
  url.hash = ''
  if (code) url.searchParams.set('ref', code)
  return url.toString()
}
