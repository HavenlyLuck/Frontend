'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckIcon, GearIcon, LockKeyIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { clearAuth, getValidSession } from '@/lib/auth'
import { ApiError, changeMyPassword, deleteMyAccount, getMyProfile } from '@/lib/api'
import { BIZ_INFO } from '@/components/PolicyDoc'
import ReferralCard from '@/components/ReferralCard'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

// 바꿀 수 없는 칸 — 회색 글자, 클릭·입력 불가
const lockedInputStyle: React.CSSProperties = {
  ...inputStyle, background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', cursor: 'not-allowed',
}

// 회원가입과 같은 규칙 (Frontend/app/signup, Backend PASSWORD_PATTERN)
const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: '8~20자', test: pw => pw.length >= 8 && pw.length <= 20 },
  { label: '영문 대문자', test: pw => /[A-Z]/.test(pw) },
  { label: '영문 소문자', test: pw => /[a-z]/.test(pw) },
  { label: '숫자', test: pw => /\d/.test(pw) },
  { label: '특수문자', test: pw => /[^A-Za-z0-9\s]/.test(pw) },
]

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '20px 22px', marginBottom: 16, boxShadow: 'var(--shadow-sm)',
}

export default function SettingsPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [notif, setNotif] = useState({ deadline: true, win: true, marketing: false })
  const [saving, setSaving] = useState(false)
  // 저장 결과 팝업 — 성공·실패 모두 사이트 공통 모달(.modal-overlay)로 보여준다
  const [popup, setPopup] = useState<{ ok: boolean; title: string; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (!session) return
      getMyProfile(session.token).then((profile) => {
        if (cancelled) return
        setNickname(profile.nickname)
        setEmail(profile.email)
      })
    })
    return () => { cancelled = true }
  }, [])

  const newPwValid = PASSWORD_RULES.every(rule => rule.test(newPw))
  const pwMatches = confirmPw !== '' && newPw === confirmPw
  const canSave = currentPw !== '' && newPwValid && pwMatches && !saving

  const handleSave = async () => {
    if (!canSave) return
    const session = await getValidSession()
    if (!session) {
      setPopup({ ok: false, title: '로그인이 필요해요', message: '로그인이 만료되었어요. 다시 로그인한 뒤 시도해 주세요.' })
      return
    }
    setSaving(true)
    try {
      await changeMyPassword(session.token, currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setPopup({ ok: true, title: '비밀번호가 변경되었습니다', message: '다음 로그인부터 새 비밀번호를 사용해 주세요.' })
    } catch (err) {
      setPopup({
        ok: false,
        title: '비밀번호를 바꾸지 못했어요',
        message: err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/')
  }

  // 회원 탈퇴 팝업
  const [withdraw, setWithdraw] = useState<{ password: string; confirmed: boolean; error: string | null; busy: boolean } | null>(null)
  const handleWithdraw = async () => {
    if (!withdraw || withdraw.busy) return
    const session = await getValidSession()
    if (!session) {
      setWithdraw({ ...withdraw, error: '로그인이 만료되었어요. 다시 로그인한 뒤 시도해 주세요.' })
      return
    }
    setWithdraw({ ...withdraw, busy: true, error: null })
    try {
      await deleteMyAccount(session.token, withdraw.password)
      clearAuth()
      alert('탈퇴가 완료되었어요. 그동안 천운을 이용해 주셔서 감사합니다.')
      router.push('/')
    } catch (err) {
      // 서버에 탈퇴 기능이 아직 없으면 고객센터로 안내한다
      const message = err instanceof ApiError && (err.status === 404 || err.status === 405)
        ? `지금은 화면에서 바로 탈퇴할 수 없어요. 고객센터(${BIZ_INFO.phone} · ${BIZ_INFO.email})로 요청해 주시면 처리해 드릴게요.`
        : err instanceof ApiError ? err.message : '탈퇴 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
      setWithdraw(w => w && { ...w, busy: false, error: message })
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><GearIcon size={17} weight="fill" color="var(--accent)" /> 설정</div>
      </div>

      <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>프로필 정보</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={labelStyle}>닉네임</div>
              <input style={lockedInputStyle} value={nickname} readOnly disabled tabIndex={-1} />
            </div>
            <div>
              <div style={labelStyle}>이메일</div>
              <input style={lockedInputStyle} type="email" value={email} readOnly disabled tabIndex={-1} />
            </div>
          </div>
        </div>

        <ReferralCard />

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>비밀번호 변경</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={labelStyle}>현재 비밀번호</div>
              <input style={inputStyle} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="현재 비밀번호" autoComplete="current-password" />
            </div>
            <div>
              <div style={labelStyle}>새 비밀번호</div>
              <input style={inputStyle} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="새 비밀번호" autoComplete="new-password" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
                {PASSWORD_RULES.map(rule => {
                  const ok = rule.test(newPw)
                  return (
                    <span key={rule.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: ok ? 'var(--success)' : 'var(--text-tertiary)', fontWeight: ok ? 600 : 400 }}>
                      <CheckIcon size={12} weight="bold" style={{ opacity: ok ? 1 : 0.35 }} /> {rule.label}
                    </span>
                  )
                })}
              </div>
            </div>
            <div>
              <div style={labelStyle}>새 비밀번호 확인</div>
              <input style={inputStyle} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인" autoComplete="new-password" />
              {confirmPw && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: newPw === confirmPw ? 'var(--success)' : 'var(--danger)' }}>
                  {newPw === confirmPw ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>알림 설정</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'deadline' as const, label: '응모 마감 임박 알림' },
              { key: 'win' as const, label: '당첨 알림' },
              { key: 'marketing' as const, label: '이벤트 · 혜택 알림' },
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</span>
                <input
                  type="checkbox"
                  checked={notif[item.key]}
                  onChange={() => setNotif(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: canSave ? 'var(--accent)' : 'var(--border-strong)', color: canSave ? '#fff' : 'var(--text-tertiary)', fontSize: 15, fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>

        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--danger-tint-border)', background: 'var(--danger-tint)', color: 'var(--danger)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          로그아웃
        </button>

        {/* 회원 탈퇴 — 가입보다 어렵지 않게, 설정 맨 아래에서 바로 할 수 있게 둔다 (개인정보보호법) */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={() => { setWithdraw({ password: '', confirmed: false, error: null, busy: false }) }}
            style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' }}
          >
            회원 탈퇴
          </button>
        </div>

      <div className={`modal-overlay ${withdraw ? 'open' : ''}`} onClick={() => { if (!withdraw?.busy) setWithdraw(null) }}>
        {withdraw && (
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="withdraw-title" style={{ margin: '0 16px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <div className="modal-icon" style={{ background: 'var(--danger-tint)', borderColor: 'var(--danger-tint-border)', margin: '0 auto 12px' }}>
              <WarningCircleIcon size={28} weight="fill" color="var(--danger)" />
            </div>
            <div id="withdraw-title" className="modal-title" style={{ textAlign: 'center' }}>정말 탈퇴할까요?</div>
            <ul style={{ margin: '12px 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <li>남은 <b>쌀포인트와 쌀 응모권은 모두 사라지고</b> 되돌릴 수 없어요.</li>
              <li>진행 중인 응모나 배송이 있으면, 처리가 끝난 뒤 탈퇴할 수 있어요.</li>
              <li>결제·배송·분쟁 기록처럼 법에서 보관하도록 정한 정보는 정해진 기간 동안 따로 보관한 뒤 지워요.</li>
            </ul>
            <div style={labelStyle}>본인 확인을 위해 비밀번호를 입력해 주세요</div>
            <input
              style={inputStyle}
              type="password"
              value={withdraw.password}
              onChange={e => setWithdraw(w => w && { ...w, password: e.target.value, error: null })}
              placeholder="현재 비밀번호"
              autoComplete="current-password"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={withdraw.confirmed}
                onChange={e => setWithdraw(w => w && { ...w, confirmed: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--danger)' }}
              />
              위 내용을 확인했고 탈퇴에 동의합니다
            </label>
            {withdraw.error && <div className="modal-notice" role="alert" style={{ marginTop: 12 }}>{withdraw.error}</div>}
            <div className="modal-btn-row" style={{ marginTop: 16 }}>
              <button className="btn-cancel" onClick={() => setWithdraw(null)} disabled={withdraw.busy}>취소</button>
              <button
                className="btn-confirm"
                onClick={handleWithdraw}
                disabled={!withdraw.password || !withdraw.confirmed || withdraw.busy}
                style={{ background: 'var(--danger)' }}
              >
                {withdraw.busy ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`modal-overlay ${popup ? 'open' : ''}`} onClick={() => setPopup(null)}>
        {popup && (
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-popup-title" style={{ margin: '0 16px' }} onClick={e => e.stopPropagation()}>
            <div
              className="modal-icon"
              style={popup.ok ? undefined : { background: 'var(--danger-tint)', borderColor: 'var(--danger-tint-border)' }}
            >
              {popup.ok
                ? <LockKeyIcon size={28} weight="fill" color="var(--accent)" />
                : <WarningCircleIcon size={28} weight="fill" color="var(--danger)" />}
            </div>
            <div id="settings-popup-title" className="modal-title">{popup.title}</div>
            <div className="modal-sub">{popup.message}</div>
            <div className="modal-btn-row">
              <button className="btn-confirm" autoFocus onClick={() => setPopup(null)}>확인</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
