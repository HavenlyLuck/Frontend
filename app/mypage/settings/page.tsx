'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clearAuth } from '@/lib/auth'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1px solid #e2e2e4', background: '#ffffff', color: '#181818',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#181818', marginBottom: 6 }

const card: React.CSSProperties = {
  background: '#ffffff', border: '1px solid #ececec', borderRadius: 14,
  padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
    <div style={{ minHeight: '100vh', background: '#f5f6f7', padding: '48px 16px 80px' }}>
      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/mypage" style={{ color: '#767676', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#181818' }}>⚙️ 설정</h2>
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#181818', marginBottom: 16 }}>프로필 정보</div>
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
          <div style={{ fontSize: 15, fontWeight: 700, color: '#181818', marginBottom: 16 }}>비밀번호 변경</div>
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
                <p style={{ margin: '6px 0 0', fontSize: 12, color: newPw === confirmPw ? '#16a34a' : '#e14d72' }}>
                  {newPw === confirmPw ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#181818', marginBottom: 16 }}>알림 설정</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'deadline' as const, label: '응모 마감 임박 알림' },
              { key: 'win' as const, label: '당첨 알림' },
              { key: 'marketing' as const, label: '이벤트 · 혜택 알림' },
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontSize: 14, color: '#454545' }}>{item.label}</span>
                <input
                  type="checkbox"
                  checked={notif[item.key]}
                  onChange={() => setNotif(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  style={{ width: 18, height: 18, accentColor: '#4fa8e8', cursor: 'pointer' }}
                />
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: '#181818', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}
        >
          {saved ? '저장되었습니다 ✓' : '저장하기'}
        </button>

        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid #fecdd3', background: '#fff0f4', color: '#e14d72', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
