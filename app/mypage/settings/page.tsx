'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckIcon, GearIcon } from '@phosphor-icons/react'
import { clearAuth } from '@/lib/auth'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '20px 22px', marginBottom: 16, boxShadow: 'var(--shadow-sm)',
}

export default function SettingsPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('경호소인')
  const [email, setEmail] = useState('wkcpq103100@gmail.com')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [notif, setNotif] = useState({ deadline: true, win: true, marketing: false })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/')
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
              <input style={inputStyle} value={nickname} onChange={e => setNickname(e.target.value)} />
            </div>
            <div>
              <div style={labelStyle}>이메일</div>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>비밀번호 변경</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={labelStyle}>현재 비밀번호</div>
              <input style={inputStyle} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="현재 비밀번호" />
            </div>
            <div>
              <div style={labelStyle}>새 비밀번호</div>
              <input style={inputStyle} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="새 비밀번호" />
            </div>
            <div>
              <div style={labelStyle}>새 비밀번호 확인</div>
              <input style={inputStyle} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인" />
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
          style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {saved ? <><CheckIcon size={16} weight="bold" /> 저장되었습니다</> : '저장하기'}
        </button>

        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--danger-tint-border)', background: 'var(--danger-tint)', color: 'var(--danger)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          로그아웃
        </button>
    </div>
  )
}
