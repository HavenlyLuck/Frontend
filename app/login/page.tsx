'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ userId: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: 실제 로그인 API 연동
    localStorage.setItem('token', 'dummy-token')
    router.push('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '40px 32px', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 28, fontSize: 24, fontWeight: 700 }}>로그인</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            name="userId"
            type="text"
            placeholder="아이디"
            value={form.userId}
            onChange={handleChange}
            required
            style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, outline: 'none' }}
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
            required
            style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, outline: 'none' }}
          />
          <button
            type="submit"
            style={{ padding: '13px', borderRadius: 8, background: '#7c6aff', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 4 }}
          >
            로그인
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" style={{ color: '#7c6aff', fontWeight: 600, textDecoration: 'none' }}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}
