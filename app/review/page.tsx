'use client'

import { useState } from 'react'
import {
  CaretDownIcon,
  ChatCircleIcon,
  LockIcon,
  QuestionIcon,
  StarIcon,
  XIcon,
} from '@phosphor-icons/react'

type ReviewTab = '후기' | '문의'

interface Review {
  id: number
  product: string
  type: string
  user: string
  rating: number
  content: string
  date: string
}

interface Inquiry {
  id: number
  title: string
  user: string
  content: string
  date: string
  status: '답변완료' | '답변대기'
  answer?: string
  private?: boolean
}

const REVIEWS: Review[] = [
  { id: 1, product: '주술회전 나오야 젠인 쿠지', type: '쿠지', user: 'user_2847', rating: 5, content: '배송도 빠르고 상품 상태도 완벽했어요! 나오야 피규어 퀄리티가 정말 기대 이상입니다. 다음에도 또 이용할게요 :)', date: '2026-08-05' },
  { id: 2, product: '아이폰 14 Pro 256GB 스페이스 블랙', type: '응모', user: 'user_1023', rating: 5, content: '응모 당첨되고 너무 기뻤어요!! 진짜로 올 줄 몰랐는데 아이폰이 집에 왔을 때 소리질렀습니다 ㅋㅋ 천운 사랑해요', date: '2026-08-04' },
  { id: 3, product: 'PS5 듀얼센스 무선 컨트롤러', type: '상점', user: 'user_3391', rating: 4, content: '상품 자체는 만족스러운데 포장이 살짝 아쉬웠어요. 그래도 물건은 이상 없고 잘 작동합니다.', date: '2026-08-03' },
  { id: 4, product: '원피스 A상 루피 쿠지', type: '쿠지', user: 'user_0584', rating: 5, content: 'A상 뽑았습니다!! 쿠지판 실시간으로 보면서 두근두근했는데 진짜 재밌었어요. 퀄리티도 최고', date: '2026-08-02' },
  { id: 5, product: '캐릭터 굿즈 스티커 세트', type: '상점', user: 'user_2210', rating: 4, content: '가격 대비 너무 만족해요! 스티커 종류가 다양하고 인쇄 품질도 좋습니다. 재구매 의사 있어요.', date: '2026-08-01' },
  { id: 6, product: '에어팟 프로 2세대', type: '응모', user: 'user_1748', rating: 5, content: '낙첨됐는데도 쌀포인트 바로 환급되서 기분이 덜 나쁘더라고요. 시스템이 투명하고 신뢰가 가요. 다음엔 꼭 당첨되고 싶어요!', date: '2026-07-31' },
  { id: 7, product: '귀멸의 칼날 최애의 쿠지', type: '쿠지', user: 'user_3902', rating: 3, content: '원하는 상이 안 나와서 조금 아쉽긴 한데 그건 운의 영역이니까요. 플랫폼 자체는 잘 되어있어요.', date: '2026-07-30' },
]

const INQUIRIES: Inquiry[] = [
  {
    id: 1, title: '응모 당첨 후 상품 수령은 어떻게 하나요?', user: 'user_4412', date: '2026-08-05',
    content: '응모에 당첨됐는데 보관함에서 확인하면 된다고 하던데 보관함이 어디 있는지 모르겠어요. 마이페이지에 있나요?',
    status: '답변완료',
    answer: '안녕하세요! 마이페이지 > 보관함 메뉴에서 확인하실 수 있습니다. 당첨 후 3일 이내에 배송 주소를 등록해주세요. 추가 문의사항이 있으시면 언제든지 남겨주세요 😊',
  },
  {
    id: 2, title: '운포인트 환급 시 수수료가 있나요?', user: 'user_3317', date: '2026-08-04',
    content: '충전한 운포인트를 다시 현금으로 바꾸고 싶은데 수수료나 최소 금액 같은 게 있는지 궁금합니다.',
    status: '답변완료',
    answer: '현재 운포인트 환급 수수료는 없으며, 최소 환급 금액은 5,000 운포인트입니다. 환급 신청은 마이페이지 > 포인트 내역 > 환급 신청에서 가능합니다.',
  },
  {
    id: 3, title: '쿠지 라스트원 상 조기 마감 기준이 궁금해요', user: 'user_1902', date: '2026-08-04',
    content: '가이드 페이지에서 라스트 원 상만 남으면 조기 마감될 수 있다고 했는데, 언제 마감되는지 기준이 있나요?',
    status: '답변대기',
  },
  {
    id: 4, title: '응모 제한 시간 초과 시 환급이 얼마나 걸리나요?', user: 'user_0773', date: '2026-08-03',
    content: '응모가 시간 초과로 사라졌을 때 구매한 응모권이 운포인트로 자동 환급된다고 했는데 보통 얼마나 걸리나요?',
    status: '답변완료',
    answer: '응모 종료 즉시 자동으로 환급 처리됩니다. 보통 수 분 이내에 포인트가 반영되며, 최대 10분까지 소요될 수 있습니다.',
  },
  {
    id: 5, title: '같은 응모에 여러 장 구매 가능한가요?', user: 'user_2984', date: '2026-08-02',
    content: '응모권을 한 응모에 여러 장 살 수 있다고 하던데 최대 몇 장까지 가능한가요? 제한이 있는지 궁금합니다.',
    status: '답변대기',
  },
  {
    id: 6, title: '비공개 문의드립니다', user: 'user_1188', date: '2026-08-06',
    content: '개인 계정 관련하여 따로 문의드리고 싶습니다.',
    status: '답변대기',
    private: true,
  },
]

