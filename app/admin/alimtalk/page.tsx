'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowClockwiseIcon, CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import {
  ApiError, getAlimtalkOverview, retryAlimtalk,
  type AlimtalkKind, type AlimtalkMessageResponse, type AlimtalkOverviewResponse, type AlimtalkStatus,
} from '@/lib/api'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import { formatKstDateTime } from '@/lib/date'

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 10, boxShadow: 'var(--shadow-sm)' }
const smallBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
  cursor: 'pointer', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-secondary)',
}

const KIND_LABELS: Record<AlimtalkKind, string> = {
  raffle_entered: '응모 완료',
  raffle_sold_out: '응모 완성',
  raffle_failed: '응모 실패(자동 취소)',
  shipped: '배송 출발',
}

const STATUS_LABELS: Record<AlimtalkStatus, string> = {
  pending: '대기',
  sending: '보내는 중',
  sent: '보냄',
  failed: '실패',
  skipped: '안 보냄',
}
// 기존 상태 배지 색 재사용 — 보냄 초록, 실패 빨강, 대기 노랑, 안 보냄 회색
const STATUS_BADGE: Record<AlimtalkStatus, string> = {
  pending: 'waiting',
  sending: 'ongoing',
  sent: 'win',
  failed: 'lose',
  skipped: '',
}

const FILTERS: { key: AlimtalkStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'sent', label: '보냄' },
  { key: 'failed', label: '실패' },
  { key: 'skipped', label: '안 보냄' },
  { key: 'pending', label: '대기' },
]

// 알림 한 줄 요약 — 상품명과 종류별 핵심 정보
function summary(m: AlimtalkMessageResponse): string {
  const d = m.data
  const name = String(d.product_name ?? '')
  switch (m.kind) {
    case 'raffle_entered':
      return `${name} · ${d.ticket_count}장 · ${d.payment} · 진행 ${d.sold}/${d.total}`
    case 'raffle_sold_out':
      return `${name} · ${d.ticket_count}장 · 추첨 ${d.draw_at}`
    case 'raffle_failed':
      return `${name} · ${d.ticket_count}장 · ${d.refund}`
    case 'shipped':
      return `${name} · ${d.carrier} ${d.tracking_number}`
  }
}

// 알림톡 — 응모 완료·응모 완성·응모 실패(자동 취소)·배송 출발 때 고객에게 자동으로 나간 카카오 알림톡 기록 (솔라피로 발송)
export default function AdminAlimtalkPage() {
  const adminToken = useAdminToken()
  const [filter, setFilter] = useState<AlimtalkStatus | 'all'>('all')
  const [overview, setOverview] = useState<AlimtalkOverviewResponse | null>(null)
  const [loadError, setLoadError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setOverview(await getAlimtalkOverview(adminToken, filter === 'all' ? undefined : filter))
      setLoadError('')
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : '알림톡 기록을 불러오지 못했습니다.')
    }
  }, [adminToken, filter])

  useEffect(() => { load() }, [load])

  const retry = async (m: AlimtalkMessageResponse) => {
    setBusyId(m.message_id)
    try {
      const updated = await retryAlimtalk(adminToken, m.message_id)
      setOverview(prev => prev && { ...prev, messages: prev.messages.map(x => (x.message_id === m.message_id ? updated : x)) })
      // 서버 주기 작업이 10초 안에 보낸다 — 잠시 뒤 결과를 다시 불러온다
      setTimeout(load, 12_000)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '다시 보내지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const missingTemplates = overview?.templates.filter(t => !t.configured) ?? []

  return (
    <div>
      <AdminPageHeader
        title="알림톡"
        description="응모 완료(접수)·응모 완성(매진)·응모 실패(자동 취소)·배송 출발 때 고객에게 자동으로 나가는 카카오 알림톡이에요. 최근 100건을 보여줘요."
        actions={<button style={smallBtn} onClick={load}><ArrowClockwiseIcon size={14} /> 새로고침</button>}
      />

      {overview && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: overview.configured ? 'var(--text)' : 'var(--danger)' }}>
            {overview.configured
              ? <><CheckCircleIcon size={16} weight="fill" color="var(--success, #16a34a)" /> 솔라피 연결 설정 완료</>
              : <><WarningCircleIcon size={16} weight="fill" /> 솔라피 API 키·시크릿·카카오 채널(pfId)이 설정되지 않아 알림톡을 보내지 않아요</>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
            {overview.templates.map(t => (
              <span key={t.kind} className={`status-badge ${t.configured ? 'win' : 'lose'}`}>
                {t.label} {t.configured ? '템플릿 연결됨' : '템플릿 없음'}
              </span>
            ))}
          </div>
          {overview.configured && missingTemplates.length > 0 && (
            <div style={{ color: 'var(--text-tertiary)' }}>
              템플릿 ID가 없는 알림({missingTemplates.map(t => t.label).join(', ')})은 보내지 않아요.
            </div>
          )}
        </div>
      )}

      <div className="admin-sale-toggle" role="tablist" aria-label="발송 상태">
        {FILTERS.map(({ key, label }) => (
          <button key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>
            {label}
            {key !== 'all' && overview?.counts[key] ? <span className="count">{overview.counts[key]}</span> : null}
          </button>
        ))}
      </div>

      {loadError && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{loadError}</div>}

      {overview === null ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : overview.messages.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          알림톡 기록이 없어요.
        </div>
      ) : (
        overview.messages.map(m => (
          <div key={m.message_id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className={`status-badge ${STATUS_BADGE[m.status]}`}>{STATUS_LABELS[m.status]}</span>
              <b style={{ fontSize: 14 }}>{KIND_LABELS[m.kind] ?? m.kind}</b>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.nickname ?? `회원 ${m.user_id}`}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
                {formatKstDateTime(m.sent_at ?? m.created_at)}
              </span>
              {(m.status === 'failed' || m.status === 'skipped') && (
                <button style={smallBtn} disabled={busyId === m.message_id} onClick={() => retry(m)}>
                  {busyId === m.message_id ? '요청 중...' : '다시 보내기'}
                </button>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, wordBreak: 'break-all' }}>{summary(m)}</div>
            {m.error && (
              <div style={{ fontSize: 12, color: m.status === 'failed' ? 'var(--danger)' : 'var(--text-tertiary)', marginTop: 4, wordBreak: 'break-all' }}>
                {m.error}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
