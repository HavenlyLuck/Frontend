'use client'

import { useEffect, useState } from 'react'
import { ChatCircleIcon, LockIcon, QuestionIcon } from '@phosphor-icons/react'
import { ApiError } from '@/lib/api'
import { AdminPageHeader, useAdminToken, useRefreshAdminBadges } from '@/components/admin/AdminShell'
import { answerInquiry, getAdminInquiries, type InquiryResponse } from '@/lib/reviews'
import { formatKstDateTime } from '@/lib/date'

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: 'var(--shadow-sm)' }
const textarea: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }
const btn = (primary: boolean): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  border: primary ? 'none' : '1px solid var(--border-strong)',
  background: primary ? 'var(--accent)' : 'var(--surface)',
  color: primary ? '#fff' : 'var(--text-secondary)',
})

type Status = 'waiting' | 'answered'

// 문의 관리 — 후기/문의 페이지에 올라온 문의에 답변을 단다 (비공개 문의도 관리자는 내용을 본다)
export default function AdminInquiriesPage() {
  const adminToken = useAdminToken()
  const refreshBadges = useRefreshAdminBadges()
  const [status, setStatus] = useState<Status>('waiting')
  const [list, setList] = useState<InquiryResponse[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [editing, setEditing] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = async () => {
    try {
      setList(await getAdminInquiries(adminToken))
      setLoadError('')
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : '문의 목록을 불러오지 못했습니다.')
    }
  }

  useEffect(() => { load() }, [adminToken]) // eslint-disable-line react-hooks/exhaustive-deps

  const waiting = list?.filter(q => !q.answered) ?? []
  const answered = list?.filter(q => q.answered) ?? []
  // 답변대기는 오래된 문의부터
  const shown = status === 'waiting' ? [...waiting].reverse() : answered

  const submit = async (q: InquiryResponse) => {
    const answer = (drafts[q.inquiry_id] ?? '').trim()
    if (!answer) return alert('답변 내용을 입력해주세요.')
    setBusyId(q.inquiry_id)
    try {
      const updated = await answerInquiry(adminToken, q.inquiry_id, answer)
      setList(prev => prev?.map(x => (x.inquiry_id === q.inquiry_id ? updated : x)) ?? prev)
      refreshBadges()
      setDrafts(prev => { const next = { ...prev }; delete next[q.inquiry_id]; return next })
      setEditing(null)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '답변을 저장하지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="문의"
        description="후기/문의 페이지에 올라온 문의예요. 답변을 달면 고객 화면에 '답변완료'로 보여요. 비공개 문의도 여기서는 내용이 보여요."
      />

      <div className="admin-sale-toggle" role="tablist" aria-label="답변 상태">
        {([['waiting', '답변 대기', waiting.length], ['answered', '답변 완료', answered.length]] as const).map(([key, label, count]) => (
          <button key={key} role="tab" aria-selected={status === key} className={status === key ? 'active' : ''} onClick={() => setStatus(key)}>
            {label} <span className="count">{count}</span>
          </button>
        ))}
      </div>

      {loadError && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{loadError}</div>}

      {list === null ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : shown.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          {status === 'waiting' ? '답변할 문의가 없어요.' : '답변한 문의가 없어요.'}
        </div>
      ) : (
        shown.map(q => {
          const isEditing = !q.answered || editing === q.inquiry_id
          const draft = drafts[q.inquiry_id] ?? (editing === q.inquiry_id ? q.answer ?? '' : '')
          return (
            <div key={q.inquiry_id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className={`status-badge ${q.answered ? 'win' : 'waiting'}`}>{q.answered ? '답변완료' : '답변대기'}</span>
                {q.is_private && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <LockIcon size={12} /> 비공개
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {q.nickname} · {formatKstDateTime(q.created_at)}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <QuestionIcon size={15} color="var(--accent)" /> {q.title}
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{q.content}</p>

              {isEditing ? (
                <>
                  <textarea
                    style={textarea}
                    placeholder="답변을 입력하세요"
                    value={draft}
                    onChange={e => setDrafts(prev => ({ ...prev, [q.inquiry_id]: e.target.value }))}
                    disabled={busyId === q.inquiry_id}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    {q.answered && (
                      <button style={btn(false)} onClick={() => { setEditing(null); setDrafts(prev => { const next = { ...prev }; delete next[q.inquiry_id]; return next }) }}>
                        취소
                      </button>
                    )}
                    <button style={btn(true)} disabled={busyId === q.inquiry_id} onClick={() => submit({ ...q })}>
                      {busyId === q.inquiry_id ? '저장 중...' : q.answered ? '답변 수정' : '답변 등록'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                    <ChatCircleIcon size={13} weight="fill" /> 답변 {q.answered_at && <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>· {formatKstDateTime(q.answered_at)}</span>}
                    <button
                      style={{ marginLeft: 'auto', border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer' }}
                      onClick={() => { setEditing(q.inquiry_id); setDrafts(prev => ({ ...prev, [q.inquiry_id]: q.answer ?? '' })) }}
                    >
                      수정
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{q.answer}</p>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
