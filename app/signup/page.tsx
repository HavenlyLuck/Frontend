'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup, checkDuplicate, verifyIdentity, ApiError, DuplCheckField } from '@/lib/api'
import {
  requestIdentityVerification,
  readIdentityVerificationRedirect,
  IdentityVerificationResult,
} from '@/lib/identityVerification'

type CheckState = 'idle' | 'checking' | 'ok' | 'fail'

const DUPL_CHECK_FIELDS: Record<'nickname' | 'userId' | 'email', DuplCheckField> = {
  nickname: 'nickname',
  userId: 'login_id',
  email: 'email',
}

// 모바일 본인인증은 페이지를 떠났다가 돌아오므로, 입력하던 값(비밀번호 제외)을 잠시 보관한다
const SIGNUP_DRAFT_KEY = 'signup-draft'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,20}$/

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

function StatusMsg({ state, message }: { state: CheckState; message: string }) {
  if (state === 'idle' || state === 'checking') return null
  return <p className={`field-hint ${state === 'ok' ? 'ok' : 'fail'}`}>{message}</p>
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nickname: '', userId: '', password: '', confirm: '', email: '' })
  const [checks, setChecks] = useState<{ nickname: CheckState; userId: CheckState; email: CheckState }>({
    nickname: 'idle', userId: 'idle', email: 'idle',
  })
  const [checkMessages, setCheckMessages] = useState({ nickname: '', userId: '', email: '' })
  // 본인인증: 포트원 인증 ID와 서버가 확인해 준 휴대폰 번호
  const [identity, setIdentity] = useState<{ id: string; phone: string; name: string | null } | null>(null)
  const [certifying, setCertifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name in checks) {
      setChecks(prev => ({ ...prev, [name]: 'idle' }))
      setCheckMessages(prev => ({ ...prev, [name]: '' }))
    }
  }

  // 모바일 본인인증 후 돌아온 경우: 보관해 둔 입력값을 복원하고 결과를 처리한다
  useEffect(() => {
    const result = readIdentityVerificationRedirect(window.location.search)
    if (!result) return
    window.history.replaceState(null, '', window.location.pathname)
    try {
      const draft = JSON.parse(sessionStorage.getItem(SIGNUP_DRAFT_KEY) ?? 'null')
      if (draft) {
        setForm(prev => ({ ...prev, ...draft.form }))
        setChecks(draft.checks)
        setCheckMessages(draft.checkMessages)
      }
      sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
    } catch {}
    handleCertResult(result)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCertResult(result: IdentityVerificationResult) {
    if (!result.ok) {
      alert(result.message)
      return
    }
    setCertifying(true)
    try {
      const res = await verifyIdentity(result.identityVerificationId)
      setIdentity({ id: result.identityVerificationId, phone: res.phone, name: res.name })
    } catch (err) {
      setIdentity(null)
      alert(err instanceof ApiError ? err.message : '본인인증 확인 중 오류가 발생했습니다.')
    } finally {
      setCertifying(false)
    }
  }

  async function handlePhoneCert() {
    try {
      sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify({
        form: { nickname: form.nickname, userId: form.userId, email: form.email },
        checks,
        checkMessages,
      }))
    } catch {}
    setCertifying(true)
    try {
      const result = await requestIdentityVerification(`${window.location.origin}/signup`)
      sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
      await handleCertResult(result)
    } catch {
      alert('본인인증 창을 열지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setCertifying(false)
    }
  }

  async function handleCheck(field: keyof typeof checks) {
    const value = form[field]
    if (!value.trim()) {
      alert('값을 입력한 뒤 중복확인을 눌러주세요.')
      return
    }
    if (field === 'email' && !EMAIL_REGEX.test(value)) {
      setChecks(prev => ({ ...prev, email: 'fail' }))
      setCheckMessages(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }))
      return
    }
    setChecks(prev => ({ ...prev, [field]: 'checking' }))
    try {
      const res = await checkDuplicate(DUPL_CHECK_FIELDS[field], value)
      setChecks(prev => ({ ...prev, [field]: res.available ? 'ok' : 'fail' }))
      setCheckMessages(prev => ({ ...prev, [field]: res.message }))
    } catch (err) {
      setChecks(prev => ({ ...prev, [field]: 'idle' }))
      alert(err instanceof ApiError ? err.message : '중복확인 중 오류가 발생했습니다.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!PASSWORD_REGEX.test(form.password)) {
      alert('비밀번호는 영문 대문자, 소문자, 숫자, 특수문자를 모두 포함한 8~20자여야 합니다.')
      return
    }
    if (form.password !== form.confirm) { alert('비밀번호가 일치하지 않습니다.'); return }
    if (checks.nickname !== 'ok' || checks.userId !== 'ok' || checks.email !== 'ok') {
      alert('닉네임, 아이디, 이메일 중복확인을 완료해주세요.'); return
    }
    if (!identity) { alert('핸드폰 본인인증을 완료해주세요.'); return }

    setSubmitting(true)
    try {
      await signup({
        login_id: form.userId,
        nickname: form.nickname,
        email: form.email,
        password: form.password,
        identity_verification_id: identity.id,
      })
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
      router.push('/login')
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '회원가입 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const passwordHintClass = !form.password ? '' : PASSWORD_REGEX.test(form.password) ? 'ok' : 'fail'

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
          <h2 className="auth-title">회원가입</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* 닉네임 */}
            <div className="field">
              <div className="field-row">
                <input
                  id="signup-nickname"
                  name="nickname"
                  type="text"
                  placeholder="닉네임"
                  value={form.nickname}
                  onChange={handleChange}
                  required
                  className="field-input"
                />
                <button type="button" disabled={checks.nickname === 'checking'} className="field-btn" onClick={() => handleCheck('nickname')}>
                  {checks.nickname === 'checking' ? '확인 중...' : '중복확인'}
                </button>
              </div>
              <StatusMsg state={checks.nickname} message={checkMessages.nickname} />
            </div>

            {/* 아이디 */}
            <div className="field">
              <div className="field-row">
                <input
                  id="signup-userId"
                  name="userId"
                  type="text"
                  placeholder="아이디"
                  value={form.userId}
                  onChange={handleChange}
                  required
                  className="field-input"
                  autoComplete="username"
                />
                <button type="button" disabled={checks.userId === 'checking'} className="field-btn" onClick={() => handleCheck('userId')}>
                  {checks.userId === 'checking' ? '확인 중...' : '중복확인'}
                </button>
              </div>
              <StatusMsg state={checks.userId} message={checkMessages.userId} />
            </div>

            {/* 비밀번호 */}
            <div className="field">
              <input
                id="signup-password"
                name="password"
                type="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={handleChange}
                required
                maxLength={20}
                className="field-input"
                autoComplete="new-password"
              />
              <p className={`field-hint ${passwordHintClass}`}>
                영문 대소문자, 숫자, 특수문자를 모두 포함한 8~20자
              </p>
            </div>

            {/* 비밀번호 확인 */}
            <div className="field">
              <input
                id="signup-confirm"
                name="confirm"
                type="password"
                placeholder="비밀번호 확인"
                value={form.confirm}
                onChange={handleChange}
                required
                className="field-input"
                autoComplete="new-password"
              />
              {form.confirm && (
                <p className={`field-hint ${form.password === form.confirm ? 'ok' : 'fail'}`}>
                  {form.password === form.confirm ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                </p>
              )}
            </div>

            {/* 이메일 */}
            <div className="field">
              <div className="field-row">
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="이메일"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="field-input"
                  autoComplete="email"
                />
                <button type="button" disabled={checks.email === 'checking'} className="field-btn" onClick={() => handleCheck('email')}>
                  {checks.email === 'checking' ? '확인 중...' : '중복확인'}
                </button>
              </div>
              <StatusMsg state={checks.email} message={checkMessages.email} />
            </div>

            {/* 핸드폰 번호 */}
            <div className="field">
              <div className="field-row">
                <input
                  id="signup-phone"
                  type="tel"
                  placeholder="핸드폰 번호 (본인인증 시 자동 입력)"
                  value={identity?.phone ?? ''}
                  readOnly
                  className="field-input"
                />
                <button type="button" disabled={certifying} className="field-btn" onClick={handlePhoneCert}>
                  {certifying ? '인증 중...' : identity ? '재인증' : '본인인증'}
                </button>
              </div>
              {identity && (
                <p className="field-hint ok">
                  {identity.name ? `${identity.name}님, ` : ''}본인인증이 완료되었습니다.
                </p>
              )}
            </div>

            <button type="submit" disabled={submitting} className="auth-submit">
              {submitting ? '가입 중...' : '회원가입'}
            </button>
          </form>
          <p className="auth-switch">
            이미 계정이 있으신가요? <Link href="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
