'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoMark, { Logo } from '@/components/LogoMark'
import { checkPasswordReset, resetPassword, ApiError } from '@/lib/api'
import {
  requestIdentityVerification,
  readIdentityVerificationRedirect,
  IdentityVerificationResult,
} from '@/lib/identityVerification'

// 회원가입 화면과 같은 규칙
const USER_ID_REGEX = /^[A-Za-z0-9]{5,20}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,20}$/
// 모바일 본인인증은 페이지를 떠났다가 돌아오므로 입력한 아이디를 잠시 보관한다
const DRAFT_KEY = 'find-password-id'

export default function FindPasswordPage() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  // 본인인증으로 아이디 주인임이 확인되면 채워진다 → 새 비밀번호 입력 단계
  const [verifiedId, setVerifiedId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) setLoginId(id.replace(/[^A-Za-z0-9]/g, ''))

    const result = readIdentityVerificationRedirect(window.location.search)
    if (!result) return
    window.history.replaceState(null, '', window.location.pathname)
    let savedId = ''
    try {
      savedId = sessionStorage.getItem(DRAFT_KEY) ?? ''
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {}
    setLoginId(savedId)
    handleCertResult(savedId, result)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCertResult(id: string, result: IdentityVerificationResult) {
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (!id) {
      setError('아이디를 입력한 뒤 다시 인증해주세요.')
      return
    }
    setLoading(true)
    try {
      await checkPasswordReset(id, result.identityVerificationId)
      setVerifiedId(result.identityVerificationId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '본인 확인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCert(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!USER_ID_REGEX.test(loginId)) {
      setError('아이디는 영문·숫자 5~20자예요.')
      return
    }
    try { sessionStorage.setItem(DRAFT_KEY, loginId) } catch {}
    setLoading(true)
    try {
      const result = await requestIdentityVerification(`${window.location.origin}/find-password`)
      try { sessionStorage.removeItem(DRAFT_KEY) } catch {}
      await handleCertResult(loginId, result)
    } catch {
      setError('본인인증 창을 열지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!verifiedId) return
    if (!PASSWORD_REGEX.test(password)) {
      setError('비밀번호는 영문 대문자, 소문자, 숫자, 특수문자를 모두 포함한 8~20자여야 합니다.')
      return
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(loginId, verifiedId, password)
      alert('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.')
      router.push(`/login?id=${encodeURIComponent(loginId)}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const passwordHintClass = !password ? '' : PASSWORD_REGEX.test(password) ? 'ok' : 'fail'

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
        </div>

        <div className="auth-card">
          <div className="auth-card-mobile-mark">
            <Logo />
          </div>
          <h2 className="auth-title">{verifiedId ? '새 비밀번호 설정' : '비밀번호 찾기'}</h2>

          {verifiedId ? (
            <form className="auth-form" onSubmit={handleReset}>
              <p className="auth-desc"><b>{loginId}</b> 계정의 새 비밀번호를 입력해주세요.</p>
              <div className="field">
                <input
                  type="password"
                  placeholder="새 비밀번호"
                  value={password}
                  onChange={e => setPassword(e.target.value.replace(/[^\x21-\x7E]/g, ''))}
                  required
                  maxLength={20}
                  className="field-input"
                  autoComplete="new-password"
                />
                <p className={`field-hint ${passwordHintClass}`}>영문 대소문자, 숫자, 특수문자를 모두 포함한 8~20자</p>
              </div>
              <div className="field">
                <input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value.replace(/[^\x21-\x7E]/g, ''))}
                  required
                  maxLength={20}
                  className="field-input"
                  autoComplete="new-password"
                />
                {confirm && (
                  <p className={`field-hint ${password === confirm ? 'ok' : 'fail'}`}>
                    {password === confirm ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                  </p>
                )}
              </div>
              {error && <p className="field-hint fail">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleCert}>
              <p className="auth-desc">아이디를 입력하고, 가입할 때 본인인증한 휴대폰으로 인증해주세요.</p>
              <div className="field">
                <input
                  type="text"
                  placeholder="아이디"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                  required
                  maxLength={20}
                  className="field-input"
                  autoComplete="username"
                />
              </div>
              {error && <p className="field-hint fail">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? '확인 중...' : '휴대폰 본인인증'}
              </button>
            </form>
          )}

          <div className="auth-links">
            <Link href="/login">로그인</Link>
            <Link href="/find-id">아이디 찾기</Link>
            <Link href="/signup">회원가입</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
