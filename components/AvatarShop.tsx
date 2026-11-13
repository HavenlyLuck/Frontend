'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowCounterClockwiseIcon, ConfettiIcon, GrainsIcon, LightningIcon, WarningIcon } from '@phosphor-icons/react'
import AvatarRoom from '@/components/AvatarRoom'
import PixelAvatar from '@/components/PixelAvatar'
import AvatarItemPreview from '@/components/AvatarItemPreview'
import LightningDrawScene from '@/components/LightningDrawScene'
import { getValidSession, promptSignup } from '@/lib/auth'
import { notifyPointsUpdated } from '@/hooks/useMyPoints'
import { ApiError, getAvatarItems, getMyAvatarItems, getMyProfile, purchaseAvatarItem } from '@/lib/api'
import { DEFAULT_AVATAR, normalizeAvatar, withItem, type AvatarConfig, type WearSlot } from '@/lib/avatar/compose'
import { AVATAR_SHOP_ITEMS, SLOT_LABELS, WEAR_SLOTS, type AvatarShopItem } from '@/lib/avatar/shopItems'
import { SAMPLE_MY_ENTRY, sampleEntrants } from '@/lib/lightningDraw/sample'

type Tried = Partial<Record<WearSlot, string>>
type Category = 'all' | WearSlot
// 카테고리 칩 — 파는 아이템이 있는 칸만 보여준다
const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: '전체' },
  ...WEAR_SLOTS.filter(slot => AVATAR_SHOP_ITEMS.some(i => i.slot === slot)).map(slot => ({ id: slot, label: SLOT_LABELS[slot] })),
]

