export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('token')
}
