'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LogoMark, { Logo } from '@/components/LogoMark'
import { findLoginId, ApiError } from '@/lib/api'
import { formatKstDate } from '@/lib/date'
import {
  requestIdentityVerification,
  readIdentityVerificationRedirect,
  IdentityVerificationResult,
} from '@/lib/identityVerification'

export default function FindIdPage() {
  const [loading, setLoading] = useState(false)
  const [found, setFound] = useState<{ loginId: string; joinedAt: string | null } | null>(null)
  const [error, setError] = useState('')

  // 모바일 본인인증은 페이지를 떠났다가 결과를 쿼리스트링에 담아 돌아온다
  useEffect(() => {
    const result = readIdentityVerificationRedirect(window.location.search)
    if (!result) return
    window.history.replaceState(null, '', window.location.pathname)
    handleCertResult(result)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCertResult(result: IdentityVerificationResult) {
    if (!result.ok) {
      setError(result.message)
      return
    }
    setLoading(true)
    try {
      const res = await findLoginId(result.identityVerificationId)
      setFound({ loginId: res.login_id, joinedAt: res.joined_at })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '아이디를 찾는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCert() {
    setError('')
    setLoading(true)
    try {
      const result = await requestIdentityVerification(`${window.location.origin}/find-id`)
      await handleCertResult(result)
    } catch {
      setError('본인인증 창을 열지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <div className="auth-brand">
          <LogoMark className="auth-brand-mark" />
          <h1>
            천원 한 장,
            <br />
            <span>천운</span>을 뽑다.
          </h1>
        </div>

        <div className="auth-card">
          <div className="auth-card-mobile-mark">
            <Logo />
          </div>
          <h2 className="auth-title">아이디 찾기</h2>

          {found ? (
            <div className="auth-form">
              <div className="find-result">
                회원님의 아이디는
                <strong>{found.loginId}</strong>
                {found.joinedAt && <small>{formatKstDate(found.joinedAt)} 가입</small>}
              </div>
              <div className="find-actions">
                <Link href={`/find-password?id=${encodeURIComponent(found.loginId)}`} className="field-btn">
                  비밀번호 찾기
                </Link>
                <Link href={`/login?id=${encodeURIComponent(found.loginId)}`} className="auth-submit">
                  로그인
                </Link>
              </div>
            </div>
          ) : (
            <div className="auth-form">
              <p className="auth-desc">가입할 때 본인인증한 휴대폰으로 인증하면 아이디를 바로 알려드려요.</p>
              {error && <p className="field-hint fail">{error}</p>}
              <button type="button" className="auth-submit" disabled={loading} onClick={handleCert}>
                {loading ? '확인 중...' : '휴대폰 본인인증'}
              </button>
            </div>
          )}

          <div className="auth-links">
            <Link href="/login">로그인</Link>
            <Link href="/find-password">비밀번호 찾기</Link>
            <Link href="/signup">회원가입</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
