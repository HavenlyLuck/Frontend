'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, ApiError } from '@/lib/api'
import { notifyPointsUpdated } from '@/hooks/useMyPoints'

const CLOUD_MARK_PATH =
  'M6 20 C6 15.5 9.6 12.5 13.5 13.2 C14.6 9.6 19 8.3 22 11 C25.6 11.4 28 14.3 27 17.8 C29.2 19 29.2 22.4 26.5 23.3 C25.5 25.6 22.6 26.2 20.8 24.6 C19.4 26.4 16.4 26.3 15.1 24.4 C12.8 25.6 9.8 24.3 9.3 21.8 C7.4 21.9 6 21.2 6 20 Z'

function CloudMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path d={CLOUD_MARK_PATH} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="23" cy="12.5" r="1.8" fill="var(--gold)" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ userId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ login_id: form.userId, password: form.password })
      localStorage.setItem('token', res.access_token)
      localStorage.setItem('refreshToken', res.refresh_token)
      localStorage.setItem('userId', form.userId)
      localStorage.setItem('isAdmin', String(res.is_admin))
      notifyPointsUpdated()
      router.push('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <div className="auth-brand">
          <CloudMark className="auth-brand-mark" />
          <h1>
            천원 한 장,
            <br />
            <span>천운</span>을 뽑다.
          </h1>
          <ul className="auth-brand-facts">
            <li><b>1,000P</b>부터 응모 시작</li>
            <li><b>매진</b> 시 바로 자동 추첨</li>
            <li>낙첨해도 <b>쌀포인트</b>로 페이백</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-card-mobile-mark">
            <CloudMark />
            천운
          </div>
          <h2 className="auth-title">로그인</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <input
                id="login-userId"
                name="userId"
                type="text"
                placeholder="아이디"
                value={form.userId}
                onChange={handleChange}
                required
                className="field-input"
                autoComplete="username"
              />
            </div>
            <div className="field">
              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={handleChange}
                required
                className="field-input"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="field-hint fail">{error}</p>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <p className="auth-switch">
            아직 계정이 없으신가요? <Link href="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
