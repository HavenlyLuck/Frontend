'use client'

import { useEffect, useRef, useState } from 'react'
import { Logo } from '@/components/LogoMark'
import { ApiError, enableAdminTotp, setupAdminTotp } from '@/lib/api'

/*
 * 관리자 2단계 인증(OTP) 등록 — 관리자 API는 OTP를 거친 토큰만 받으므로, 처음 한 번 여기서 등록한다.
 * Google Authenticator·Microsoft Authenticator 같은 앱에 키를 넣고, 앱에 뜬 6자리 코드로 확인한다.
 * 등록을 마치면 서버가 2단계 인증을 거친 새 토큰을 주고, 그 토큰으로 관리자 화면을 연다.
 */
export default function AdminTotpSetup({ token, onDone }: { token: string; onDone: (accessToken: string) => void }) {
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // 개발 모드에서 effect가 두 번 돌아도 키를 한 번만 만든다 (부를 때마다 새 키로 바뀐다)
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    setupAdminTotp(token)
      .then(setSetup)
      .catch((err) => setError(err instanceof ApiError ? err.message : '등록 정보를 불러오지 못했습니다.'))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await enableAdminTotp(token, code)
      localStorage.setItem('token', res.access_token)
      localStorage.setItem('refreshToken', res.refresh_token)
      localStorage.setItem('isAdmin', String(res.is_admin))
      onDone(res.access_token)
    } catch (err) {
      setCode('')
      setError(err instanceof ApiError ? err.message : '인증 코드를 확인하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 키를 4글자씩 띄워 보여준다 (앱에 손으로 옮겨 적기 쉽게)
  const groupedSecret = setup?.secret.match(/.{1,4}/g)?.join(' ') ?? ''

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 440, margin: '0 auto' }}>
        <div className="auth-card-mobile-mark">
          <Logo />
        </div>
        <h2 className="auth-title">관리자 2단계 인증 등록</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <p className="auth-desc">
            관리자 화면은 비밀번호와 OTP 앱의 인증 코드가 모두 있어야 열 수 있어요.
            Google Authenticator 같은 OTP 앱에서 <b>설정 키 입력</b>을 골라 아래 키를 넣어주세요.
          </p>
          {setup && (
            <div className="field">
              <input
                readOnly
                value={groupedSecret}
                aria-label="OTP 설정 키"
                className="field-input"
                style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                onFocus={(e) => e.currentTarget.select()}
              />
              <p className="field-hint">
                휴대폰에서 이 화면을 보고 있다면 <a href={setup.otpauth_uri}>OTP 앱에서 바로 열기</a>
              </p>
            </div>
          )}
          <div className="field">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="앱에 표시된 6자리 코드"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              disabled={!setup}
              className="field-input"
              autoComplete="one-time-code"
            />
          </div>
          {error && <p className="field-hint fail">{error}</p>}
          <button type="submit" className="auth-submit" disabled={!setup || loading || code.length !== 6}>
            {loading ? '확인 중...' : '등록하고 관리자 화면 열기'}
          </button>
          <p className="auth-desc" style={{ marginTop: 14 }}>
            등록한 휴대폰을 잃어버리면 화면에서 다시 등록할 수 없어요. 개발 담당자가 DB에서 등록을 초기화해야 해요.
          </p>
        </form>
      </div>
    </div>
  )
}
