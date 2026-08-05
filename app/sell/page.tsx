'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { emoji: '💻', label: '디지털/가전' },
  { emoji: '👕', label: '패션/의류' },
  { emoji: '⚽', label: '스포츠/레저' },
  { emoji: '📚', label: '도서/음반' },
  { emoji: '🪴', label: '인테리어' },
  { emoji: '🎁', label: '기타' },
]

const DURATION_OPTIONS = [
  { value: 3, label: '3일' },
  { value: 5, label: '5일' },
  { value: 7, label: '7일' },
  { value: 14, label: '14일' },
]

interface PhotoItem {
  file: File
  url: string
}

export default function SellPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [totalSlots, setTotalSlots] = useState(50)
  const [durationDays, setDurationDays] = useState(7)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 5 - photos.length
    if (remaining <= 0) return
    const toAdd = files.slice(0, remaining)
    const newPhotos = toAdd.map(file => ({ file, url: URL.createObjectURL(file) }))
    setPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (photos.length === 0) errs.photos = '사진을 1장 이상 추가해주세요'
    if (!title.trim()) errs.title = '제목을 입력해주세요'
    if (!category) errs.category = '카테고리를 선택해주세요'
    if (!price.trim()) errs.price = '가격을 입력해주세요'
    if (!description.trim()) errs.description = '상품 설명을 입력해주세요'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('category', category)
      formData.append('price', price.replace(/[^0-9]/g, ''))
      formData.append('description', description)
      formData.append('totalSlots', String(totalSlots))
      formData.append('durationDays', String(durationDays))
      photos.forEach(p => formData.append('images', p.file))

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/products`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('서버 오류가 발생했습니다')

      showToast('상품이 등록되었습니다! 🎉')
      setTimeout(() => router.push('/'), 1800)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (val: string) => {
    const num = val.replace(/[^0-9]/g, '')
    return num ? Number(num).toLocaleString() : ''
  }

  return (
    <div className="home-neon">
      <div className="sell-container">
        {/* 헤더 */}
        <div className="sell-page-header">
          <Link href="/" className="sell-back">← 돌아가기</Link>
          <div>
            <h1 className="sell-title">상품 판매 등록</h1>
            <p className="sell-subtitle">상품 정보와 응모 설정을 입력하고 판매를 시작하세요</p>
          </div>
        </div>

        <form className="sell-form" onSubmit={handleSubmit} noValidate>
          <div className="sell-two-col">
            {/* 왼쪽 컬럼 */}
            <div className="sell-left">
              {/* 사진 업로드 */}
              <div className="sell-section">
                <div className="sell-section-label">
                  📷 상품 사진
                  <span className="sell-section-hint">최대 5장 · 첫 번째 사진이 대표 이미지</span>
                </div>
                <div className="photo-grid">
                  {photos.map((p, i) => (
                    <div key={i} className="photo-slot filled">
                      <img src={p.url} alt={`상품 사진 ${i + 1}`} />
                      {i === 0 && <span className="photo-main-badge">대표</span>}
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => removePhoto(i)}
                        aria-label="사진 삭제"
                      >×</button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      type="button"
                      className="photo-slot add"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="photo-add-icon">+</span>
                      <span className="photo-add-text">
                        {photos.length === 0 ? '사진 추가' : `${photos.length}/5`}
                      </span>
                    </button>
                  )}
                  {/* 빈 슬롯 placeholder */}
                  {Array.from({ length: Math.max(0, 4 - photos.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="photo-slot empty" />
                  ))}
                </div>
                {errors.photos && <p className="sell-error">{errors.photos}</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {/* 제목 */}
              <div className="sell-section">
                <label className="sell-section-label" htmlFor="sell-title">제목</label>
                <input
                  id="sell-title"
                  className={`sell-input ${errors.title ? 'error' : ''}`}
                  type="text"
                  placeholder="상품명을 입력해주세요 (예: 아이폰 14 Pro 256GB)"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })) }}
                  maxLength={60}
                />
                <div className="sell-input-foot">
                  {errors.title ? <p className="sell-error">{errors.title}</p> : <span />}
                  <span className="sell-char-count">{title.length}/60</span>
                </div>
              </div>

              {/* 카테고리 */}
              <div className="sell-section">
                <div className="sell-section-label">카테고리</div>
                <div className="category-grid">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.label}
                      type="button"
                      className={`cat-chip ${category === cat.label ? 'active' : ''}`}
                      onClick={() => { setCategory(cat.label); setErrors(p => ({ ...p, category: '' })) }}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="sell-error">{errors.category}</p>}
              </div>

              {/* 가격 */}
              <div className="sell-section">
                <label className="sell-section-label" htmlFor="sell-price">판매 희망 가격</label>
                <div className="sell-input-wrap">
                  <input
                    id="sell-price"
                    className={`sell-input has-suffix ${errors.price ? 'error' : ''}`}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={price}
                    onChange={e => {
                      setPrice(formatPrice(e.target.value))
                      setErrors(p => ({ ...p, price: '' }))
                    }}
                  />
                  <span className="sell-input-suffix">원</span>
                </div>
                {errors.price && <p className="sell-error">{errors.price}</p>}
                <p className="sell-field-hint">응모권 1장당 1,000원이며, 최종 낙찰 금액은 이 가격으로 결정됩니다</p>
              </div>

              {/* 상품 설명 */}
              <div className="sell-section">
                <label className="sell-section-label" htmlFor="sell-desc">상품 설명</label>
                <textarea
                  id="sell-desc"
                  className={`sell-textarea ${errors.description ? 'error' : ''}`}
                  placeholder="상품 상태, 구매 시기, 하자 여부 등을 자세히 설명해주세요"
                  value={description}
                  onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })) }}
                  maxLength={1000}
                  rows={6}
                />
                <div className="sell-input-foot">
                  {errors.description ? <p className="sell-error">{errors.description}</p> : <span />}
                  <span className="sell-char-count">{description.length}/1000</span>
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼 */}
            <div className="sell-right">
              {/* 응모 설정 */}
              <div className="sell-panel">
                <div className="sell-panel-title">🎟 응모 설정</div>

                <div className="sell-section">
                  <div className="sell-section-label">
                    최대 응모 인원
                    <span className="sell-section-hint">많을수록 참여자 모집이 쉬워요</span>
                  </div>
                  <div className="slot-selector">
                    {[30, 50, 100, 200].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`slot-chip ${totalSlots === n ? 'active' : ''}`}
                        onClick={() => setTotalSlots(n)}
                      >
                        {n}명
                      </button>
                    ))}
                  </div>
                  <div className="sell-input-wrap" style={{ marginTop: '10px' }}>
                    <input
                      className="sell-input"
                      type="number"
                      min={10}
                      max={500}
                      value={totalSlots}
                      onChange={e => setTotalSlots(Number(e.target.value))}
                    />
                    <span className="sell-input-suffix">명</span>
                  </div>
                </div>

                <div className="sell-section">
                  <div className="sell-section-label">응모 기간</div>
                  <div className="slot-selector">
                    {DURATION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`slot-chip ${durationDays === opt.value ? 'active' : ''}`}
                        onClick={() => setDurationDays(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 수익 계산 미리보기 */}
                <div className="revenue-preview">
                  <div className="revenue-title">💰 예상 수익 미리보기</div>
                  <div className="revenue-row">
                    <span>응모권 단가</span><span>1,000원</span>
                  </div>
                  <div className="revenue-row">
                    <span>최대 응모 인원</span><span>{totalSlots}명</span>
                  </div>
                  <div className="revenue-divider" />
                  <div className="revenue-row total">
                    <span>최대 예상 수익</span>
                    <span>{(totalSlots * 1000).toLocaleString()}원</span>
                  </div>
                  <div className="revenue-note">
                    플랫폼 수수료 10% 제외 시 최대{' '}
                    <strong>{(totalSlots * 1000 * 0.9).toLocaleString()}원</strong>
                  </div>
                </div>
              </div>

              {/* 주의사항 */}
              <div className="sell-notice">
                <div className="sell-notice-title">📋 판매 주의사항</div>
                <ul className="sell-notice-list">
                  <li>허위 상품 등록 시 계정이 제한될 수 있습니다</li>
                  <li>응모 종료 후 당첨자에게 연락해 거래를 진행해주세요</li>
                  <li>직거래 또는 택배 거래 모두 가능합니다</li>
                  <li>등록 후 24시간 이내에는 수정이 가능합니다</li>
                </ul>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                className={`sell-submit ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" />
                    등록 중...
                  </>
                ) : (
                  '＋ 판매 등록하기'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className={`sell-toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}
    </div>
  )
}