const TYPE_CLASS: Record<string, string> = { '응모': 'eungmo', '쿠지': 'kuji', '상점': 'shop' }

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function ReviewPage() {
  const [tab, setTab] = useState<ReviewTab>('후기')
  const [openId, setOpenId] = useState<number | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ title: '', content: '', rating: 5, imgPreview: '' })
  const [inquiryForm, setInquiryForm] = useState({ title: '', content: '', isPrivate: false })

  function handleImgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setReviewForm(f => ({ ...f, imgPreview: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  function closeModal() {
    setShowModal(false)
    setReviewForm({ title: '', content: '', rating: 5, imgPreview: '' })
    setInquiryForm({ title: '', content: '', isPrivate: false })
  }

  return (
    <div>
      <div className="home-container" style={{ maxWidth: 800 }}>

        {/* 타이틀 */}
        <div className="section-title" style={{ marginBottom: 14 }}>
          <ChatCircleIcon size={18} weight="fill" color="var(--accent)" /> 후기/문의
        </div>

        {/* 액션 버튼(왼쪽) + 탭(오른쪽) */}
        <div className="review-toolbar">
          <button className="review-write-btn" onClick={() => setShowModal(true)}>
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
        {tab === '후기' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {REVIEWS.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-card-head">
                  <div className={`review-type-badge ${TYPE_CLASS[r.type]}`}>{r.type}</div>
                  <div className="review-product">{r.product}</div>
                  <Stars rating={r.rating} />
                </div>
                <p className="review-content">{r.content}</p>
                <div className="review-meta">
                  <span>{r.user}</span>
                  <span>{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 문의 탭 */}
        {tab === '문의' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INQUIRIES.map(q => {
              const isOpen = openId === q.id
              return (
                <div key={q.id} className={`inquiry-card${isOpen ? ' open' : ''}`}>
                  {/* 헤더 */}
                  <button className="inquiry-head" onClick={() => setOpenId(isOpen ? null : q.id)}>
                    <div className={`status-badge ${q.status === '답변완료' ? 'win' : 'waiting'}`}>{q.status}</div>
                    <div className="inquiry-title">
                      {q.private && <LockIcon size={13} />}
                      {q.title}
                    </div>
                    <div className="inquiry-meta">
                      <span>{q.user}</span>
                      <span>{q.date}</span>
                    </div>
                    <span className={`inquiry-caret${isOpen ? ' open' : ''}`}><CaretDownIcon size={16} /></span>
                  </button>

                  {/* 펼쳐지는 내용 */}
                  {isOpen && (
                    <div className="inquiry-body">
                      <div className="inquiry-question-box">
                        <div className="inquiry-box-label"><QuestionIcon size={13} /> 문의 내용</div>
                        {q.private
                          ? <p className="inquiry-box-text" style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}><LockIcon size={13} /> 비공개 문의입니다.</p>
                          : <p className="inquiry-box-text">{q.content}</p>
                        }
                      </div>
                      {q.answer && (
                        <div className="inquiry-answer-box">
                          <div className="inquiry-box-label"><ChatCircleIcon size={13} weight="fill" /> 답변</div>
                          <p className="inquiry-box-text">{q.answer}</p>
                        </div>
                      )}
                      {!q.answer && (
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
            {tab === '후기' && (
              <div className="review-modal-form">
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
                    <input type="file" accept="image/*" onChange={handleImgChange} style={{ display: 'none' }} />
                  </label>
                  {reviewForm.imgPreview && (
                    <img src={reviewForm.imgPreview} alt="미리보기" className="review-file-preview" />
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

            {/* 제출 버튼 */}
            <div className="review-modal-actions">
              <button className="review-modal-submit" onClick={closeModal}>
                {tab === '후기' ? '후기 올리기' : '문의 제출'}
              </button>
              <button className="review-modal-cancel" onClick={closeModal}>취소</button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
