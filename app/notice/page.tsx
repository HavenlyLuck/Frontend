'use client'

import { useEffect, useState } from 'react'
import { CaretDownIcon, MegaphoneIcon, PushPinIcon, TrashIcon, XIcon } from '@phosphor-icons/react'
import { verifyAdmin } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { createNotice, deleteNotice, getNotices, updateNotice, type Notice } from '@/lib/notices'

const EMPTY_FORM = { title: '', content: '', pinned: false }

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  // 관리자에게만 글쓰기·고정·삭제를 보여준다 (실제 권한 확인은 서버가 한다)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reload = () => getNotices().then(setNotices).catch(() => setNotices([]))

  useEffect(() => {
    reload()
    let cancelled = false
    getValidSession().then(session => {
      if (!session) return
      verifyAdmin(session.token)
        .then(() => { if (!cancelled) setAdminToken(session.token) })
        .catch(() => {}) // 관리자가 아니면 읽기만
    })
    return () => { cancelled = true }
  }, [])

  const closeForm = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setError('')
  }

  const submit = async () => {
    if (!adminToken) return
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      const created = await createNotice(adminToken, { title: form.title.trim(), content: form.content.trim(), pinned: form.pinned })
      await reload()
      setOpenId(created.notice_id)
      closeForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록하지 못했어요.')
    } finally {
      setSaving(false)
    }
  }

  const togglePin = async (n: Notice) => {
    if (!adminToken) return
    await updateNotice(adminToken, n.notice_id, { pinned: !n.pinned })
    reload()
  }

  const remove = async (n: Notice) => {
    if (!adminToken || !confirm(`'${n.title}' 공지를 삭제할까요?`)) return
    await deleteNotice(adminToken, n.notice_id)
    if (openId === n.notice_id) setOpenId(null)
    reload()
  }

  return (
    <div>
      <div className="home-container" style={{ maxWidth: 800 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>
          <MegaphoneIcon size={18} weight="fill" color="var(--accent)" /> 공지사항
        </div>

        {adminToken && (
          <div className="review-toolbar">
            <button className="review-write-btn" onClick={() => setShowForm(true)}>공지 작성</button>
          </div>
        )}

        {notices === null ? (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
        ) : notices.length === 0 ? (
          <div className="coming-soon-box large">
            <div className="emoji"><MegaphoneIcon size={32} weight="light" /></div>
            <div className="title">등록된 공지사항이 없어요</div>
            <div className="desc">새로운 소식이 생기면 이곳에 알려드릴게요.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notices.map(n => {
              const isOpen = openId === n.notice_id
              return (
                <div key={n.notice_id} className={`inquiry-card${isOpen ? ' open' : ''}`}>
                  <button className="inquiry-head" onClick={() => setOpenId(isOpen ? null : n.notice_id)} aria-expanded={isOpen}>
                    {n.pinned && <div className="status-badge notice-pin"><PushPinIcon size={12} weight="fill" /> 고정</div>}
                    <div className="inquiry-title">{n.title}</div>
                    <div className="inquiry-meta">
                      <span>{formatDate(n.created_at)}</span>
                    </div>
                    <span className={`inquiry-caret${isOpen ? ' open' : ''}`}><CaretDownIcon size={16} /></span>
                  </button>

                  {isOpen && (
                    <div className="inquiry-body">
                      <p className="notice-content">{n.content}</p>
                      {adminToken && (
                        <div className="notice-admin-actions">
                          <button type="button" onClick={() => togglePin(n)}>
                            <PushPinIcon size={14} weight={n.pinned ? 'fill' : 'regular'} /> {n.pinned ? '고정 해제' : '상단 고정'}
                          </button>
                          <button type="button" className="danger" onClick={() => remove(n)}>
                            <TrashIcon size={14} /> 삭제
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && adminToken && (
        <>
          <div className="review-modal-backdrop" onClick={closeForm} />
          <div className="review-modal" role="dialog" aria-label="공지 작성">
            <div className="review-modal-head">
              <div className="review-modal-title"><MegaphoneIcon size={18} weight="fill" color="var(--accent)" /> 공지 작성</div>
              <button className="review-modal-close" onClick={closeForm} aria-label="닫기"><XIcon size={20} /></button>
            </div>
            <div className="review-modal-form">
              <div>
                <div className="field-label">제목</div>
                <input
                  className="field-input"
                  placeholder="공지 제목을 입력하세요"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <div className="field-label">내용</div>
                <textarea
                  className="field-textarea"
                  placeholder="공지 내용을 입력하세요"
                  rows={8}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                />
              </div>
              <label className={`review-private-row${form.pinned ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <span className="label"><PushPinIcon size={13} /> 상단 고정</span>
                {form.pinned && <span className="review-private-hint">목록 맨 위에 고정돼요</span>}
              </label>
              {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            </div>
            <div className="review-modal-actions">
              <button className="review-modal-submit" onClick={submit} disabled={saving}>{saving ? '등록 중...' : '등록하기'}</button>
              <button className="review-modal-cancel" onClick={closeForm}>취소</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
