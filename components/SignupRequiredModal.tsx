'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { XIcon } from '@phosphor-icons/react'
import LogoMark from './LogoMark'
import { loginPath, signupPath, SIGNUP_REQUIRED_EVENT } from '@/lib/auth'

// 로그인 안 한 사람이 응모·구매·찜 같은 버튼을 눌렀을 때 뜨는 안내 창.
// 구경은 누구나 할 수 있고, 행동할 때만 가입을 권한다. 가입·로그인을 마치면 보던 화면으로 돌아온다.
// 아무 데서나 lib/auth 의 promptSignup() 을 부르면 열린다 (app/layout.tsx 에 한 번만 올려 둔다).
export default function SignupRequiredModal() {
  // 돌아올 주소. null 이면 닫힌 상태
  const [next, setNext] = useState<string | null>(null)
  const pathname = usePathname()
  const primaryRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const open = (e: Event) => setNext((e as CustomEvent<string>).detail || '/')
    window.addEventListener(SIGNUP_REQUIRED_EVENT, open)
    return () => window.removeEventListener(SIGNUP_REQUIRED_EVENT, open)
  }, [])

  // 다른 페이지로 넘어가면 닫는다
  useEffect(() => setNext(null), [pathname])

  useEffect(() => {
    if (next === null) return
    primaryRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNext(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next])

  const open = next !== null
  return (
    <div
      className={`modal-overlay signup-req-overlay${open ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) setNext(null) }}
    >
      {open && (
        <div className="modal signup-req" role="dialog" aria-modal="true" aria-labelledby="signup-req-title">
          <button type="button" className="signup-req-close" onClick={() => setNext(null)} aria-label="닫기">
            <XIcon size={18} weight="bold" />
          </button>
          <LogoMark className="signup-req-mark" />
          <h2 id="signup-req-title">회원가입이 필요해요</h2>
          <p>가입하면 응모와 구매를 바로 할 수 있어요.<br />마치면 보던 화면으로 돌아와요.</p>
          <Link ref={primaryRef} className="btn-confirm signup-req-go" href={signupPath(next)}>회원가입하러 가기</Link>
          <Link className="signup-req-login" href={loginPath(next)}>이미 계정이 있어요</Link>
        </div>
      )}
    </div>
  )
}
