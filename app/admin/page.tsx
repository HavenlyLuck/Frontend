'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface Product {
  id: number
  title: string
  price: string
  maxCount: number
  category: string
  emoji: string
}

const CATEGORIES = ['💻 디지털/가전', '👕 패션/의류', '⚽ 스포츠/레저', '📚 도서/음반', '🪴 인테리어', '🎁 기타']

export default function AdminPage() {
  const { role, logout } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState({ title: '', price: '', maxCount: 50, category: CATEGORIES[0], emoji: '📦' })

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/')
    }
  }, [role, router])

  if (role !== 'admin') return null

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const newProduct: Product = {
      id: Date.now(),
      title: form.title,
      price: form.price,
      maxCount: form.maxCount,
      category: form.category,
      emoji: form.emoji,
    }
    setProducts(prev => [newProduct, ...prev])
    setForm({ title: '', price: '', maxCount: 50, category: CATEGORIES[0], emoji: '📦' })
  }

  const handleDelete = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h1>🛠 관리자 페이지</h1>
        <button className="nav-btn" onClick={() => { logout(); router.push('/') }}>로그아웃</button>
      </div>

      <div className="admin-body">
        <div className="admin-form-box">
          <h2>상품 등록</h2>
          <form onSubmit={handleAdd} className="admin-form">
            <input
              className="login-input"
              placeholder="상품명"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
            />
            <input
              className="login-input"
              placeholder="응모 금액 (예: 650,000원)"
              value={form.price}
              onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
              required
            />
            <input
              className="login-input"
              placeholder="이모지 (예: 📱)"
              value={form.emoji}
              onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
            />
            <input
              className="login-input"
              type="number"
              placeholder="최대 응모 인원"
              value={form.maxCount}
              onChange={e => setForm(p => ({ ...p, maxCount: Number(e.target.value) }))}
              min={1}
              required
            />
            <select
              className="login-input"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-primary" type="submit">+ 상품 등록</button>
          </form>
        </div>

        <div className="admin-list-box">
          <h2>등록된 상품 ({products.length}개)</h2>
          {products.length === 0 ? (
            <p className="admin-empty">등록된 상품이 없습니다.</p>
          ) : (
            <ul className="admin-product-list">
              {products.map(p => (
                <li key={p.id} className="admin-product-item">
                  <span className="admin-product-emoji">{p.emoji}</span>
                  <div className="admin-product-info">
                    <div className="admin-product-title">{p.title}</div>
                    <div className="admin-product-meta">{p.price} · 최대 {p.maxCount}명 · {p.category}</div>
                  </div>
                  <button className="admin-delete-btn" onClick={() => handleDelete(p.id)}>삭제</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
