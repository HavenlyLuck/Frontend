import { refreshAccessToken } from './api'

const EXPIRY_SKEW_SECONDS = 30

interface TokenPayload {
  sub?: string
  type?: string
  is_admin?: boolean
  exp?: number
}

function decodeJwt(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

function isExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload?.exp) return true
  return payload.exp * 1000 - EXPIRY_SKEW_SECONDS * 1000 <= Date.now()
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('token')
}

// 로그인 화면 주소 — 로그인 뒤 돌아올 페이지(기본: 지금 보는 페이지)를 next로 붙인다
export function loginPath(next?: string): string {
  const target = next ?? (typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search)
  return target && target !== '/' && !target.startsWith('/login') ? `/login?next=${encodeURIComponent(target)}` : '/login'
}

// next 값이 우리 사이트 안의 경로일 때만 쓴다 (//evil.com 같은 외부 주소로 보내지 않게)
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  return next
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userId')
  localStorage.removeItem('isAdmin')
}

export interface Session {
  token: string
  isAdmin: boolean
}

// access token이 만료됐거나 곧 만료되면 refresh token으로 갱신한 뒤,
// 현재 세션의 관리자 여부와 함께 유효한 토큰을 반환한다.
// refresh마저 실패하면 인증 정보를 모두 지우고 null을 반환한다.
export async function getValidSession(): Promise<Session | null> {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem('token')
  if (!token) return null

  if (!isExpired(token)) {
    return { token, isAdmin: decodeJwt(token)?.is_admin === true }
  }

  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    clearAuth()
    return null
  }

  try {
    const res = await refreshAccessToken(refreshToken)
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('isAdmin', String(res.is_admin))
    return { token: res.access_token, isAdmin: res.is_admin }
  } catch {
    clearAuth()
    return null
  }
}
