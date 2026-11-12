'use client'

import { useEffect, useState } from 'react'
import LogoMark, { Logo } from '@/components/LogoMark'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginPath, safeNextPath, SIGNUP_NEXT_KEY } from '@/lib/auth'
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

const USER_ID_REGEX = /^[A-Za-z0-9]{5,20}$/
const EMAIL_REGEX =/^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,20}$/

function StatusMsg({ state, message }: { state: CheckState; message: string }) {
  if (state === 'idle' || state === 'checking') return null
  return <p className={`field-hint ${state === 'ok' ? 'ok' : 'fail'}`}>{message}</p>
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nickname: '', userId: '', password: '', confirm: '', email: '', referral: '' })

  const [checks, setChecks] = useState<{ nickname: CheckState; userId: CheckState; email: CheckState }>({
    nickname: 'idle', userId: 'idle', email: 'idle',
  })
  const [checkMessages, setCheckMessages] = useState({ nickname: '', userId: '', email: '' })
  // 본인인증: 포트원 인증 ID와 서버가 확인해 준 휴대폰 번호·이름
  const [identity, setIdentity] = useState<{ id: string; phone: string; name: string | null } | null>(null)
  const [certifying, setCertifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // 가입 동의 — 약관·만 14세는 필수, 후기 홍보 활용은 선택(안 해도 가입됨)
  const [agree, setAgree] = useState({ terms: false, age14: false, reviewMarketing: false })
  const [showReviewDetail, setShowReviewDetail] = useState(false)
  const allAgreed = agree.terms && agree.age14 && agree.reviewMarketing

  // 가입·로그인 뒤 돌아갈 주소 — "회원가입이 필요해요" 창에서 넘어온 경우(/signup?next=...)
  const [loginHref, setLoginHref] = useState('/login')

  useEffect(() => {
    // 돌아갈 주소를 탭에 보관한다 (모바일 본인인증으로 페이지를 떠났다 와도 남게).
    // next 없이 새로 들어온 가입이면 예전 값이 남아 있지 않게 지운다
    try {
      const qs = new URLSearchParams(window.location.search)
      const next = qs.get('next')
      if (next) sessionStorage.setItem(SIGNUP_NEXT_KEY, safeNextPath(next))
      else if (!qs.get('identityVerificationId')) sessionStorage.removeItem(SIGNUP_NEXT_KEY)
      const saved = sessionStorage.getItem(SIGNUP_NEXT_KEY)
      if (saved) setLoginHref(loginPath(saved))
    } catch {}

    // 추천 링크(/signup?ref=코드)로 들어오면 추천인 코드를 미리 채워 둔다
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) setForm(prev => ({ ...prev, referral: ref.toUpperCase() }))

    // 모바일 본인인증 후 돌아온 경우: 보관해 둔 입력값을 복원하고 결과를 처리한다
    const result = readIdentityVerificationRedirect(window.location.search)
    if (!result) return
    window.history.replaceState(null, '', window.location.pathname)
    try {
      const draft = JSON.parse(sessionStorage.getItem(SIGNUP_DRAFT_KEY) ?? 'null')
      if (draft) {
        setForm(prev => ({ ...prev, ...draft.form }))
        setChecks(draft.checks)
        setCheckMessages(draft.checkMessages)
        if (draft.agree) setAgree(draft.agree)
      }
      sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
    } catch {}
    handleCertResult(result)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name } = e.target
    // 닉네임 외에는 영어만 받는다: 아이디·추천인 코드는 영문+숫자, 비밀번호·이메일은 공백 없는 영문 키보드 문자
    const value =
      name === 'userId' || name === 'referral' ? e.target.value.replace(/[^A-Za-z0-9]/g, '')
      : name === 'password' || name === 'confirm' || name === 'email' ? e.target.value.replace(/[^\x21-\x7E]/g, '')
      : e.target.value
    setForm(prev => ({ ...prev, [name]: value }))
    if (name in checks) {
      setChecks(prev => ({ ...prev, [name]: 'idle' }))
      setCheckMessages(prev => ({ ...prev, [name]: '' }))
    }
  }

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
        form: { nickname: form.nickname, userId: form.userId, email: form.email, referral: form.referral },
        checks,
        checkMessages,
        agree,
      }))
    } catch {}
    setCertifying(true)
    try {
      const result = await requestIdentityVerification(`${window.location.origin}/signup`)
      try { sessionStorage.removeItem(SIGNUP_DRAFT_KEY) } catch {}
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
    if (field === 'userId' && !USER_ID_REGEX.test(value)) {
      setChecks(prev => ({ ...prev, userId: 'fail' }))
      setCheckMessages(prev => ({ ...prev, userId: '아이디는 영문·숫자 5~20자로 입력해주세요.' }))
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
    if (!USER_ID_REGEX.test(form.userId)) {
      alert('아이디는 영문·숫자 5~20자로 입력해주세요.')
      return
    }
    if (!PASSWORD_REGEX.test(form.password)) {
      alert('비밀번호는 영문 대문자, 소문자, 숫자, 특수문자를 모두 포함한 8~20자여야 합니다.')
      return
    }
    if (form.password !== form.confirm) { alert('비밀번호가 일치하지 않습니다.'); return }
    if (checks.nickname !== 'ok' || checks.userId !== 'ok' || checks.email !== 'ok') {
      alert('닉네임, 아이디, 이메일 중복확인을 완료해주세요.'); return
    }
    if (!identity) { alert('핸드폰 본인인증을 완료해주세요.'); return }
    if (!agree.terms || !agree.age14) { alert('이용약관 동의와 만 14세 이상 확인은 필수예요.'); return }

    setSubmitting(true)
    try {
      await signup({
        login_id: form.userId,
        nickname: form.nickname,
        email: form.email,
        password: form.password,
        identity_verification_id: identity.id,
        referral_code: form.referral.trim() || null,
        // 동의 기록 — 서버가 동의 여부와 동의 일시를 저장한다
        terms_agreed: true,
        age_14_confirmed: true,
        review_marketing_agreed: agree.reviewMarketing,
      })
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
      // 가입 안내 창에서 넘어왔으면 로그인 뒤 보던 화면으로 돌아가게 주소를 이어 준다
      let next: string | null = null
      try {
        next = sessionStorage.getItem(SIGNUP_NEXT_KEY)
        sessionStorage.removeItem(SIGNUP_NEXT_KEY)
      } catch {}
      router.push(next ? loginPath(next) : '/login')
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
          <LogoMark className="auth-brand-mark" />
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
            <Logo />
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
                  placeholder="아이디 (영문·숫자 5~20자)"
                  maxLength={20}
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
                  placeholder="휴대폰 번호"
                  value={identity?.phone ?? ''}
                  readOnly
                  className="field-input"
                />
                <button type="button" disabled={certifying} className="field-btn" onClick={handlePhoneCert}>
                  {certifying ? '인증 중...' : identity ? '재인증' : '본인인증'}
                </button>
              </div>
              {!identity && <p className="field-hint">본인인증을 하면 자동으로 입력돼요</p>}
              {identity && (
                <p className="field-hint ok">
                  {identity.name ? `${identity.name}님, ` : ''}본인인증이 완료되었습니다.
                </p>
              )}
            </div>

            {/* 추천인 코드 (선택) */}
            <div className="field">
              <input
                id="signup-referral"
                name="referral"
                type="text"
                placeholder="추천인 코드 (선택)"
                value={form.referral}
                onChange={handleChange}
                className="field-input"
                autoComplete="off"
                maxLength={12}
                style={{ textTransform: 'uppercase' }}
              />
              <p className="field-hint">추천인 코드를 넣고 첫 응모권을 사면, 나와 추천인 모두 쌀 응모권 1장을 받아요.</p>
            </div>

            {/* 가입 동의 */}
            <div className="signup-agree">
              <label className="signup-agree-all">
                <input
                  type="checkbox"
                  checked={allAgreed}
                  onChange={(e) => setAgree({ terms: e.target.checked, age14: e.target.checked, reviewMarketing: e.target.checked })}
                />
                <span>전체 동의 <small>(선택 항목 포함)</small></span>
              </label>
              <div className="signup-agree-list">
                <label>
                  <input type="checkbox" checked={agree.terms} onChange={(e) => setAgree(a => ({ ...a, terms: e.target.checked }))} />
                  <span><b>(필수)</b> 이용약관에 동의합니다</span>
                  <a href="/terms" target="_blank" rel="noopener noreferrer">보기</a>
                </label>
                <label>
                  <input type="checkbox" checked={agree.age14} onChange={(e) => setAgree(a => ({ ...a, age14: e.target.checked }))} />
                  <span><b>(필수)</b> 만 14세 이상입니다</span>
                </label>
                {/* 계약 이행에 필요한 수집이라 동의 체크 없이 안내만 한다 */}
                <div className="signup-agree-info">
                  <span>개인정보 수집·이용 안내</span>
                  <a href="/privacy#collect" target="_blank" rel="noopener noreferrer">보기</a>
                </div>
                <label>
                  <input type="checkbox" checked={agree.reviewMarketing} onChange={(e) => setAgree(a => ({ ...a, reviewMarketing: e.target.checked }))} />
                  <span>(선택) 후기를 천운 SNS·홈페이지 홍보에 활용하는 데 동의합니다</span>
                  <button type="button" className="signup-agree-more" onClick={() => setShowReviewDetail(v => !v)} aria-expanded={showReviewDetail}>
                    {showReviewDetail ? '닫기' : '보기'}
                  </button>
                </label>
                {showReviewDetail && (
                  <div className="signup-agree-detail">
                    <p><b>수집 목적</b> 천운 공식 SNS(인스타그램 등) 및 홈페이지에 이용자 후기를 게시하여 서비스 홍보에 활용</p>
                    <p><b>수집 항목</b> 닉네임, 후기 내용, 후기 사진</p>
                    <p><b>보유·이용 기간</b> 동의 철회 시까지</p>
                    <p>동의하지 않아도 회원가입과 서비스 이용에는 제한이 없어요. 동의한 뒤에도 언제든 철회할 수 있어요.</p>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="auth-submit">
              {submitting ? '가입 중...' : '회원가입'}
            </button>
          </form>
          <p className="auth-switch">
            이미 계정이 있으신가요? <Link href={loginHref}>로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
