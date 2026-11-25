'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  CaretLeftIcon, CheckCircleIcon, CrownIcon, HeartIcon, LightbulbIcon, PaintBrushIcon, PencilSimpleIcon, TrashIcon, XIcon,
} from '@phosphor-icons/react'
import DrawingPad from '@/components/DrawingPad'
import EmojiIcon from '@/components/EmojiIcon'
import { getValidSession, promptSignup } from '@/lib/auth'
import { cloudinarySized } from '@/lib/image'
import { maskNickname } from '@/lib/mask'
import { parseServerTime } from '@/lib/raffle'
import { formatTimeAgo } from '@/lib/date'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import {
  IDEA_CATEGORIES, categoryLabel, deleteIdea, getIdeaContest, setIdeaLike, submitIdea, weekLabel, weekRange, type IdeaContestCurrent, type IdeaEntry,
} from '@/lib/ideaContest'
import type { WearSlot } from '@/lib/avatar/shopItems'

const RANK_COLOR: Record<number, string> = { 1: '#f3c94f', 2: '#cfd6e2', 3: '#d49a6a' }
const TITLE_MAX = 40
const DESC_MAX = 300

function formatLeft(ms: number) {
  if (ms <= 0) return '마감 · 심사 중'
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `마감까지 ${d > 0 ? `${d}일 ${h}시간` : h > 0 ? `${h}시간 ${m}분` : `${m}분`}`
}

