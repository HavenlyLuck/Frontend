'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { completePayment, ApiError, PaymentCompleteResponse } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { paymentFailureMessage } from '@/lib/payment'
import { notifyStorageUpdated } from '@/lib/storage'

type View =
  | { kind: 'loading' }
  | { kind: 'done'; res: PaymentCompleteResponse }
  | { kind: 'error'; message: string }

// 모바일 결제창이 끝나고 돌아오는 페이지 — ?paymentId=...&code=...&message=...&next=원래 페이지
function successText(res: PaymentCompleteResponse): string {
  if (res.raffle_entry) {
    return `응모 번호 ${res.raffle_entry.entry_number}번으로 응모권 ${res.raffle_entry.ticket_count}장이 응모되었어요.`
  }
  if (res.kuji_draw) {
    const prizes = res.kuji_draw.drawn.map(d => `${d.grade}상 ${d.name}`).join(', ')
    const lastOne = res.kuji_draw.last_one ? ` + 라스트원상 ${res.kuji_draw.last_one.name}` : ''
    return `${prizes}${lastOne} 당첨! 보관함에서 확인해주세요.`
  }
  return '구매가 완료되었습니다. 보관함에서 확인해주세요.'
}

export default function PaymentCompletePage() {
  const [view, setView] = useState<View>({ kind: 'loading' })
  const [next, setNext] = useState('/')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nextPath = params.get('next')
    // 다른 사이트로 튕기지 않도록 우리 사이트 경로만 허용
    if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) setNext(nextPath)

    const paymentId = params.get('paymentId')
    if (!paymentId) { setView({ kind: 'error', message: '결제 정보를 찾을 수 없습니다.' }); return }
    if (params.get('code')) { setView({ kind: 'error', message: params.get('message') || '결제가 취소되었습니다.' }); return }

    ;(async () => {
      const session = await getValidSession()
      if (!session) { setView({ kind: 'error', message: '로그인이 풀렸어요. 다시 로그인한 뒤 마이페이지에서 결제 결과를 확인해주세요.' }); return }
      try {
        const res = await completePayment(session.token, paymentId)
        notifyStorageUpdated()
        setView({ kind: 'done', res })
      } catch (err) {
        setView({ kind: 'error', message: err instanceof ApiError ? err.message : '결제 확인 중 오류가 발생했습니다.' })
      }
    })()
  }, [])

  const ok = view.kind === 'done' && view.res.status === 'paid'
  return (
    <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '40px 16px' }}>
        {view.kind === 'loading' ? (
          <p style={{ color: 'var(--text-secondary)' }}>결제를 확인하고 있어요...</p>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              {ok ? '결제가 완료되었습니다' : '결제를 완료하지 못했어요'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {view.kind === 'error' ? view.message : ok ? successText(view.res) : paymentFailureMessage(view.res)}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
              <Link href={next} className="field-btn">돌아가기</Link>
              {ok && <Link href="/mypage/storage" className="field-btn">보관함</Link>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
