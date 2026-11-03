'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon, GiftIcon, ShareNetworkIcon } from '@phosphor-icons/react'
import { ApiError, getMyReferral, registerReferral, type ReferralSummaryResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '20px 22px', marginBottom: 16, boxShadow: 'var(--shadow-sm)',
}

// 마이페이지 설정 — 내 추천인 코드(복사·추천 링크 공유)와 추천인 등록
// 추천인을 등록한 사람이 첫 응모권을 사면 본인은 '첫 구매 선물', 추천인은 '추천 응모권'을 1장씩 보관함에 받는다
export default function ReferralCard() {
  const [info, setInfo] = useState<ReferralSummaryResponse | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    getValidSession().then(session => {
      if (!session) return
      getMyReferral(session.token).then(setInfo).catch(() => {})
    })
  }, [])

  const copy = (what: 'code' | 'link') => {
    if (!info) return
    const text = what === 'code' ? info.referral_code : `${window.location.origin}/signup?ref=${info.referral_code}`
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }

  const register = async () => {
    if (!code.trim() || busy) return
    const session = await getValidSession()
    if (!session) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await registerReferral(session.token, code.trim())
      setInfo(res)
      setMessage({ ok: true, text: `${res.referred_by_nickname}님을 추천인으로 등록했어요. 첫 응모권을 사면 무료 응모권 1장을 드려요!` })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : '추천인을 등록하지 못했어요.' })
    } finally {
      setBusy(false)
    }
  }

  if (!info) return null

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        <GiftIcon size={17} weight="fill" color="var(--accent)" /> 친구 추천
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
        친구가 내 코드를 등록하고 첫 응모권을 사면, 친구는 <b>첫 구매 선물 응모권</b>, 나는 <b>추천 응모권</b>을 1장씩 보관함에 받아요.
      </p>

      <div className="referral-code-box">
        <div>
          <div className="referral-code-label">내 추천인 코드</div>
          <div className="referral-code">{info.referral_code}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="entry-cancel-btn" onClick={() => copy('code')}>
            {copied === 'code' ? <CheckIcon size={12} weight="bold" /> : <CopyIcon size={12} />} {copied === 'code' ? '복사됨' : '코드 복사'}
          </button>
          <button type="button" className="entry-cancel-btn" onClick={() => copy('link')}>
            {copied === 'link' ? <CheckIcon size={12} weight="bold" /> : <ShareNetworkIcon size={12} />} {copied === 'link' ? '복사됨' : '링크 복사'}
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '8px 0 18px' }}>
        내 코드로 가입한 친구 {info.invited_count}명 · 받은 추천 응모권 {info.rewarded_count}장
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>나를 추천한 사람</div>
      {info.referred_by_nickname ? (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <b style={{ color: 'var(--text)' }}>{info.referred_by_nickname}</b>님을 추천인으로 등록했어요.
        </div>
      ) : info.can_register ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') register() }}
            placeholder="추천인 코드 입력"
            maxLength={12}
            style={{
              flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 8, border: '1px solid var(--border-strong)',
              background: 'var(--surface)', color: 'var(--text)', fontSize: 14, outline: 'none', letterSpacing: 1,
            }}
          />
          <button
            type="button"
            onClick={register}
            disabled={busy || !code.trim()}
            style={{
              padding: '0 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
              background: code.trim() ? 'var(--accent)' : 'var(--border-strong)', color: code.trim() ? '#fff' : 'var(--text-tertiary)',
              cursor: code.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {busy ? '등록 중...' : '등록'}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>추천인은 첫 응모권을 사기 전에만 등록할 수 있어요.</div>
      )}
      {message && (
        <div style={{ fontSize: 12, marginTop: 8, color: message.ok ? 'var(--success)' : 'var(--danger)' }}>{message.text}</div>
      )}
    </div>
  )
}
