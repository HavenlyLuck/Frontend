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
  // 관리자 2단계 인증 — 비밀번호가 맞으면 서버가 OTP 코드를 요청한다(otp_required). 그때부터 코드 칸을 보여준다
  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  // 로그인 뒤 돌아갈 주소(?next=) — 회원가입으로 넘어가도 이어서 들고 간다
  const [signupHref, setSignupHref] = useState('/signup')
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search)
    const next = qs.get('next')
    if (next) setSignupHref(signupPath(safeNextPath(next)))
    // 아이디 찾기·비밀번호 재설정 후 넘어오면 아이디를 미리 채워 둔다
    const id = qs.get('id')
    if (id) setForm(f => ({ ...f, userId: id }))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
    // 아이디·비밀번호를 고치면 OTP 단계는 처음부터
    if (otpStep) {
      setOtpStep(false)
      setOtpCode('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({
        login_id: form.userId,
        password: form.password,
        ...(otpStep ? { otp_code: otpCode } : {}),
      })
      localStorage.setItem('token', res.access_token)
      localStorage.setItem('refreshToken', res.refresh_token)
      localStorage.setItem('userId', form.userId)
      localStorage.setItem('isAdmin', String(res.is_admin))
      notifyPointsUpdated()
      notifyStorageUpdated()
      router.push(safeNextPath(new URLSearchParams(window.location.search).get('next')))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'otp_required') {
        setOtpStep(true)
        setOtpCode('')
        return
      }
      if (err instanceof ApiError && err.code === 'otp_invalid') setOtpCode('')
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
            <li><span>응모권 1장 <b>1,000원</b></span></li>
            <li><b>전량 판매 시 즉시 추첨</b></li>
            <li><span>낙첨 시 <b>쌀포인트 환급</b></span></li>
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
            {otpStep && (
              <div className="field">
                <input
                  id="login-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="OTP 인증 코드 6자리"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="field-input"
                  autoComplete="one-time-code"
                />
                <p className="field-hint">관리자 계정이에요. OTP 앱에 표시된 6자리 코드를 입력해주세요.</p>
              </div>
            )}
            {error && <p className="field-hint fail">{error}</p>}
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className="auth-links">
            <Link href={signupHref}>회원가입</Link>
            <Link href="/find-id">아이디 찾기</Link>
            <Link href="/find-password">비밀번호 찾기</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
