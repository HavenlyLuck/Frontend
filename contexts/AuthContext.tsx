'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ADMIN_ID = 'admin'
const ADMIN_PW = 'admin1234'

type Role = 'admin' | 'user' | null

interface Points {
  eung: number  // 운포인트
  ssal: number  // 쌀포인트
}

interface AuthContextType {
  role: Role
  userId: string | null
  points: Points | null
  login: (id: string, pw: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// 나중에 백엔드 API 호출로 교체
const MOCK_POINTS: Points = { eung: 2320, ssal: 23200 }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [points, setPoints] = useState<Points | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('auth')
    if (saved) {
      const { role, userId } = JSON.parse(saved)
      setRole(role)
      setUserId(userId)
      if (role === 'user') setPoints(MOCK_POINTS)
    }
  }, [])

  const login = (id: string, pw: string): boolean => {
    if (id === ADMIN_ID && pw === ADMIN_PW) {
      setRole('admin')
      setUserId(id)
      setPoints(null)
      localStorage.setItem('auth', JSON.stringify({ role: 'admin', userId: id }))
      return true
    }
    if (id && pw) {
      setRole('user')
      setUserId(id)
      setPoints(MOCK_POINTS)
      localStorage.setItem('auth', JSON.stringify({ role: 'user', userId: id }))
      return true
    }
    return false
  }

  const logout = () => {
    setRole(null)
    setUserId(null)
    setPoints(null)
    localStorage.removeItem('auth')
  }

  return (
    <AuthContext.Provider value={{ role, userId, points, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
