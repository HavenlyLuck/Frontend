'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { browserRefusesTracking, setSiteOptOut, siteOptedOut } from '@/lib/metaPixel'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

// 푸터의 "광고 측정 설정" — 메타 픽셀을 켜고 끈다
export default function AdMeasurementSettings() {
  const [open, setOpen] = useState(false)
  const [optOut, setOptOut] = useState(false)
  const [browserRefuses, setBrowserRefuses] = useState(false)
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    setOptOut(siteOptedOut())
    setBrowserRefuses(browserRefusesTracking())
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const measuring = !optOut && !browserRefuses
  const toggle = () => {
    setSiteOptOut(!optOut)
    setOptOut(!optOut)
  }

  return (
    <>
      <button type="button" className="footer-link-btn" onClick={() => setOpen(true)}>
        광고 측정 설정
      </button>
      <div
        className={`modal-overlay ${open ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      >
        {open && (
          <div className="modal ad-measure-modal" role="dialog" aria-modal="true" aria-label="광고 측정 설정" style={{ margin: '0 16px' }}>
            <div className="modal-title">광고 측정 설정</div>
            <div className="ad-measure-desc">
              천운은 광고 성과를 확인하려고 Meta(페이스북·인스타그램) 픽셀로 방문·가입·결제 기록을 Meta가 수집하도록 허용하고 있어요.
              이름·이메일·휴대전화번호는 보내지 않아요.
            </div>
            <div className="ad-measure-row">
              <div>
                <div className="ad-measure-label">광고 측정</div>
                <div className="ad-measure-state">{measuring ? '켜짐' : '꺼짐'}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={measuring}
                aria-label="광고 측정"
                className={`ad-measure-switch${measuring ? ' on' : ''}`}
                disabled={browserRefuses}
                onClick={toggle}
              >
                <span />
              </button>
            </div>
            {browserRefuses && (
              <div className="ad-measure-note">
                브라우저에서 추적 거부(GPC·Do Not Track)가 켜져 있어 광고 측정을 하지 않아요.
              </div>
            )}
            <div className="ad-measure-note">
              끄면 이 브라우저에서는 픽셀이 동작하지 않아요.
              설정은 이 브라우저에만 저장돼요. 자세한 내용은 <Link href="/privacy" onClick={() => setOpen(false)}>개인정보처리방침 제4조</Link>를 확인해 주세요.
            </div>
            <div className="modal-btn-row">
              <button className="btn-confirm" onClick={() => setOpen(false)}>닫기</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