export default function IdeaContestPage() {
  const [contest, setContest] = useState<IdeaContestCurrent | null>(null)
  const [failed, setFailed] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [viewing, setViewing] = useState<IdeaEntry | null>(null)
  useBodyScrollLock(viewing !== null)

  // 응모 폼
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  // 어느 아바타 분류의 아이템인지 — 골라야 그림판을 열 수 있다
  const [category, setCategory] = useState<WearSlot | null>(null)
  // 그림판에서 그린 그림 — PNG와 미리보기·이어 그리기용 data URL
  const [drawing, setDrawing] = useState<{ png: Blob; url: string } | null>(null)
  const [padOpen, setPadOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [justSubmitted, setJustSubmitted] = useState(false)

  const load = (t: string | null) =>
    getIdeaContest(t ?? undefined)
      .then(c => { setContest(c); setFailed(false) })
      .catch(() => setFailed(true))

  useEffect(() => {
    getValidSession().then(s => {
      setToken(s?.token ?? null)
      load(s?.token ?? null)
    })
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const openPad = () => {
    if (!token) { promptSignup(); return }
    if (!category) { setFormError('먼저 어떤 아바타 아이템인지 분류를 골라주세요.'); return }
    setFormError(null)
    setPadOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { promptSignup(); return }
    if (!category) { setFormError('아바타 분류를 골라주세요.'); return }
    if (!drawing) { setFormError('그림판에서 아이디어를 그려 주세요.'); return }
    if (!title.trim()) { setFormError('아이디어 이름을 적어주세요.'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      const image = new File([drawing.png], 'drawing.png', { type: 'image/png' })
      await submitIdea(token, { category, title, description: desc, image })
      setTitle('')
      setDesc('')
      setCategory(null)
      setDrawing(null)
      setJustSubmitted(true)
      await load(token)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '응모하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  // 좋아요 — 누르면 바로 바꿔 보여주고, 서버 결과로 맞춘다 (실패하면 되돌린다)
  const [sort, setSort] = useState<'latest' | 'likes'>('latest')
  const [likeBusy, setLikeBusy] = useState<number | null>(null)
  const patchEntry = (id: number, patch: Partial<IdeaEntry>) => {
    setContest(prev => prev && { ...prev, entries: prev.entries.map(x => (x.entry_id === id ? { ...x, ...patch } : x)) })
    setViewing(prev => (prev && prev.entry_id === id ? { ...prev, ...patch } : prev))
  }
  const toggleLike = async (entry: IdeaEntry) => {
    if (!token) { promptSignup(); return }
    if (likeBusy !== null) return
    const next = !entry.liked
    setLikeBusy(entry.entry_id)
    patchEntry(entry.entry_id, { liked: next, like_count: entry.like_count + (next ? 1 : -1) })
    try {
      const res = await setIdeaLike(token, entry.entry_id, next)
      patchEntry(entry.entry_id, { liked: res.liked, like_count: res.like_count })
    } catch (err) {
      patchEntry(entry.entry_id, { liked: entry.liked, like_count: entry.like_count })
      alert(err instanceof Error ? err.message : '좋아요를 누르지 못했어요.')
    } finally {
      setLikeBusy(null)
    }
  }

  const remove = async (entry: IdeaEntry) => {
    if (!token || !confirm(`"${entry.title}" 응모작을 지울까요?`)) return
    try {
      await deleteIdea(token, entry.entry_id)
      setViewing(null)
      await load(token)
    } catch (err) {
      alert(err instanceof Error ? err.message : '지우지 못했어요.')
    }
  }

  if (failed && !contest) {
    return (
      <div className="home-container" style={{ maxWidth: 960 }}>
        <div className="coming-soon-box large" style={{ marginTop: 32 }}>
          <div className="title">공모전을 불러오지 못했어요</div>
          <div className="desc">잠시 후 다시 시도해 주세요.</div>
        </div>
      </div>
    )
  }
  if (!contest) {
    return <div className="home-container" style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '80px 0' }}>불러오는 중...</div>
  }

  const left = parseServerTime(contest.ends_at) - now
  const remaining = Math.max(contest.max_entries_per_week - contest.my_entry_count, 0)
  const lastWinners = contest.recent_winners[0] ?? null
  const myEntry = contest.entries.find(e => e.mine) ?? null
  // 좋아요순: 좋아요 많은 순, 같으면 먼저 올린 순
  const listed = sort === 'likes'
    ? [...contest.entries].sort((a, b) => b.like_count - a.like_count || (a.created_at < b.created_at ? -1 : 1))
    : contest.entries
  const likeable = (e: IdeaEntry) => !e.mine && left > 0 && contest.entries.some(x => x.entry_id === e.entry_id)
  const nameOf = (e: IdeaEntry) => (e.mine ? e.nickname : maskNickname(e.nickname))

  return (
    <div className="home-container" style={{ maxWidth: 960 }}>
      <Link href="/contents" className="contest-back"><CaretLeftIcon size={14} /> 컨텐츠</Link>

      {/* 머리 */}
      <div className="contest-hero">
        <div>
          <div className="contest-hero-title"><LightbulbIcon size={24} weight="fill" color="var(--gold)" /> 천운 아바타 아이디어 공모전</div>
          <div className="contest-hero-period">{weekLabel(contest.week_start)} · {weekRange(contest.week_start)}</div>
        </div>
        <div className="contest-hero-left">{formatLeft(left)}</div>
      </div>

      {/* 소개 + 상품 */}
      <div className="idea-intro">
        <div className="idea-intro-text">
          <div className="idea-intro-title">갖고 싶은 아바타 아이템, 직접 그려 주세요</div>
          <p>
            모자 · 옷 · 소품 · 배경 무엇이든 좋아요. 그림판에서 직접 그려서 응모해요. 잘 그리지 않아도 괜찮아요, 아이디어가 중요해요!
            매주 아이디어가 좋은 <b>3명</b>을 뽑아 <b>쌀 응모권</b>을 드리고, 뽑힌 아이디어는 실제 아이템으로 만들어질 수 있어요.
          </p>
        </div>
        <div className="idea-prizes">
          {contest.prizes.map(p => (
            <div key={p.rank} className={`idea-prize rank-${p.rank}`}>
              <CrownIcon size={p.rank === 1 ? 30 : 24} weight="fill" color={RANK_COLOR[p.rank]} />
              <div className="idea-prize-rank">{p.rank}등</div>
              <div className="idea-prize-reward"><EmojiIcon name="ssal-ticket" /> 쌀 응모권 <b>{p.ssal_ticket}장</b></div>
            </div>
          ))}
        </div>
      </div>

      {/* 참여 방법 */}
      <ol className="idea-steps">
        <li><PaintBrushIcon size={22} weight="duotone" /><div><b>그림판에서 그리기</b><span>원하는 아이템을 직접 그려요</span></div></li>
        <li><PencilSimpleIcon size={22} weight="duotone" /><div><b>이름 붙여 등록</b><span>아이디어 이름과 설명을 적어 등록</span></div></li>
        <li><CrownIcon size={22} weight="duotone" /><div><b>매주 3명 선정</b><span>쌀 응모권이 보관함에 바로 들어가요</span></div></li>
      </ol>

      <div className="idea-columns">
        {/* 응모 폼 — 한 사람이 한 주에 1개. 이미 올렸으면 내 응모작을 보여준다 */}
        {token && remaining === 0 ? (
          <div className="idea-form">
            <div className="idea-form-head">
              <span className="idea-form-title">이번 주 응모 완료</span>
            </div>
            <div className="idea-form-done">
              <CheckCircleIcon size={16} weight="fill" /> 이번 주 응모를 마쳤어요. 다음 주 월요일 0시에 다시 참여할 수 있어요.
            </div>
            {myEntry && (
              <button type="button" className="idea-winner" onClick={() => setViewing(myEntry)}>
                <img src={cloudinarySized(myEntry.image_url, 160)} alt={myEntry.title} />
                <div style={{ minWidth: 0 }}>
                  <div className="idea-winner-title">{myEntry.title}</div>
                  <div className="idea-winner-name">눌러서 크게 보기 · 마감 전까지 지우고 다시 그릴 수 있어요</div>
                </div>
              </button>
            )}
          </div>
        ) : (
        <form className="idea-form" onSubmit={submit}>
          <div className="idea-form-head">
            <span className="idea-form-title">응모하기</span>
            <span className="idea-form-count">한 사람당 한 주에 1개</span>
          </div>

          {justSubmitted && (
            <div className="idea-form-done">응모했어요! 아래 이번 주 응모작에서 확인할 수 있어요.</div>
          )}

          <div className="idea-field">
            <span>1. 카테고리 선택</span>
            <div className="idea-cats" role="radiogroup" aria-label="카테고리 선택">
              {IDEA_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={category === c.id}
                  className={`idea-cat${category === c.id ? ' active' : ''}`}
                  onClick={() => { setCategory(c.id); setFormError(null) }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="idea-field-label">2. 그림 그리기{category && <small> · {categoryLabel(category)}</small>}</div>
          {drawing ? (
            <div className="idea-drop has-image">
              <img src={drawing.url} alt="내가 그린 그림" />
              <div className="idea-drop-actions">
                <button type="button" className="contest-btn is-ghost" onClick={openPad}><PaintBrushIcon size={14} /> 이어 그리기</button>
                <button type="button" className="contest-btn is-ghost" onClick={() => setDrawing(null)}><XIcon size={14} /> 지우고 다시</button>
              </div>
            </div>
          ) : (
            <button type="button" className="idea-drop" onClick={openPad} disabled={left <= 0 || !category}>
              <PaintBrushIcon size={38} weight="duotone" />
              <span className="idea-drop-main">{category ? `${categoryLabel(category)} 그리기 시작` : '그림 그리기'}</span>
              <span className="idea-drop-sub">{category ? '눌러서 그림판을 열고 아이디어를 그려 주세요' : '위에서 아이템 분류를 먼저 골라주세요'}</span>
            </button>
          )}

          <label className="idea-field">
            <span>3. 아이디어 이름</span>
            <input
              className="field-input"
              value={title}
              maxLength={TITLE_MAX}
              placeholder="예) 애호박 머리"
              onChange={e => { setTitle(e.target.value); setJustSubmitted(false) }}
            />
            <em>{title.length}/{TITLE_MAX}</em>
          </label>
          <label className="idea-field">
            <span>설명 <small>(선택)</small></span>
            <textarea
              className="field-input"
              value={desc}
              maxLength={DESC_MAX}
              rows={3}
              placeholder="아이디어에 대한 설명"
              onChange={e => setDesc(e.target.value)}
            />
            <em>{desc.length}/{DESC_MAX}</em>
          </label>

          {formError && <div className="idea-form-error">{formError}</div>}

          {!token ? (
            <button type="button" className="contest-btn idea-submit" onClick={() => promptSignup()}>로그인하고 응모하기</button>
          ) : (
            <button type="submit" className="contest-btn idea-submit" disabled={submitting || left <= 0 || !category || !drawing || !title.trim()}>
              {submitting ? '등록하는 중...' : left <= 0 ? '이번 주 응모 마감' : '등록하기'}
            </button>
          )}
        </form>
        )}

        {/* 규칙 + 지난주 수상작 */}
        <div className="idea-side">
          <ul className="contest-rules">
            <li>그림판에서 직접 그린 그림으로 응모해요. 한 사람이 한 주에 <b>{contest.max_entries_per_week}개</b>만 올릴 수 있어요.</li>
            <li>매주 월요일 0시에 새 공모전이 열리고, 일요일 자정에 마감해요.</li>
            <li>마감 후 운영진이 아이디어가 좋은 3명을 뽑아 공지사항에서 발표해요.</li>
            <li>쌀 응모권은 보관함에 바로 들어가고, 응모 상품에서 결제 대신 쓸 수 있어요.</li>
            <li>다른 사람의 그림을 베끼거나, 주제와 관계없는 그림은 가려질 수 있어요.</li>
            <li>올린 그림은 아이템 제작과 사이트 홍보에 쓰일 수 있어요. 마감 전까지는 지우고 다시 그릴 수 있어요.</li>
          </ul>

          {lastWinners && lastWinners.winners.length > 0 && (
            <div className="idea-winners">
              <div className="idea-winners-head">
                <CrownIcon size={16} weight="fill" color="var(--gold)" /> {weekLabel(lastWinners.week_start)} 수상작
              </div>
              {lastWinners.winners.map(w => (
                <button key={w.entry_id} type="button" className="idea-winner" onClick={() => setViewing(w)}>
                  <img src={cloudinarySized(w.image_url, 160)} alt={w.title} />
                  <div style={{ minWidth: 0 }}>
                    <div className="idea-winner-rank" style={{ color: RANK_COLOR[w.rank ?? 3] }}>{w.rank}등</div>
                    <div className="idea-winner-title">{w.title}</div>
                    <div className="idea-winner-name">{nameOf(w)}님</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 이번 주 응모작 */}
      <div className="contest-list-head" style={{ marginTop: 28 }}>
        <div className="contest-list-title">이번 주 응모작 {contest.entries.length}개</div>
        <div className="shop-subtabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {(['latest', 'likes'] as const).map(k => (
            <button key={k} type="button" className={`shop-subtab${sort === k ? ' active' : ''}`} onClick={() => setSort(k)}>
              {k === 'latest' ? '최신순' : '좋아요순'}
            </button>
          ))}
        </div>
      </div>
      {contest.entries.length === 0 ? (
        <div className="idea-empty">
          <LightbulbIcon size={32} weight="duotone" />
          <span>아직 응모작이 없어요. 첫 아이디어를 올려 보세요!</span>
        </div>
      ) : (
        <div className="idea-grid">
          {listed.map(e => (
            <div key={e.entry_id} className={`idea-card${e.mine ? ' is-mine' : ''}`}>
              <button type="button" className="idea-card-open" onClick={() => setViewing(e)} aria-label={`${e.title} 크게 보기`}>
                <div className="idea-card-img">
                  <img src={cloudinarySized(e.image_url, 400)} alt={e.title} loading="lazy" />
                </div>
                <div className="idea-card-body">
                  <span className="idea-cat-badge">{categoryLabel(e.category)}</span>
                  <div className="idea-card-title">{e.title}</div>
                  <div className="idea-card-meta">
                    {nameOf(e)}{e.mine && <span className="contest-card-me">나</span>} · {formatTimeAgo(e.created_at)}
                  </div>
                </div>
              </button>
              <LikeButton entry={e} disabled={!likeable(e) || likeBusy === e.entry_id} onClick={() => toggleLike(e)} />
            </div>
          ))}
        </div>
      )}

      <DrawingPad
        open={padOpen}
        title={category ? `${categoryLabel(category)} 그리기` : '그림판'}
        initial={drawing?.url ?? null}
        onCancel={() => setPadOpen(false)}
        onDone={(png, url) => { setDrawing({ png, url }); setPadOpen(false); setJustSubmitted(false) }}
      />

      {/* 크게 보기 */}
      <div className={`modal-overlay ${viewing ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setViewing(null) }}>
        {viewing && (
          <div className="modal idea-viewer" role="dialog" aria-modal="true" aria-label={viewing.title}>
            <button type="button" className="idea-viewer-close" aria-label="닫기" onClick={() => setViewing(null)}><XIcon size={18} /></button>
            <img src={cloudinarySized(viewing.image_url, 1080)} alt={viewing.title} />
            <div className="idea-viewer-body">
              {viewing.rank && (
                <div className="idea-winner-rank" style={{ color: RANK_COLOR[viewing.rank] }}>
                  <CrownIcon size={14} weight="fill" /> {viewing.rank}등 수상작
                </div>
              )}
              <span className="idea-cat-badge">{categoryLabel(viewing.category)}</span>
              <div className="idea-viewer-title">{viewing.title}</div>
              <div className="idea-card-meta">{nameOf(viewing)}님 · {formatTimeAgo(viewing.created_at)}</div>
              {viewing.description && <p className="idea-viewer-desc">{viewing.description}</p>}
              <LikeButton entry={viewing} large disabled={!likeable(viewing) || likeBusy === viewing.entry_id} onClick={() => toggleLike(viewing)} />
              {viewing.mine && !viewing.rank && left > 0 && contest.entries.some(e => e.entry_id === viewing.entry_id) && (
                <button type="button" className="contest-btn is-ghost" style={{ alignSelf: 'flex-start', gap: 4 }} onClick={() => remove(viewing)}>
                  <TrashIcon size={14} /> 내 응모작 지우기
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 좋아요 하트 — 내가 누른 응모작은 채운 하트. 누를 수 없는 경우(내 응모작 · 마감)에도 수는 보여준다
function LikeButton({ entry, disabled, large, onClick }: { entry: IdeaEntry; disabled: boolean; large?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`idea-like${entry.liked ? ' is-liked' : ''}${large ? ' is-large' : ''}`}
      aria-pressed={entry.liked}
      aria-label={entry.liked ? '좋아요 취소' : '좋아요'}
      title={entry.mine ? '내 응모작에는 좋아요를 누를 수 없어요' : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <HeartIcon size={large ? 18 : 15} weight={entry.liked ? 'fill' : 'regular'} />
      {entry.like_count.toLocaleString()}
    </button>
  )
}
