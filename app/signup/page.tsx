'use client'

import { trackPixel } from '@/lib/metaPixel'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { ConfettiIcon, InfoIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { storedReferralCode } from '@/lib/referralLink'
import { Logo } from '@/components/LogoMark'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getValidSession, loginPath, safeNextPath, SIGNUP_NEXT_KEY } from '@/lib/auth'
import { signup, checkDuplicate, verifyIdentity, verifyGuardian, ApiError, DuplCheckField } from '@/lib/api'
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
// 본인인증하러 간 사이 보관한 입력값(비밀번호 포함)을 믿고 쓰는 시간
const DRAFT_TTL_MS = 30 * 60 * 1000

const USER_ID_REGEX = /^[A-Za-z0-9]{5,20}$/
const EMAIL_REGEX =/^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,20}$/

interface Identity {
  id: string
  phone: string
  name: string | null
  guardianRequired: boolean
}

function StatusMsg({ state, message }: { state: CheckState; message: string }) {
  if (state === 'idle' || state === 'checking') return null
  return <p className={`field-hint ${state === 'ok' ? 'ok' : 'fail'}`}>{message}</p>
}

export default function SignupPage() {
  const router = useRouter()
  // 오픈 이벤트 쌀 응모권을 받았으면 축하 팝업을 띄우고, 확인을 누르면 이 주소(로그인)로 간다
  const [welcomeNext, setWelcomeNext] = useState<string | null>(null)
  useBodyScrollLock(welcomeNext !== null)
  const [form, setForm] = useState({ nickname: '', userId: '', password: '', confirm: '', email: '', referral: '' })

  const [rawChecks, setChecks] = useState<{ nickname: CheckState; userId: CheckState; email: CheckState }>({
    nickname: 'idle', userId: 'idle', email: 'idle',
  })
  const [checkMessages, setCheckMessages] = useState({ nickname: '', userId: '', email: '' })
  // 중복확인을 누른 그 값. 칸의 값이 이것과 같을 때만 확인 결과를 인정한다.
  // (예전엔 칸이 바뀌는 순간 결과를 지웠는데, 본인인증 후 돌아왔을 때 브라우저 자동완성이 같은 값을 다시 채우면서
  //  결과가 지워져 중복확인을 다시 눌러야 했다 — 값 비교로 바꿔서, 실제로 다른 값이 됐을 때만 다시 확인하게 한다)
  const [checkedValues, setCheckedValues] = useState({ nickname: '', userId: '', email: '' })
  const checks = {
    nickname: form.nickname === checkedValues.nickname ? rawChecks.nickname : 'idle',
    userId: form.userId === checkedValues.userId ? rawChecks.userId : 'idle',
    email: form.email === checkedValues.email ? rawChecks.email : 'idle',
  } satisfies typeof rawChecks
  // 본인인증: 포트원 인증 ID와 서버가 확인해 준 휴대폰 번호·이름. 만 19세 미만이면 guardianRequired
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [certifying, setCertifying] = useState(false)
  // 휴대폰 칸을 누르거나 인증 없이 가입하려 할 때 안내를 빨갛게 흔들어 보여준다 (숫자가 바뀔 때마다 애니메이션을 다시 튼다)
  const [phoneNudge, setPhoneNudge] = useState(0)
  const nudgePhone = () => setPhoneNudge(n => n + 1)
  // 만 19세 미만 — 보호자(법정대리인) 본인인증과 보호자 동의
  const [guardian, setGuardian] = useState<{ id: string; name: string | null } | null>(null)
  const [guardianConsent, setGuardianConsent] = useState(false)
  const [guardianCertifying, setGuardianCertifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // 가입 동의 — 약관·만 14세는 필수, 후기 홍보 활용은 선택(안 해도 가입됨)
  const [agree, setAgree] = useState({ terms: false, age14: false, reviewMarketing: false })
  const [showReviewDetail, setShowReviewDetail] = useState(false)
  const allAgreed = agree.terms && agree.age14 && agree.reviewMarketing

  // 가입·로그인 뒤 돌아갈 주소 — "회원가입이 필요해요" 창에서 넘어온 경우(/signup?next=...)
  const [loginHref, setLoginHref] = useState('/login')

  useEffect(() => {
    // 이미 로그인한 채로 들어오면 가입할 일이 없으니 메인으로 보낸다
    getValidSession().then((session) => {
      if (session) router.replace('/')
    })
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

    // 추천 링크(/signup?ref=코드)나 친구 초대 링크(상품 페이지?ref=코드)로 들어왔으면 추천인 코드를 미리 채워 둔다
    const ref = new URLSearchParams(window.location.search).get('ref') ?? storedReferralCode()
    if (ref) setForm(prev => ({ ...prev, referral: ref.toUpperCase() }))

    // 모바일 본인인증 후 돌아온 경우: 보관해 둔 입력값을 복원하고 결과를 처리한다
    const result = readIdentityVerificationRedirect(window.location.search)
    if (!result) return
    window.history.replaceState(null, '', window.location.pathname)
    // 보호자 본인인증에서 돌아온 경우 draft.pending === 'guardian' (가입자 본인인증 결과도 draft에 있다)
    let pendingGuardianOf: Identity | null = null
    try {
      const draft = JSON.parse(sessionStorage.getItem(SIGNUP_DRAFT_KEY) ?? 'null')
      if (draft && typeof draft.savedAt === 'number' && Date.now() - draft.savedAt <= DRAFT_TTL_MS) {
        setForm(prev => ({ ...prev, ...draft.form }))
        setChecks(draft.checks)
        setCheckMessages(draft.checkMessages)
        setCheckedValues(draft.checkedValues ?? { nickname: draft.form.nickname, userId: draft.form.userId, email: draft.form.email })
        if (draft.agree) setAgree(draft.agree)
        if (draft.guardianConsent) setGuardianConsent(true)
        if (draft.pending === 'guardian' && draft.identity) {
          pendingGuardianOf = draft.identity
          setIdentity(draft.identity)
        }
      }
      sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
    } catch {}
    if (pendingGuardianOf) handleGuardianResult(result, pendingGuardianOf)
    else handleCertResult(result)
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
  }

  async function handleCertResult(result: IdentityVerificationResult) {
    if (!result.ok) {
      alert(result.message)
      return
    }
    setCertifying(true)
    // 본인인증을 다시 하면 보호자 인증도 다시 받는다
    setGuardian(null)
    try {
      const res = await verifyIdentity(result.identityVerificationId)
      setIdentity({ id: result.identityVerificationId, phone: res.phone, name: res.name, guardianRequired: res.guardian_required })
    } catch (err) {
      setIdentity(null)
      alert(err instanceof ApiError ? err.message : '본인인증 확인 중 오류가 발생했습니다.')
    } finally {
      setCertifying(false)
    }
  }

  // 모바일 본인인증은 페이지를 떠나므로 입력값을 보관해 둔다 (이 탭에서만 보이고, 돌아오면 바로 지운다).
  // 비밀번호도 같이 보관해야 돌아왔을 때 다시 입력하지 않는다 — 인증에서 돌아오지 않은 경우를 위해 DRAFT_TTL_MS가 지나면 버린다.
  // 보호자 인증이면 가입자 본인인증 결과도 같이 보관한다 (돌아와서 보호자 확인에 쓴다)
  function saveDraft(pending: 'self' | 'guardian') {
    try {
      sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify({
        savedAt: Date.now(),
        form: {
          nickname: form.nickname, userId: form.userId, email: form.email, referral: form.referral,
          password: form.password, confirm: form.confirm,
        },
        checks: rawChecks,
        checkMessages,
        checkedValues,
        agree,
        guardianConsent,
        pending,
        identity: pending === 'guardian' ? identity : null,
      }))
    } catch {}
  }

  async function handleGuardianResult(result: IdentityVerificationResult, minor: Identity) {
    if (!result.ok) {
      alert(result.message)
      return
    }
    setGuardianCertifying(true)
    try {
      const res = await verifyGuardian(result.identityVerificationId, minor.id)
      setGuardian({ id: result.identityVerificationId, name: res.name })
    } catch (err) {
      setGuardian(null)
      alert(err instanceof ApiError ? err.message : '보호자 본인인증 확인 중 오류가 발생했습니다.')
    } finally {
      setGuardianCertifying(false)
    }
  }

  async function handleGuardianCert() {
    if (!identity) return
    saveDraft('guardian')
    setGuardianCertifying(true)
    try {
      const result = await requestIdentityVerification(`${window.location.origin}/signup`)
      try { sessionStorage.removeItem(SIGNUP_DRAFT_KEY) } catch {}
      await handleGuardianResult(result, identity)
    } catch {
      alert('본인인증 창을 열지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setGuardianCertifying(false)
    }
  }

  async function handlePhoneCert() {
    saveDraft('self')
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
    setCheckedValues(prev => ({ ...prev, [field]: value }))
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
    if (!identity) {
      nudgePhone()
      document.getElementById('signup-phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (identity.guardianRequired && !guardian) { alert('만 19세 미만은 보호자(법정대리인) 본인인증이 필요해요.'); return }
    if (identity.guardianRequired && !guardianConsent) { alert('보호자(법정대리인)의 가입 동의가 필요해요.'); return }
    if (!agree.terms || !agree.age14) { alert('이용약관 동의와 만 14세 이상 확인은 필수예요.'); return }

    setSubmitting(true)
    try {
      const created = await signup({
        login_id: form.userId,
        nickname: form.nickname,
        email: form.email,
        password: form.password,
        identity_verification_id: identity.id,
        referral_code: form.referral.trim() || null,
        guardian_identity_verification_id: identity.guardianRequired ? guardian?.id ?? null : null,
        guardian_consent: identity.guardianRequired && guardianConsent,
        // 동의 기록 — 서버가 동의 여부와 동의 일시를 저장한다
        terms_agreed: true,
        age_14_confirmed: true,
        review_marketing_agreed: agree.reviewMarketing,
      })
      trackPixel('CompleteRegistration')
      // 가입 안내 창에서 넘어왔으면 로그인 뒤 보던 화면으로 돌아가게 주소를 이어 준다
      let next: string | null = null
      try {
        next = sessionStorage.getItem(SIGNUP_NEXT_KEY)
        sessionStorage.removeItem(SIGNUP_NEXT_KEY)
      } catch {}
      const afterSignup = next ? loginPath(next) : '/login'
      if (created.signup_event_ticket) {
        setWelcomeNext(afterSignup)
        return
      }
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
      router.push(afterSignup)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '회원가입 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const passwordHintClass = !form.password ? '' : PASSWORD_REGEX.test(form.password) ? 'ok' : 'fail'

  return (
    <div className="auth-shell">
      {/* 회원가입은 입력칸이 길어 왼쪽 소개 패널 없이 한 칸으로 둔다 */}
      <div className="auth-grid is-single">

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
                  placeholder="아이디"
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
              {/* 규칙은 칸 아래에 — 칸 안에 쓰면 휴대폰에서 글자가 잘렸다 */}
              {checks.userId === 'idle' && <p className="field-hint">영문·숫자 5~20자</p>}
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
                  placeholder={identity ? '휴대폰 번호' : '본인인증 후 자동 입력'}
                  value={identity?.phone ?? ''}
                  readOnly
                  aria-describedby="signup-phone-hint"
                  className={`field-input${identity ? '' : ' is-locked'}${phoneNudge ? ' is-nudged' : ''}`}
                  onClick={() => { if (!identity) nudgePhone() }}
                  onKeyDown={e => { if (!identity && e.key.length === 1) nudgePhone() }}
                />
                <button
                  key={identity ? 'done' : `cert-${phoneNudge}`}
                  type="button"
                  disabled={certifying}
                  className={`field-btn${identity ? '' : ' is-primary'}${phoneNudge && !identity ? ' is-nudged' : ''}`}
                  onClick={handlePhoneCert}
                >
                  {certifying ? '인증 중...' : identity ? '재인증' : '본인인증'}
                </button>
              </div>
              {!identity && (
                <p
                  key={phoneNudge}
                  id="signup-phone-hint"
                  role={phoneNudge ? 'alert' : undefined}
                  className={`field-hint signup-phone-hint${phoneNudge ? ' is-nudged' : ''}`}
                >
                  <InfoIcon size={14} weight="fill" aria-hidden />
                  {phoneNudge
                    ? '휴대폰 번호는 직접 입력하지 않아요. 오른쪽 [본인인증] 버튼을 눌러 주세요.'
                    : '휴대폰 번호는 [본인인증]을 하면 자동으로 입력돼요.'}
                </p>
              )}
              {identity && (
                <p className="field-hint ok">
                  {identity.name ? `${identity.name}님, ` : ''}본인인증이 완료되었습니다.
                </p>
              )}
            </div>

            {/* 만 19세 미만 — 보호자(법정대리인) 본인인증과 동의 */}
            {identity?.guardianRequired && (
              <div className="field signup-guardian">
                <p className="signup-guardian-title">만 19세 미만은 보호자 동의가 필요해요</p>
                <p className="field-hint">
                  부모님 등 법정대리인이 직접 본인인증을 하고 가입에 동의해야 가입할 수 있어요.
                  만 19세 미만은 응모권·쿠지·상점 결제가 한 달에 합계 10만 원까지예요.
                  보호자의 이름·휴대폰 번호는 동의 확인 기록으로만 보관돼요.
                </p>
                <div className="field-row">
                  <input
                    id="signup-guardian"
                    type="text"
                    placeholder="보호자 본인인증"
                    value={guardian ? `${guardian.name ?? '보호자'} (보호자)` : ''}
                    readOnly
                    className="field-input"
                  />
                  <button type="button" disabled={guardianCertifying} className="field-btn" onClick={handleGuardianCert}>
                    {guardianCertifying ? '인증 중...' : guardian ? '재인증' : '보호자 인증'}
                  </button>
                </div>
                {guardian && <p className="field-hint ok">보호자 본인인증이 완료되었습니다.</p>}
                <label className="signup-guardian-consent">
                  <input type="checkbox" checked={guardianConsent} onChange={(e) => setGuardianConsent(e.target.checked)} />
                  <span>
                    <b>(필수)</b> 본인은 {identity.name ? `${identity.name}님` : '위 회원'}의 법정대리인(부모 또는 후견인)으로서 천운 회원가입과
                    서비스 이용(월 결제 한도 10만 원), 이용약관·개인정보 수집·이용에 동의합니다. 법정대리인이 아닌 사람이 대신 동의하거나
                    인증할 수 없으며, 이 경우 계약을 취소할 수 없고 이용이 제한될 수 있음을 확인합니다.
                  </span>
                </label>
              </div>
            )}

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

      {/* 오픈 이벤트 가입 축하 — 쌀 응모권 1장 지급 안내. 확인을 눌러야만 로그인으로 넘어간다 */}
      <div className={`modal-overlay ${welcomeNext ? 'open' : ''}`}>
        {welcomeNext && (
          <div className="modal signup-welcome-modal" role="dialog" aria-modal="true" aria-label="회원가입 축하" style={{ margin: '0 16px' }}>
            <div className="modal-icon celebrate">
              <ConfettiIcon size={28} weight="fill" color="var(--gold)" />
            </div>
            <div className="modal-title">회원가입을 축하합니다!</div>
            <div className="signup-welcome-ticket">
              <span className="signup-welcome-badge">오픈 이벤트</span>
              <strong>쌀 응모권 1장</strong>
              <span>보관함에 지급되었어요</span>
            </div>
            <div className="modal-sub">
              원하는 응모 상품에 결제 없이 응모할 수 있어요.
              <br />
              로그인한 뒤 응모 상품에서 쌀 응모권으로 응모해 보세요.
            </div>
            <div className="modal-btn-row">
              <button className="btn-confirm" onClick={() => router.push(welcomeNext)}>
                로그인하러 가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
