'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, UsersThreeIcon } from '@phosphor-icons/react'
import { getMyReferral } from '@/lib/api'
import { getValidSession } from '@/lib/auth'
import { inviteLink } from '@/lib/referralLink'

// 응모 상세 — 친구를 불러 응모를 더 빨리 채우게 하는 카드. 링크에는 내 추천인 코드가 붙는다(로그인했을 때).
// 휴대폰에서는 공유 창(카카오톡 등)을 열고, 안 되면 링크를 복사한다.
export default function InviteFriendCard({ path, productName }: { path: string; productName: string }) {
  const [code, setCode] = useState<string | null>(null)
  const [done, setDone] = useState<'copied' | 'shared' | null>(null)

  useEffect(() => {
    getValidSession().then(session => {
      if (!session) return
      getMyReferral(session.token).then(r => setCode(r.referral_code)).catch(() => {})
    })
  }, [])

  const flash = (v: 'copied' | 'shared') => {
    setDone(v)
    setTimeout(() => setDone(null), 1800)
  }

  const invite = async () => {
    const url = inviteLink(path, code)
    const text = `천운에서 "${productName}" 응모 같이 해요! 다 차면 바로 추첨해요.`
    // 터치 화면(휴대폰)에서만 공유 창 — PC 공유 창은 카톡이 안 보여서 복사가 더 편하다
    const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    if (touch && navigator.share) {
      try {
        await navigator.share({ title: '천운 응모 초대', text, url })
        flash('shared')
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      flash('copied')
    } catch {
      window.prompt('아래 링크를 복사해 친구에게 보내 주세요.', url)
    }
  }

  return (
    <div className="invite-card">
      <div className="invite-card-text">
        <div className="invite-card-title">친구를 초대해서 더 빨리 응모를 완성시켜 보세요!</div>
        <div className="invite-card-sub">
          {code
            ? '친구가 내 링크로 가입하고 첫 응모권을 사면, 친구와 나 모두 쌀 응모권을 1장씩 받아요.'
            : '로그인하면 내 추천인 코드가 붙은 링크로 보내져요.'}
        </div>
      </div>
      <button type="button" className="invite-card-btn" onClick={invite}>
        {done ? <CheckIcon size={16} weight="bold" /> : <UsersThreeIcon size={16} weight="fill" />}
        {done === 'copied' ? '링크 복사됨' : done === 'shared' ? '보냈어요' : '친구 초대하기'}
      </button>
    </div>
  )
}
