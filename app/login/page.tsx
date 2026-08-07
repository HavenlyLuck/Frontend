'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, ApiError } from '@/lib/api'

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ login_id: form.userId, password: form.password })
      localStorage.setItem('token', res.access_token)
      localStorage.setItem('userId', form.userId)
      router.push('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-neon" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '40px 32px', background: 'linear-gradient(160deg, #150f2ee6, #0d0820e6)', border: '1px solid #7b5cff55', borderRadius: 16, boxShadow: '0 0 40px -8px #ff2fd04d' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 28, fontSize: 24, fontWeight: 700, color: '#eafcff' }}>로그인</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input name="userId" type="text" placeholder="아이디" value={form.userId} onChange={handleChange} required style={inputStyle} />
          <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} required style={inputStyle} />
          {error && <p style={{ margin: 0, fontSize: 13, color: '#f87171' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '13px', borderRadius: 8, background: 'linear-gradient(135deg, #7b5cff, #22d3ee)', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: loading ? 'default' : 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '로그인 중...' : '로그인'}
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
