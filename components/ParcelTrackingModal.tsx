'use client'

import { useEffect, useState } from 'react'
import { CheckCircleIcon, CopyIcon, PackageIcon, TruckIcon, WarningIcon } from '@phosphor-icons/react'
import { ApiError, trackMyParcel, type TrackingResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'

// 배송 단계 — 스마트택배 level(1~6)을 4칸 진행 막대로 보여준다
const STEPS: { label: string; minLevel: number }[] = [
  { label: '상품 인수', minLevel: 2 },
  { label: '이동 중', minLevel: 3 },
  { label: '배송 출발', minLevel: 5 },
  { label: '배송 완료', minLevel: 6 },
]

// 배송 조회 팝업 — 송장번호로 택배가 지금 어디쯤인지 보여준다 (사이트 공통 모달)
export default function ParcelTrackingModal({ carrier, trackingNumber, productName, onClose, onDelivered }: {
  carrier: string
  trackingNumber: string
  productName: string
  onClose: () => void
  onDelivered?: () => void // 배송완료가 확인되면 — 목록을 다시 불러와 '배송 완료'로 옮긴다
}) {
  const [data, setData] = useState<TrackingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    getValidSession().then(async session => {
      if (!session) { setError('로그인이 만료되었어요. 다시 로그인해 주세요.'); return }
      try {
        const res = await trackMyParcel(session.token, carrier, trackingNumber)
        if (cancelled) return
        setData(res)
        if (res.complete) onDelivered?.()
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : '배송 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrier, trackingNumber])

  const level = data?.complete ? 6 : (data?.level ?? 1)
  const latest = data?.details[0]

  const copy = () => {
    navigator.clipboard?.writeText(trackingNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal tracking-modal" role="dialog" aria-modal="true" aria-label="배송 조회" style={{ margin: '0 16px' }}>
        <div className="modal-icon">
          {data?.complete
            ? <CheckCircleIcon size={28} weight="fill" color="var(--success)" />
            : <TruckIcon size={28} weight="fill" color="var(--accent)" />}
        </div>
        <div className="modal-title">{data?.complete ? '배송이 완료되었어요' : '배송 조회'}</div>
        <div className="modal-sub">
          {productName}
          <br />
          {carrier}{' '}
          <button type="button" className="tracking-number" onClick={copy} aria-label="송장번호 복사">
            {trackingNumber} <CopyIcon size={12} />
          </button>
          {copied && <span className="tracking-copied">복사됨</span>}
        </div>

        {!data && !error && <div className="tracking-loading">택배 위치를 확인하는 중...</div>}

        {error && (
          <div className="modal-notice" role="alert">
            <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <>
            <ol className="tracking-steps" aria-label="배송 단계">
              {STEPS.map(step => (
                <li key={step.label} className={level >= step.minLevel ? 'done' : ''}>
                  <span className="dot" />
                  <span className="label">{step.label}</span>
                </li>
              ))}
            </ol>

            {latest && (
              <div className="tracking-now">
                <PackageIcon size={16} weight="fill" color="var(--accent)" style={{ flexShrink: 0 }} />
                <span>
                  지금 <b>{latest.where || '위치 확인 중'}</b>{latest.kind ? ` · ${latest.kind}` : ''}
                </span>
              </div>
            )}
            {data.estimate && !data.complete && (
              <div className="tracking-estimate">도착 예정 {data.estimate}</div>
            )}

            {data.details.length === 0 ? (
              <div className="tracking-loading">아직 택배사에 등록된 이동 기록이 없어요. 보통 발송 다음 날부터 조회돼요.</div>
            ) : (
              <ul className="tracking-timeline">
                {data.details.map((d, i) => (
                  <li key={`${d.time}-${i}`} className={i === 0 ? 'current' : ''}>
                    <div className="where">{d.where}<span className="kind">{d.kind}</span></div>
                    <div className="time">{d.time}</div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="modal-btn-row">
          <button className="btn-confirm" autoFocus onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
