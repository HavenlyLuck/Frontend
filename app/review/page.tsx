'use client'

import { useState } from 'react'

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
    content: '설명충 페이지에서 라스트 원 상만 남으면 조기 마감될 수 있다고 했는데, 언제 마감되는지 기준이 있나요?',
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

const TYPE_COLOR: Record<string, string> = { '응모': '#ff2fd0', '쿠지': '#22d3ee', '상점': '#a78bfa' }

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#fbbf24', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

const darkInput: React.CSSProperties = {
  background: '#120b28', border: '1px solid #3a2d66', borderRadius: 8,
  color: '#eafcff', padding: '10px 12px', fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

export default function ReviewPage() {
  const [tab, setTab] = useState<ReviewTab>('후기')
  const [openId, setOpenId] = useState<number | null>(null)

  // 모달 상태
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
    <div className="home-neon">
      <div className="home-container" style={{ maxWidth: 800 }}>

        {/* 타이틀 */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-title">💬 후기/문의</div>
        </div>

        {/* 액션 버튼(왼쪽) + 탭(오른쪽) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #7b5cff, #22d3ee)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {tab === '후기' ? '후기 올리기' : '문의하기'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['후기', '문의'] as ReviewTab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 24px',
                  borderRadius: 10,
                  border: `1px solid ${tab === t ? '#7b5cff99' : '#3a2d66'}`,
                  background: tab === t ? 'linear-gradient(135deg, #7b5cff44, #22d3ee22)' : '#120b28',
                  color: tab === t ? '#eafcff' : '#9c97c9',
                  fontSize: 14,
                  fontWeight: tab === t ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t === '후기' ? '⭐ 후기' : '❓ 문의'}
              </button>
            ))}
          </div>
        </div>

        {/* 후기 탭 */}
        {tab === '후기' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {REVIEWS.map(r => (
              <div key={r.id} style={{ background: 'linear-gradient(160deg, #150f2e, #0d0820)', border: '1px solid #3a2d66', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${TYPE_COLOR[r.type]}18`, color: TYPE_COLOR[r.type], border: `1px solid ${TYPE_COLOR[r.type]}44`, flexShrink: 0 }}>{r.type}</div>
                  <div style={{ color: '#eafcff', fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product}</div>
                  <Stars rating={r.rating} />
                </div>
                <p style={{ color: '#b8b4d8', fontSize: 14, lineHeight: 1.7, margin: '0 0 10px' }}>{r.content}</p>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6d67a0' }}>
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
                <div key={q.id} style={{ background: 'linear-gradient(160deg, #150f2e, #0d0820)', border: `1px solid ${isOpen ? '#7b5cff55' : '#3a2d66'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  {/* 헤더 */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : q.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0, background: q.status === '답변완료' ? '#22d3ee18' : '#ff2fd018', color: q.status === '답변완료' ? '#22d3ee' : '#ff2fd0', border: `1px solid ${q.status === '답변완료' ? '#22d3ee44' : '#ff2fd044'}` }}>{q.status}</div>
                    <div style={{ flex: 1, color: '#eafcff', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {q.private && <span style={{ fontSize: 13 }}>🔒</span>}
                      {q.title}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6d67a0', flexShrink: 0 }}>
                      <span>{q.user}</span>
                      <span>{q.date}</span>
                    </div>
                    <span style={{ color: '#6d67a0', fontSize: 16, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>▾</span>
                  </button>

                  {/* 펼쳐지는 내용 */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #2a1f3d', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: '#0d082088', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ color: '#9c97c9', fontSize: 12, marginBottom: 6 }}>❓ 문의 내용</div>
                        {q.private
                          ? <p style={{ color: '#6d67a0', fontSize: 14, lineHeight: 1.7, margin: 0 }}>🔒 비공개 문의입니다.</p>
                          : <p style={{ color: '#b8b4d8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{q.content}</p>
                        }
                      </div>
                      {q.answer && (
                        <div style={{ background: '#7b5cff0e', border: '1px solid #7b5cff33', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ color: '#c4b5fd', fontSize: 12, marginBottom: 6 }}>💬 답변</div>
                          <p style={{ color: '#eafcff', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{q.answer}</p>
                        </div>
                      )}
                      {!q.answer && (
                        <div style={{ color: '#6d67a0', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>답변을 준비 중입니다. 조금만 기다려주세요 🙏</div>
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
          {/* 백드롭 */}
          <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(7,2,18,0.75)', zIndex: 400, backdropFilter: 'blur(2px)' }} />

          {/* 모달 카드 */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 401, width: '90%', maxWidth: 480,
            background: 'linear-gradient(160deg, #1a1035, #0d0820)',
            border: '1px solid #7b5cff55', borderRadius: 18,
            padding: '28px 28px 24px',
            boxShadow: '0 16px 60px #00000099',
          }}>
            {/* 모달 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div style={{ color: '#eafcff', fontWeight: 700, fontSize: 17 }}>
                {tab === '후기' ? '후기 올리기' : '문의하기'}
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#6d67a0', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* 후기 폼 */}
            {tab === '후기' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 별점 */}
                <div>
                  <div style={{ color: '#9c97c9', fontSize: 12, marginBottom: 8 }}>별점</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                        style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: n <= reviewForm.rating ? '#fbbf24' : '#3a2d66', padding: 0, lineHeight: 1 }}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                {/* 제목 */}
                <div>
                  <div style={{ color: '#9c97c9', fontSize: 12, marginBottom: 6 }}>제목</div>
                  <input style={darkInput} placeholder="후기 제목을 입력하세요" value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                {/* 글 */}
                <div>
                  <div style={{ color: '#9c97c9', fontSize: 12, marginBottom: 6 }}>내용</div>
                  <textarea style={{ ...darkInput, resize: 'vertical', minHeight: 100 }} placeholder="후기 내용을 작성해주세요" value={reviewForm.content} onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))} />
                </div>
                {/* 사진 */}
                <div>
                  <div style={{ color: '#9c97c9', fontSize: 12, marginBottom: 6 }}>사진 (선택)</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <div style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #3a2d66', background: '#120b28', color: '#9c97c9', fontSize: 13 }}>파일 선택</div>
                    <span style={{ color: '#6d67a0', fontSize: 12 }}>{reviewForm.imgPreview ? '사진이 선택되었습니다' : '선택된 파일 없음'}</span>
                    <input type="file" accept="image/*" onChange={handleImgChange} style={{ display: 'none' }} />
                  </label>
                  {reviewForm.imgPreview && (
                    <img src={reviewForm.imgPreview} alt="미리보기" style={{ marginTop: 10, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #3a2d66' }} />
                  )}
                </div>
              </div>
            )}

            {/* 문의 폼 */}
            {tab === '문의' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ color: '#9c97c9', fontSize: 12, marginBottom: 6 }}>제목</div>
                  <input style={darkInput} placeholder="문의 제목을 입력하세요" value={inquiryForm.title} onChange={e => setInquiryForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <div style={{ color: '#9c97c9', fontSize: 12, marginBottom: 6 }}>내용</div>
                  <textarea style={{ ...darkInput, resize: 'vertical', minHeight: 120 }} placeholder="문의 내용을 상세히 작성해주세요" value={inquiryForm.content} onChange={e => setInquiryForm(f => ({ ...f, content: e.target.value }))} />
                </div>
                {/* 비공개 체크박스 */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={inquiryForm.isPrivate}
                    onChange={e => setInquiryForm(f => ({ ...f, isPrivate: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#7b5cff', cursor: 'pointer' }}
                  />
                  <span style={{ color: inquiryForm.isPrivate ? '#c4b5fd' : '#9c97c9', fontSize: 14 }}>🔒 비공개 문의</span>
                  {inquiryForm.isPrivate && <span style={{ fontSize: 12, color: '#6d67a0' }}>다른 사용자에게 내용이 공개되지 않습니다</span>}
                </label>
              </div>
            )}

            {/* 제출 버튼 */}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={closeModal}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7b5cff, #22d3ee)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {tab === '후기' ? '후기 올리기' : '문의 제출'}
              </button>
              <button onClick={closeModal} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #3a2d66', background: '#120b28', color: '#9c97c9', fontSize: 14, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