// 쌀포인트 상점 "아바타" 탭 — 저장된 내 캐릭터에 아이템을 입혀 보고 추첨 화면에서 어떻게 보이는지까지 확인한다
export default function AvatarShop() {
  const [base, setBase] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [tried, setTried] = useState<Tried>({})
  const [category, setCategory] = useState<Category>('all')
  const [previewSeed, setPreviewSeed] = useState<number | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  // 구매 팝업 — 확인 → 완료까지 사이트 공통 모달(.modal-overlay)로 보여준다
  const [buyTarget, setBuyTarget] = useState<AvatarShopItem | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)
  const [buyDone, setBuyDone] = useState(false)

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

  const openBuy = (item: AvatarShopItem) => {
    setBuyError(null)
    setBuyDone(false)
    setBuyTarget(item)
  }
  const closeBuy = () => {
    if (busyId) return
    setBuyTarget(null)
  }

  const buy = async () => {
    const item = buyTarget
    if (!item || busyId) return
    const session = await getValidSession()
    if (!session) { setBuyError('로그인이 만료되었어요. 다시 로그인한 뒤 시도해 주세요.'); return }
    setBusyId(item.id)
    setBuyError(null)
    try {
      await purchaseAvatarItem(session.token, item.id)
      setOwned((prev) => new Set(prev).add(item.id))
      notifyPointsUpdated()
      setBuyDone(true)
    } catch (e) {
      setBuyError(e instanceof ApiError ? e.message : '구매 중 오류가 발생했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const wearing: AvatarConfig = useMemo(
    () => (Object.entries(tried) as [WearSlot, string][]).reduce((c, [slot, id]) => withItem(c, slot, id), base),
    [base, tried],
  )
  const isWorn = (item: AvatarShopItem) => tried[item.slot] === item.id
  const toggle = (item: AvatarShopItem) =>
    setTried((prev) => {
      const next = { ...prev }
      if (prev[item.slot] === item.id) delete next[item.slot]
      else next[item.slot] = item.id
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
        {/* 마이페이지 프로필과 같은 캐릭터 칸에서 입어본 모습 */}
        <div className="profile-room avatar-shop-room">
          <AvatarRoom config={wearing} label="입어본 내 캐릭터" />
        </div>
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

      <div className="avatar-shop-catalog">
      <div className="avatar-shop-filters" role="tablist" aria-label="아바타 아이템 분류">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={category === c.id}
            className={`avatar-tab${category === c.id ? ' active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="avatar-shop-items">
        {AVATAR_SHOP_ITEMS.filter(item => category === 'all' || item.slot === category).map((item) => {
          const worn = isWorn(item)
          return (
            <div key={item.id} className={`avatar-shop-item${worn ? ' worn' : ''}`}>
              <div className="avatar-shop-item-thumb">
                {/* 기본 캐릭터가 이 아이템만 입은 모습 */}
                <AvatarItemPreview config={withItem(DEFAULT_AVATAR, item.slot, item.id)} slot={item.slot} size={112} alt={item.name} />
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
                  // 로그인 안 했으면 누를 때 가입 안내 창을 띄운다 (로그인 여부 확인 중엔 잠깐 막아 둠)
                  <button type="button" className="btn-primary avatar-small-btn" disabled={loggedIn === null} onClick={() => promptSignup()}>
                    구매
                  </button>
                ) : owned.has(item.id) ? (
                  // 착용은 마이페이지 캐릭터 꾸미기(보유 아이템)에서 한다
                  <button type="button" className="btn-primary avatar-small-btn" disabled>
                    구매 완료
                  </button>
                ) : (
                  <button type="button" className="btn-primary avatar-small-btn" disabled={busyId === item.id} onClick={() => openBuy(item)}>
                    구매
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      </div>

      <div className={`modal-overlay ${buyTarget ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeBuy() }}>
        {buyTarget && (buyDone ? (
          <div className="modal success-modal" role="dialog" aria-modal="true" aria-label="구매 완료" style={{ margin: '0 16px' }}>
            <div className="modal-icon celebrate">
              <ConfettiIcon size={28} weight="fill" color="var(--gold)" />
            </div>
            <div className="modal-title">구매가 완료되었습니다!</div>
            <div className="modal-sub">
              {buyTarget.name}을(를) 손에 넣었어요.
              <br />
              마이페이지 캐릭터 꾸미기에서 바로 입을 수 있어요.
            </div>
            <div className="modal-btn-row">
              <button type="button" className="btn-cancel" onClick={closeBuy}>계속 둘러보기</button>
              <Link href="/mypage/avatar" className="btn-confirm" style={{ textDecoration: 'none' }}>캐릭터 꾸미러 가기</Link>
            </div>
          </div>
        ) : (
          <div className="modal" role="dialog" aria-modal="true" aria-label="구매 확인" style={{ margin: '0 16px' }}>
            <div className="modal-icon">
              <GrainsIcon size={28} weight="fill" color="var(--accent)" />
            </div>
            <div className="modal-title">구매 확인</div>
            <div className="modal-sub">쌀포인트로 아바타 아이템을 구매합니다.</div>

            <div className="ticket-count" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <PixelAvatar config={withItem(DEFAULT_AVATAR, buyTarget.slot, buyTarget.id)} size={56} alt={buyTarget.name} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{buyTarget.name}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
                  <GrainsIcon size={14} weight="fill" /> {priceOf(buyTarget).toLocaleString()}P
                </div>
              </div>
            </div>

            <div className="modal-notice">
              <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>쌀포인트로 구매한 아이템은 구매 후 취소·환불할 수 없어요.</span>
            </div>

            {buyError && (
              <div className="modal-notice" role="alert">
                <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ whiteSpace: 'pre-line' }}>{buyError}</span>
              </div>
            )}

            <div className="modal-btn-row">
              <button type="button" className="btn-cancel" onClick={closeBuy} disabled={!!busyId}>취소</button>
              <button type="button" className="btn-confirm" onClick={buy} disabled={!!busyId}>
                <GrainsIcon size={15} weight="fill" /> {busyId ? '구매 중...' : '구매하기'}
              </button>
            </div>
          </div>
        ))}
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
