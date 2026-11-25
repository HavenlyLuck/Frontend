'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowClockwiseIcon, CrownIcon, EyeIcon, EyeSlashIcon, HeartIcon } from '@phosphor-icons/react'
import { ApiError } from '@/lib/api'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import { cloudinarySized } from '@/lib/image'
import { formatKstDateTime } from '@/lib/date'
import {
  awardIdeaWeek, categoryLabel, getIdeaAdminEntries, getIdeaAdminWeeks, hideIdea, weekLabel, weekRange,
  type IdeaAdminEntry, type IdeaAdminWeek,
} from '@/lib/ideaContest'

const RANK_COLOR: Record<number, string> = { 1: '#f3c94f', 2: '#cfd6e2', 3: '#d49a6a' }
const PRIZE: Record<number, number> = { 1: 10, 2: 5, 3: 5 }

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }
const smallBtn = (active = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
  cursor: 'pointer', border: `1px solid ${active ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
  background: active ? 'var(--accent-tint)' : 'var(--surface)', color: active ? 'var(--accent-fg)' : 'var(--text-secondary)',
})

// 아바타 아이디어 공모전 — 주가 끝나면 응모작 중 1·2·3등을 골라 쌀 응모권을 지급한다 (1등 10장, 2·3등 5장)
export default function AdminIdeaContestPage() {
  const token = useAdminToken()
  const [weeks, setWeeks] = useState<IdeaAdminWeek[] | null>(null)
  const [week, setWeek] = useState<string | null>(null)
  const [entries, setEntries] = useState<IdeaAdminEntry[] | null>(null)
  const [picks, setPicks] = useState<(number | null)[]>([null, null, null])   // 1·2·3등에 고른 응모작
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadWeeks = useCallback(async () => {
    try {
      const list = await getIdeaAdminWeeks(token)
      setWeeks(list)
      // 처음엔 아직 시상하지 않은 지난 주를 먼저 연다 (없으면 이번 주)
      setWeek(prev => prev ?? (list.find(w => !w.ongoing && !w.awarded && w.entry_count > 0) ?? list[0])?.week_start ?? null)
      setError('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '공모전 정보를 불러오지 못했어요.')
    }
  }, [token])

  const loadEntries = useCallback(async () => {
    if (!week) return
    setEntries(null)
    setPicks([null, null, null])
    try {
      setEntries(await getIdeaAdminEntries(token, week))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '응모작을 불러오지 못했어요.')
    }
  }, [token, week])

  useEffect(() => { loadWeeks() }, [loadWeeks])
  useEffect(() => { loadEntries() }, [loadEntries])

  const current = weeks?.find(w => w.week_start === week) ?? null
  const canAward = !!current && !current.ongoing && !current.awarded

  // 같은 응모작을 다른 등수에 고르면 원래 자리에서 뺀다
  const pick = (rankIdx: number, entryId: number) => {
    setPicks(prev => {
      const next = prev.map(id => (id === entryId ? null : id))
      next[rankIdx] = prev[rankIdx] === entryId ? null : entryId
      return next
    })
  }

  const chosen = picks.filter((id): id is number => id !== null)
  // 1등부터 빈칸 없이 골라야 한다 (2등만 고르고 1등을 비우면 안 됨)
  const gapless = picks.findIndex(id => id === null) === -1 || picks.slice(picks.findIndex(id => id === null)).every(id => id === null)
  const byId = new Map(entries?.map(e => [e.entry_id, e]) ?? [])
  const sameUser = new Set(chosen.map(id => byId.get(id)?.user_id)).size !== chosen.length

  const award = async () => {
    if (!week || chosen.length === 0 || !gapless || sameUser) return
    const lines = chosen.map((id, i) => `${i + 1}등 ${byId.get(id)?.nickname} · "${byId.get(id)?.title}" → 쌀 응모권 ${PRIZE[i + 1]}장`)
    if (!confirm(`${weekLabel(week)} 수상작을 확정할까요?\n\n${lines.join('\n')}\n\n쌀 응모권이 바로 지급되고, 되돌릴 수 없어요.`)) return
    setBusy(true)
    try {
      setEntries(await awardIdeaWeek(token, week, chosen))
      setPicks([null, null, null])
      await loadWeeks()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '시상하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const toggleHidden = async (e: IdeaAdminEntry) => {
    if (!e.hidden && !confirm(`"${e.title}" 응모작을 가릴까요? 고객 화면에서 안 보이고 수상작으로 고를 수 없어요.`)) return
    try {
      const updated = await hideIdea(token, e.entry_id, !e.hidden)
      setEntries(prev => prev?.map(x => (x.entry_id === e.entry_id ? updated : x)) ?? prev)
      setPicks(prev => prev.map(id => (id === e.entry_id ? null : id)))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '바꾸지 못했어요.')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="아이디어 공모전"
        description="천운 아바타 아이디어 공모전 — 고객이 그림판으로 그린 아이디어 중 매주 3명을 뽑아요. 주가 끝난 뒤(월요일 0시 이후) 고를 수 있고, 확정하면 1등 쌀 응모권 10장, 2·3등 5장이 바로 지급돼요."
        actions={<button style={smallBtn()} onClick={() => { loadWeeks(); loadEntries() }}><ArrowClockwiseIcon size={14} /> 새로고침</button>}
      />

      {error && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {/* 주 고르기 */}
      <div className="admin-sale-toggle" role="tablist" aria-label="공모전 주" style={{ flexWrap: 'wrap' }}>
        {(weeks ?? []).map(w => (
          <button key={w.week_start} role="tab" aria-selected={week === w.week_start} className={week === w.week_start ? 'active' : ''} onClick={() => setWeek(w.week_start)}>
            {weekLabel(w.week_start)}
            <span className="count">{w.ongoing ? '진행 중' : w.awarded ? '시상 완료' : w.entry_count > 0 ? '선정 대기' : '응모 없음'}</span>
          </button>
        ))}
      </div>

      {current && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 14px' }}>
          {weekRange(current.week_start)} · 응모 {current.entry_count}개
          {current.ongoing && ' · 아직 진행 중이라 마감(다음 주 월요일 0시) 후에 뽑을 수 있어요'}
        </div>
      )}

      {/* 선정 막대 — 시상 가능한 주에서만 */}
      {canAward && entries && entries.length > 0 && (
        <div style={{ ...card, overflow: 'visible', padding: 14, marginBottom: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          {[0, 1, 2].map(i => {
            const e = picks[i] != null ? byId.get(picks[i]!) : null
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: e ? 'var(--text)' : 'var(--text-tertiary)' }}>
                <CrownIcon size={15} weight="fill" color={RANK_COLOR[i + 1]} />
                <b>{i + 1}등</b> {e ? `${e.nickname} · ${e.title}` : '고르지 않음'}
              </span>
            )
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {!gapless && <span style={{ fontSize: 12, color: 'var(--danger)' }}>1등부터 차례로 골라주세요</span>}
            {sameUser && <span style={{ fontSize: 12, color: 'var(--danger)' }}>한 사람은 한 번만 수상할 수 있어요</span>}
            <button
              style={{ ...smallBtn(true), padding: '8px 14px', background: 'var(--accent)', color: '#fff', border: 'none', opacity: chosen.length === 0 || !gapless || sameUser || busy ? 0.5 : 1 }}
              disabled={chosen.length === 0 || !gapless || sameUser || busy}
              onClick={award}
            >
              {busy ? '지급 중...' : '수상 확정하고 응모권 지급'}
            </button>
          </div>
        </div>
      )}

      {entries === null ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : entries.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          이 주에는 응모작이 없어요.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[...entries].sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9) || b.like_count - a.like_count).map(e => {
            const pickedRank = picks.indexOf(e.entry_id) + 1
            return (
              <div key={e.entry_id} style={{ ...card, opacity: e.hidden ? 0.5 : 1, borderColor: e.rank || pickedRank ? RANK_COLOR[e.rank ?? pickedRank] : 'var(--border)' }}>
                <a href={e.image_url} target="_blank" rel="noreferrer" style={{ display: 'block', aspectRatio: '1 / 1', background: 'var(--bg-subtle)' }}>
                  <img src={cloudinarySized(e.image_url, 440)} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </a>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {e.rank && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: RANK_COLOR[e.rank] }}>
                      <CrownIcon size={13} weight="fill" /> {e.rank}등 · 쌀 응모권 {PRIZE[e.rank]}장 지급
                    </span>
                  )}
                  <span className="idea-cat-badge">{categoryLabel(e.category)}</span>
                  <b style={{ fontSize: 14, color: 'var(--text)', wordBreak: 'break-all' }}>{e.title}</b>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{e.nickname} (회원 {e.user_id}) · {formatKstDateTime(e.created_at)}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: 'var(--accent-fg)' }}>
                    <HeartIcon size={12} weight="fill" /> 좋아요 {e.like_count.toLocaleString()}
                  </span>
                  {e.description && <p style={{ margin: '4px 0 0', fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{e.description}</p>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {canAward && !e.hidden && [0, 1, 2].map(i => (
                      <button key={i} style={smallBtn(picks[i] === e.entry_id)} onClick={() => pick(i, e.entry_id)}>{i + 1}등</button>
                    ))}
                    {!e.rank && (
                      <button style={{ ...smallBtn(), marginLeft: 'auto' }} onClick={() => toggleHidden(e)}>
                        {e.hidden ? <><EyeIcon size={13} /> 다시 보이기</> : <><EyeSlashIcon size={13} /> 가리기</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
