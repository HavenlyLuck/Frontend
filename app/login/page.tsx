'use client'

import { useEffect, useState } from 'react'
import LogoMark, { Logo } from '@/components/LogoMark'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, ApiError } from '@/lib/api'
import { notifyPointsUpdated } from '@/hooks/useMyPoints'
import { safeNextPath, signupPath } from '@/lib/auth'
import { notifyStorageUpdated } from '@/lib/storage'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ userId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // 로그인 뒤 돌아갈 주소(?next=) — 회원가입으로 넘어가도 이어서 들고 간다
  const [signupHref, setSignupHref] = useState('/signup')
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next')
    if (next) setSignupHref(signupPath(safeNextPath(next)))
  }, [])

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
      notifyStorageUpdated()
      router.push(safeNextPath(new URLSearchParams(window.location.search).get('next')))
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
          <LogoMark className="auth-brand-mark" />
          <h1>
            천원 한 장,
            <br />
            <span>천운</span>을 뽑다.
          </h1>
          <ul className="auth-brand-facts">
            <li><b>1,000원</b>부터 응모 시작</li>
            <li><b>매진</b> 시 바로 자동 추첨</li>
            <li>낙첨해도 <b>쌀포인트</b>로 페이백</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-card-mobile-mark">
            <Logo />
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
            아직 계정이 없으신가요? <Link href={signupHref}>회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
