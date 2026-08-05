'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #3a2d66',
  background: '#120b28',
  color: '#eafcff',
  fontSize: 15,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ userId: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem('token', 'dummy-token')
    router.push('/')
  }

  return (
    <div className="home-neon" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '40px 32px', background: 'linear-gradient(160deg, #150f2ee6, #0d0820e6)', border: '1px solid #7b5cff55', borderRadius: 16, boxShadow: '0 0 40px -8px #ff2fd04d' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 28, fontSize: 24, fontWeight: 700, color: '#eafcff' }}>로그인</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input name="userId" type="text" placeholder="아이디" value={form.userId} onChange={handleChange} required style={inputStyle} />
          <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} required style={inputStyle} />
          <button
            type="submit"
            style={{ padding: '13px', borderRadius: 8, background: 'linear-gradient(135deg, #7b5cff, #22d3ee)', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 4 }}
          >
            로그인
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#9c97c9' }}>
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" style={{ color: '#22d3ee', fontWeight: 600, textDecoration: 'none' }}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}
