'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowCounterClockwiseIcon, GrainsIcon, LightningIcon } from '@phosphor-icons/react'
import PixelAvatar from '@/components/PixelAvatar'
import PixelItem from '@/components/PixelItem'
import LightningDrawScene from '@/components/LightningDrawScene'
import { getValidSession } from '@/lib/auth'
import { notifyPointsUpdated } from '@/hooks/useMyPoints'
import { ApiError, getAvatarItems, getMyAvatarItems, getMyProfile, purchaseAvatarItem } from '@/lib/api'
import { DEFAULT_AVATAR, normalizeAvatar, withItem, type AvatarConfig, type WearSlot } from '@/lib/avatar/compose'
import { AVATAR_SHOP_ITEMS, type AvatarShopItem } from '@/lib/avatar/shopItems'
import { SAMPLE_MY_ENTRY, sampleEntrants } from '@/lib/lightningDraw/sample'

type Tried = Partial<Record<WearSlot, number>>

// 쌀포인트 상점 "아바타" 탭 — 저장된 내 캐릭터에 아이템을 입혀 보고 추첨 화면에서 어떻게 보이는지까지 확인한다
export default function AvatarShop() {
  const [base, setBase] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [tried, setTried] = useState<Tried>({})
  const [previewSeed, setPreviewSeed] = useState<number | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAvatarItems()
      .then((items) => { if (!cancelled) setPrices(Object.fromEntries(items.map(i => [i.item_id, i.price]))) })
      .catch(() => {}) // 못 불러오면 목록에 적힌 가격을 보여준다
    getValidSession().then((session) => {
      if (cancelled) return
      setLoggedIn(!!session)
      if (!session) return
      getMyProfile(session.token)
        .then((p) => { if (!cancelled) setBase(normalizeAvatar(p.avatar_config)) })
        .catch(() => {}) // 못 불러오면 기본 캐릭터로 입어본다
      getMyAvatarItems(session.token)
        .then((ids) => { if (!cancelled) setOwned(new Set(ids)) })
        .catch(() => {})
    })
    return () => { cancelled = true }
  }, [])

  const priceOf = (item: AvatarShopItem) => prices[item.id] ?? item.price

  const buy = async (item: AvatarShopItem) => {
    if (!confirm(`${item.name}을(를) 쌀포인트 ${priceOf(item).toLocaleString()}P로 구매할까요?`)) return
    const session = await getValidSession()
    if (!session) { alert('로그인 후 이용해주세요.'); return }
    setBusyId(item.id)
    try {
      await purchaseAvatarItem(session.token, item.id)
      setOwned((prev) => new Set(prev).add(item.id))
      notifyPointsUpdated()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : '구매 중 오류가 발생했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const wearing: AvatarConfig = useMemo(
    () => (Object.entries(tried) as [WearSlot, number][]).reduce((c, [slot, index]) => withItem(c, slot, index), base),
    [base, tried],
  )
  const isWorn = (item: AvatarShopItem) => tried[item.slot] === item.index
  // 전체 스킨과 무기·모자·망토는 같이 못 끼므로, 입어볼 때도 한쪽을 끼면 다른 쪽을 벗긴다
  const toggle = (item: AvatarShopItem) =>
    setTried((prev) => {
      if (prev[item.slot] === item.index) {
        const next = { ...prev }
        delete next[item.slot]
        return next
      }
      if (item.slot === 'costume') return { costume: item.index }
      const next = { ...prev, [item.slot]: item.index }
      delete next.costume
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
              <div className="avatar-shop-item-thumb">
                <PixelItem slot={item.slot} index={item.index} size={112} alt={item.name} />
              </div>
              <div className="avatar-shop-item-name">{item.name}</div>
              <div className="avatar-shop-item-desc">{item.description}</div>
              <div className="avatar-shop-item-price">
                <GrainsIcon size={14} weight="fill" /> {priceOf(item).toLocaleString()}P
              </div>
              <div className="avatar-shop-item-actions">
                <button type="button" className="btn-ghost avatar-small-btn" aria-pressed={worn} onClick={() => toggle(item)}>
                  {worn ? '벗기' : '입어보기'}
                </button>
                {loggedIn !== true ? (
                  <button type="button" className="btn-primary avatar-small-btn" disabled>
                    로그인 후 구매
                  </button>
                ) : owned.has(item.id) ? (
                  // 착용은 마이페이지 캐릭터 꾸미기(보유 아이템)에서 한다
                  <button type="button" className="btn-primary avatar-small-btn" disabled>
                    구매 완료
                  </button>
                ) : (
                  <button type="button" className="btn-primary avatar-small-btn" disabled={busyId === item.id} onClick={() => buy(item)}>
                    구매
                  </button>
                )}
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
