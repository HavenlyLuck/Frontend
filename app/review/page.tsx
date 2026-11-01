'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CaretDownIcon,
  ChatCircleIcon,
  LockIcon,
  QuestionIcon,
  StarIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from '@phosphor-icons/react'
import { ApiError } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { formatKstDate } from '@/lib/date'
import {
  createInquiry, createReview, deleteReview, getInquiries, getReviewableItems, getReviews,
  productBadge,
  type InquiryResponse, type ReviewableItem, type ReviewResponse,
} from '@/lib/reviews'

type ReviewTab = '후기' | '문의'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`별점 ${rating}점`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

const EMPTY_REVIEW = { storageItemId: 0, title: '', content: '', rating: 5, imgPreview: '', imgFile: null as File | null }
const EMPTY_INQUIRY = { title: '', content: '', isPrivate: false }

export default function ReviewPage() {
  const router = useRouter()
  const [tab, setTab] = useState<ReviewTab>('후기')
  const [openId, setOpenId] = useState<number | null>(null)

  const [token, setToken] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[] | null>(null)
  const [inquiries, setInquiries] = useState<InquiryResponse[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [reviewable, setReviewable] = useState<ReviewableItem[] | null>(null)
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW)
  const [inquiryForm, setInquiryForm] = useState(EMPTY_INQUIRY)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // 로그인했으면 토큰을 붙여서 받는다 — 내 비공개 문의 내용과 "내 후기" 삭제 버튼을 보기 위해
  const load = async (t: string | null) => {
    try {
      const [r, q] = await Promise.all([getReviews(t), getInquiries(t)])
      setReviews(r)
      setInquiries(q)
      setLoadError(false)
    } catch {
      setLoadError(true)
      setReviews(prev => prev ?? [])
      setInquiries(prev => prev ?? [])
    }
  }

  useEffect(() => {
    getValidSession().then((session) => {
      const t = session?.token ?? null
      setToken(t)
      load(t)
    })
  }, [])

  function handleImgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setReviewForm(f => ({ ...f, imgPreview: ev.target?.result as string, imgFile: file }))
    reader.readAsDataURL(file)
  }

  async function openModal() {
    const session = await getValidSession()
    if (!session) {
      router.push('/login')
      return
    }
    setToken(session.token)
    setFormError(null)
    setShowModal(true)
    if (tab === '후기') {
      setReviewable(null)
      getReviewableItems(session.token)
        .then((items) => {
          setReviewable(items)
          setReviewForm(f => ({ ...f, storageItemId: items[0]?.storage_item_id ?? 0 }))
        })
        .catch(() => setReviewable([]))
    }
  }

  function closeModal() {
    if (submitting) return
    setShowModal(false)
    setFormError(null)
    setReviewForm(EMPTY_REVIEW)
    setInquiryForm(EMPTY_INQUIRY)
  }

  async function submit() {
    if (!token || submitting) return
    setFormError(null)
    if (tab === '후기') {
      if (!reviewForm.storageItemId) return setFormError('후기를 쓸 상품을 골라주세요.')
      if (!reviewForm.title.trim() || !reviewForm.content.trim()) return setFormError('제목과 내용을 모두 입력해주세요.')
    } else if (!inquiryForm.title.trim() || !inquiryForm.content.trim()) {
      return setFormError('제목과 내용을 모두 입력해주세요.')
    }
    setSubmitting(true)
    try {
      if (tab === '후기') {
        const created = await createReview(token, {
          storage_item_id: reviewForm.storageItemId,
          rating: reviewForm.rating,
          title: reviewForm.title.trim(),
          content: reviewForm.content.trim(),
          image: reviewForm.imgFile,
        })
        setReviews(prev => [created, ...(prev ?? [])])
      } else {
        const created = await createInquiry(token, {
          title: inquiryForm.title.trim(),
          content: inquiryForm.content.trim(),
          is_private: inquiryForm.isPrivate,
        })
        setInquiries(prev => [created, ...(prev ?? [])])
        setOpenId(created.inquiry_id)
      }
      setSubmitting(false)
      setShowModal(false)
      setReviewForm(EMPTY_REVIEW)
      setInquiryForm(EMPTY_INQUIRY)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '올리지 못했어요. 잠시 후 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  async function removeReview(review: ReviewResponse) {
    if (!token || !confirm('이 후기를 지울까요? 지우면 같은 상품에 다시 쓸 수 있어요.')) return
    try {
      await deleteReview(token, review.review_id)
      setReviews(prev => prev?.filter(r => r.review_id !== review.review_id) ?? prev)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '후기를 지우지 못했어요.')
    }
  }

  const selectedItem = reviewable?.find(i => i.storage_item_id === reviewForm.storageItemId)
  const noReviewable = tab === '후기' && reviewable !== null && reviewable.length === 0

  return (
    <div>
      <div className="home-container" style={{ maxWidth: 800 }}>

        {/* 타이틀 */}
        <div className="section-title" style={{ marginBottom: 14 }}>
          <ChatCircleIcon size={18} weight="fill" color="var(--accent)" /> 후기/문의
        </div>

        {/* 액션 버튼(왼쪽) + 탭(오른쪽) */}
        <div className="review-toolbar">
          <button className="review-write-btn" onClick={openModal}>
            {tab === '후기' ? '후기 올리기' : '문의하기'}
          </button>
          <div className="review-tabs">
            {(['후기', '문의'] as ReviewTab[]).map(t => (
              <button
                key={t}
                className={`review-tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === '후기' ? <StarIcon size={14} weight={tab === t ? 'fill' : 'regular'} /> : <QuestionIcon size={14} weight={tab === t ? 'fill' : 'regular'} />}
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 후기 탭 */}
        {loadError && (
          <div className="coming-soon-box" style={{ marginBottom: 14 }}>
            <div className="desc">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
          </div>
        )}

        {tab === '후기' && reviews !== null && (
          reviews.length === 0 ? (
            !loadError && (
              <div className="coming-soon-box">
                <div className="desc">아직 후기가 없어요. 받은 상품의 첫 후기를 남겨주세요!</div>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {reviews.map(r => (
                <div key={r.review_id} className="review-card">
                  <div className="review-card-head">
                    {r.product_type && (() => {
                      const badge = productBadge(r.product_type, r.pay_type)
                      return <div className={`review-type-badge ${badge.className}`}>{badge.label}</div>
                    })()}
                    <div className="review-product">{r.product_name ?? '상품'}</div>
                    <Stars rating={r.rating} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '2px 0 6px' }}>{r.title}</div>
                  <p className="review-content" style={{ whiteSpace: 'pre-line' }}>{r.content}</p>
                  {r.image_url && (
                    <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="review-photo-frame" style={{ marginBottom: 10 }}>
                      <img src={r.image_url} alt="후기 사진" />
                    </a>
                  )}
                  <div className="review-meta">
                    <span>{r.nickname}{r.is_mine && ' (나)'}</span>
                    <span>{formatKstDate(r.created_at)}</span>
                    {r.is_mine && (
                      <button
                        type="button"
                        onClick={() => removeReview(r)}
                        style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3, border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer', padding: 0 }}
                      >
                        <TrashIcon size={12} /> 삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 문의 탭 */}
        {tab === '문의' && inquiries !== null && inquiries.length === 0 && !loadError && (
          <div className="coming-soon-box">
            <div className="desc">아직 문의가 없어요. 궁금한 점을 남겨주세요!</div>
          </div>
        )}

        {tab === '문의' && inquiries !== null && inquiries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {inquiries.map(q => {
              const isOpen = openId === q.inquiry_id
              // 비공개 문의를 남이 보면 서버가 내용을 비워서 보낸다
              const hidden = q.is_private && q.content === null
              return (
                <div key={q.inquiry_id} className={`inquiry-card${isOpen ? ' open' : ''}`}>
                  {/* 헤더 */}
                  <button className="inquiry-head" onClick={() => setOpenId(isOpen ? null : q.inquiry_id)}>
                    <div className={`status-badge ${q.answered ? 'win' : 'waiting'}`}>{q.answered ? '답변완료' : '답변대기'}</div>
                    <div className="inquiry-title">
                      {q.is_private && <LockIcon size={13} />}
                      {q.title}
                    </div>
                    <div className="inquiry-meta">
                      <span>{q.nickname}{q.is_mine && ' (나)'}</span>
                      <span>{formatKstDate(q.created_at)}</span>
                    </div>
                    <span className={`inquiry-caret${isOpen ? ' open' : ''}`}><CaretDownIcon size={16} /></span>
                  </button>

                  {/* 펼쳐지는 내용 */}
                  {isOpen && (
                    <div className="inquiry-body">
                      <div className="inquiry-question-box">
                        <div className="inquiry-box-label"><QuestionIcon size={13} /> 문의 내용</div>
                        {hidden
                          ? <p className="inquiry-box-text" style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}><LockIcon size={13} /> 비공개 문의입니다.</p>
                          : <p className="inquiry-box-text" style={{ whiteSpace: 'pre-line' }}>{q.content}</p>
                        }
                      </div>
                      {q.answer && (
                        <div className="inquiry-answer-box">
                          <div className="inquiry-box-label"><ChatCircleIcon size={13} weight="fill" /> 답변</div>
                          <p className="inquiry-box-text" style={{ whiteSpace: 'pre-line' }}>{q.answer}</p>
                        </div>
                      )}
                      {!q.answered && (
                        <div className="inquiry-pending-note">답변을 준비 중입니다. 조금만 기다려주세요 🙏</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* 모달 */}
      {showModal && (
        <>
          <div className="review-modal-backdrop" onClick={closeModal} />

          <div className="review-modal">
            <div className="review-modal-head">
              <div className="review-modal-title">
                {tab === '후기' ? '후기 올리기' : '문의하기'}
              </div>
              <button className="review-modal-close" onClick={closeModal} aria-label="닫기"><XIcon size={20} /></button>
            </div>

            {/* 후기 폼 */}
            {tab === '후기' && reviewable === null && (
              <div className="review-modal-form" style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
                후기를 쓸 수 있는 상품을 찾는 중...
              </div>
            )}

            {noReviewable && (
              <div className="review-modal-form" style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>후기를 쓸 수 있는 상품이 없어요</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                  응모 당첨·쿠지·상점에서 받은 상품이 보관함에 있어야 후기를 쓸 수 있어요.
                  <br />상품마다 후기는 한 번만 쓸 수 있어요.
                </div>
                <Link href="/mypage/storage" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--accent)' }}>보관함 보러 가기 →</Link>
              </div>
            )}

            {tab === '후기' && reviewable !== null && reviewable.length > 0 && (
              <div className="review-modal-form">
                <div>
                  <div className="field-label">후기 쓸 상품</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selectedItem?.image_url && (
                      <img src={selectedItem.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                    )}
                    <select
                      className="field-input"
                      value={reviewForm.storageItemId}
                      onChange={e => setReviewForm(f => ({ ...f, storageItemId: Number(e.target.value) }))}
                      style={{ cursor: 'pointer' }}
                    >
                      {reviewable.map(i => (
                        <option key={i.storage_item_id} value={i.storage_item_id}>
                          [{productBadge(i.product_type, i.pay_type).label}] {i.product_name} · {formatKstDate(i.created_at)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="field-label">별점</div>
                  <div className="review-star-picker">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={n <= reviewForm.rating ? 'active' : ''}
                        onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="field-label">제목</div>
                  <input
                    id="review-title"
                    className="field-input"
                    placeholder="후기 제목을 입력하세요"
                    value={reviewForm.title}
                    onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="field-label">내용</div>
                  <textarea
                    id="review-content"
                    className="field-textarea"
                    style={{ minHeight: 100 }}
                    placeholder="후기 내용을 작성해주세요"
                    value={reviewForm.content}
                    onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="field-label">사진 (선택)</div>
                  <label className="review-file-label">
                    <div className="review-file-btn">파일 선택</div>
                    <span className="review-file-status">{reviewForm.imgPreview ? '사진이 선택되었습니다' : '선택된 파일 없음'}</span>
                    <input type="file" accept="image/*" onChange={handleImgChange} style={{ display: 'none' }} disabled={submitting} />
                  </label>
                  {reviewForm.imgPreview && (
                    <div className="review-photo-frame review-file-preview">
                      <img src={reviewForm.imgPreview} alt="미리보기" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 문의 폼 */}
            {tab === '문의' && (
              <div className="review-modal-form">
                <div>
                  <div className="field-label">제목</div>
                  <input
                    id="inquiry-title"
                    className="field-input"
                    placeholder="문의 제목을 입력하세요"
                    value={inquiryForm.title}
                    onChange={e => setInquiryForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="field-label">내용</div>
                  <textarea
                    id="inquiry-content"
                    className="field-textarea"
                    style={{ minHeight: 120 }}
                    placeholder="문의 내용을 상세히 작성해주세요"
                    value={inquiryForm.content}
                    onChange={e => setInquiryForm(f => ({ ...f, content: e.target.value }))}
                  />
                </div>
                <label className={`review-private-row${inquiryForm.isPrivate ? ' checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={inquiryForm.isPrivate}
                    onChange={e => setInquiryForm(f => ({ ...f, isPrivate: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <span className="label"><LockIcon size={13} /> 비공개 문의</span>
                  {inquiryForm.isPrivate && <span className="review-private-hint">다른 사용자에게 내용이 공개되지 않습니다</span>}
                </label>
              </div>
            )}

            {formError && (
              <div className="modal-notice" role="alert" style={{ margin: '0 0 12px' }}>
                <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{formError}</span>
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="review-modal-actions">
              {!noReviewable && !(tab === '후기' && reviewable === null) && (
                <button className="review-modal-submit" onClick={submit} disabled={submitting}>
                  {submitting ? '올리는 중...' : tab === '후기' ? '후기 올리기' : '문의 제출'}
                </button>
              )}
              <button className="review-modal-cancel" onClick={closeModal} disabled={submitting}>{noReviewable ? '닫기' : '취소'}</button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
