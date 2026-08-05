'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type CheckState = 'idle' | 'ok' | 'fail'

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #3a2d66',
  background: '#120b28',
  color: '#eafcff',
  fontSize: 15,
  outline: 'none',
  minWidth: 0,
}

const checkBtnStyle: React.CSSProperties = {
  padding: '0 14px',
  height: 46,
  borderRadius: 8,
  background: '#1c1440',
  color: '#9c97c9',
  fontSize: 13,
  fontWeight: 600,
  border: '1px solid #3a2d66',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

function StatusMsg({ state }: { state: CheckState }) {
  if (state === 'idle') return null
  return (
    <p style={{ margin: '2px 0 0', fontSize: 12, color: state === 'ok' ? '#4ade80' : '#f87171' }}>
      {state === 'ok' ? '사용 가능합니다.' : '이미 사용 중입니다.'}
    </p>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nickname: '', userId: '', password: '', confirm: '', email: '', phone: '' })
  const [checks, setChecks] = useState<{ nickname: CheckState; userId: CheckState; email: CheckState }>({
    nickname: 'idle', userId: 'idle', email: 'idle',
  })
  const [phoneCertified, setPhoneCertified] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name in checks) setChecks(prev => ({ ...prev, [name]: 'idle' }))
    if (name === 'phone') setPhoneCertified(false)
  }

  function handleCheck(field: keyof typeof checks) {
    setChecks(prev => ({ ...prev, [field]: 'ok' }))
  }

  function handlePhoneCert() {
    setPhoneCertified(true)
    alert('본인인증이 완료되었습니다.')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { alert('비밀번호가 일치하지 않습니다.'); return }
    if (checks.nickname !== 'ok' || checks.userId !== 'ok' || checks.email !== 'ok') {
      alert('닉네임, 아이디, 이메일 중복확인을 완료해주세요.'); return
    }
    if (!phoneCertified) { alert('핸드폰 본인인증을 완료해주세요.'); return }
    router.push('/login')
  }

  return (
    <div className="home-neon" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 460, padding: '40px 32px', background: 'linear-gradient(160deg, #150f2ee6, #0d0820e6)', border: '1px solid #7b5cff55', borderRadius: 16, boxShadow: '0 0 40px -8px #ff2fd04d' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 28, fontSize: 24, fontWeight: 700, color: '#eafcff' }}>회원가입</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 닉네임 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input name="nickname" type="text" placeholder="닉네임" value={form.nickname} onChange={handleChange} required style={inputStyle} />
              <button type="button" style={checkBtnStyle} onClick={() => handleCheck('nickname')}>중복확인</button>
            </div>
            <StatusMsg state={checks.nickname} />
          </div>

          {/* 아이디 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input name="userId" type="text" placeholder="아이디" value={form.userId} onChange={handleChange} required style={inputStyle} />
              <button type="button" style={checkBtnStyle} onClick={() => handleCheck('userId')}>중복확인</button>
            </div>
            <StatusMsg state={checks.userId} />
          </div>

          {/* 비밀번호 */}
          <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} required style={inputStyle} />

          {/* 비밀번호 확인 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input name="confirm" type="password" placeholder="비밀번호 확인" value={form.confirm} onChange={handleChange} required style={inputStyle} />
            {form.confirm && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: form.password === form.confirm ? '#4ade80' : '#f87171' }}>
                {form.password === form.confirm ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
              </p>
            )}
          </div>

          {/* 이메일 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input name="email" type="email" placeholder="이메일" value={form.email} onChange={handleChange} required style={inputStyle} />
              <button type="button" style={checkBtnStyle} onClick={() => handleCheck('email')}>중복확인</button>
            </div>
            <StatusMsg state={checks.email} />
          </div>

          {/* 핸드폰 번호 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input name="phone" type="tel" placeholder="핸드폰 번호 (- 없이 입력)" value={form.phone} onChange={handleChange} required style={inputStyle} />
              <button type="button" style={checkBtnStyle} onClick={handlePhoneCert}>본인인증</button>
            </div>
            {phoneCertified && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#4ade80' }}>본인인증이 완료되었습니다.</p>}
          </div>

          <button
            type="submit"
            style={{ padding: '13px', borderRadius: 8, background: 'linear-gradient(135deg, #7b5cff, #22d3ee)', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 8 }}
          >
            회원가입
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#9c97c9' }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" style={{ color: '#22d3ee', fontWeight: 600, textDecoration: 'none' }}>로그인</Link>
        </p>
      </div>
    </div>
  )
}
