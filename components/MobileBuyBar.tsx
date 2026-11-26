'use client'

import { useEffect, useState, type ReactNode } from 'react'

// 휴대폰 상품 상세 아래에 붙는 구매·응모 버튼 — 사진이 화면을 거의 다 차지해서 원래 버튼이 첫 화면 밖에 있을 때를 위한 것.
// 원래 버튼(id = watchId)이 화면에 보이면 숨고, 안 보이면 나타난다. 넓은 화면에선 CSS로 아예 안 보인다.
export default function MobileBuyBar({ watchId, price, label, onClick, disabled }: {
  watchId: string
  price?: ReactNode
  label: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = document.getElementById(watchId)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [watchId])

  // 매진·마감·품절처럼 살 수 없으면 아래 고정 버튼은 띄우지 않는다 (원래 버튼 자리에 상태가 이미 보인다)
  if (disabled) return null

  // 맨 아래 하단 정보(푸터)가 버튼에 가려지지 않는 자리는 CSS가 푸터 아래에 남긴다 (globals.css .mobile-buy-bar)
  return (
    <>
      <div className={`mobile-buy-bar${show ? ' show' : ''}`} aria-hidden={!show}>
        {price != null && <div className="mobile-buy-price">{price}</div>}
        <button type="button" className="btn-raffle" onClick={onClick} disabled={disabled} tabIndex={show ? 0 : -1}>
          {label}
        </button>
      </div>
    </>
  )
}
