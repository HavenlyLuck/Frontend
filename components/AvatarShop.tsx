'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowCounterClockwiseIcon, GrainsIcon, LightningIcon } from '@phosphor-icons/react'
import PixelAvatar from '@/components/PixelAvatar'
import LightningDrawScene from '@/components/LightningDrawScene'
import { getValidSession } from '@/lib/auth'
import { getMyProfile } from '@/lib/api'
import { DEFAULT_AVATAR, normalizeAvatar, type AvatarConfig } from '@/lib/avatar/compose'
import { AVATAR_SHOP_ITEMS, type AvatarShopItem } from '@/lib/avatar/shopItems'
import { SAMPLE_MY_ENTRY, sampleEntrants } from '@/lib/lightningDraw/sample'

type Tried = Partial<Pick<AvatarConfig, AvatarShopItem['slot']>>

// 쌀포인트 상점 "아바타" 탭 — 저장된 내 캐릭터에 아이템을 입혀 보고 추첨 화면에서 어떻게 보이는지까지 확인한다
export default function AvatarShop() {
  const [base, setBase] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [tried, setTried] = useState<Tried>({})
  const [previewSeed, setPreviewSeed] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      setLoggedIn(!!session)
      if (!session) return
      getMyProfile(session.token)
        .then((p) => { if (!cancelled) setBase(normalizeAvatar(p.avatar_config)) })
        .catch(() => {}) // 못 불러오면 기본 캐릭터로 입어본다
    })
    return () => { cancelled = true }
  }, [])

  const wearing: AvatarConfig = useMemo(() => ({ ...base, ...tried }), [base, tried])
  const isWorn = (item: AvatarShopItem) => tried[item.slot] === item.index
  const toggle = (item: AvatarShopItem) =>
    setTried((prev) => {
      const next = { ...prev }
      if (prev[item.slot] === item.index) delete next[item.slot]
      else next[item.slot] = item.index
      return next
    })

  // 미리보기 장면은 entrants가 바뀌면 처음부터 다시 그리므로 고정해 둔다(모달이 떠 있는 동안엔 옷을 못 바꾼다).
  // 내 이름표는 "나"만 보이게 1장.
  const previewEntrants = useMemo(
    () => previewSeed == null
      ? undefined
      : sampleEntrants(previewSeed, wearing).map(e => (e.entryNumber === SAMPLE_MY_ENTRY ? { ...e, ticketCount: 1 } : e)),
    [previewSeed, wearing],
  )

  useEffect(() => {
    if (previewSeed == null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewSeed(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewSeed])

  const randomSeed = () => Math.floor(Math.random() * 100000) + 1

  return (
    <div className="avatar-shop">
      <div className="avatar-shop-preview">
        <PixelAvatar config={wearing} size={192} alt="입어본 내 캐릭터" />
        <div className="avatar-shop-preview-label">
          {loggedIn === false ? '기본 캐릭터로 입어보는 중' : '내 캐릭터'}
        </div>
        {loggedIn === false && (
          <Link href="/login" className="avatar-shop-login">로그인하면 내 캐릭터로 입어볼 수 있어요</Link>
        )}
        <button
          type="button"
          className="btn-ghost avatar-small-btn"
          disabled={Object.keys(tried).length === 0}
          onClick={() => setTried({})}
        >
          <ArrowCounterClockwiseIcon size={16} weight="bold" /> 원래대로
        </button>
        <button type="button" className="btn-ghost avatar-small-btn" onClick={() => setPreviewSeed(randomSeed())}>
          <LightningIcon size={16} weight="fill" /> 추첨영상 미리보기
        </button>
      </div>

      <div className="avatar-shop-items">
        {AVATAR_SHOP_ITEMS.map((item) => {
          const worn = isWorn(item)
          return (
            <div key={item.id} className={`avatar-shop-item${worn ? ' worn' : ''}`}>
              <PixelAvatar config={{ ...base, [item.slot]: item.index }} size={112} alt={`${item.name}을(를) 든 캐릭터`} />
              <div className="avatar-shop-item-name">{item.name}</div>
              <div className="avatar-shop-item-desc">{item.description}</div>
              <div className="avatar-shop-item-price">
                <GrainsIcon size={14} weight="fill" /> {item.price.toLocaleString()}P
              </div>
              <div className="avatar-shop-item-actions">
                <button type="button" className="btn-ghost avatar-small-btn" aria-pressed={worn} onClick={() => toggle(item)}>
                  {worn ? '벗기' : '입어보기'}
                </button>
                {/* TODO(backend): 아바타 아이템 구매 API가 생기면 연결 */}
                <button type="button" className="btn-primary avatar-small-btn" disabled title="구매 기능 준비 중">
                  구매 준비 중
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className={`win-overlay ${previewSeed != null ? 'open' : ''}`} onClick={() => setPreviewSeed(null)}>
        {previewSeed != null && previewEntrants && (
          <div className="win-modal has-scene" role="dialog" aria-label="추첨영상 미리보기" onClick={e => e.stopPropagation()}>
            <div className="avatar-scene-title">추첨영상 미리보기</div>
            <LightningDrawScene
              key={previewSeed}
              seed={previewSeed}
              myEntryNumbers={[SAMPLE_MY_ENTRY]}
              winnerEntryNumber={SAMPLE_MY_ENTRY}
              entrants={previewEntrants}
            />
            <div className="avatar-scene-actions">
              <button type="button" className="btn-ghost avatar-small-btn" onClick={() => setPreviewSeed(randomSeed())}>
                <ArrowCounterClockwiseIcon size={16} weight="bold" /> 다시 보기
              </button>
              <button type="button" className="win-close" onClick={() => setPreviewSeed(null)}>닫기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
