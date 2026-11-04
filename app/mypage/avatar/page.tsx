'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowCounterClockwiseIcon, CheckIcon, GrainsIcon, LightningIcon, LockSimpleIcon, PaintBrushIcon } from '@phosphor-icons/react'
import PixelAvatar from '@/components/PixelAvatar'
import LightningDrawScene from '@/components/LightningDrawScene'
import AvatarRoom from '@/components/AvatarRoom'
import { SAMPLE_MY_ENTRY, sampleEntrants } from '@/lib/lightningDraw/sample'
import { getValidSession } from '@/lib/auth'
import { getMyAvatarItems, getMyProfile, updateMyAvatar, ApiError } from '@/lib/api'
import { DEFAULT_AVATAR, avatarKey, normalizeAvatar, withItem, type AvatarConfig, type WearSlot } from '@/lib/avatar/compose'
import { AVATAR_SHOP_ITEMS, HAIRS, SLOT_LABELS, WEAR_SLOTS } from '@/lib/avatar/shopItems'
import { notifyAvatarUpdated } from '@/lib/avatar/events'

type TabId = 'hair' | WearSlot
const TABS: { id: TabId; label: string }[] = [
  { id: 'hair', label: '머리' },
  ...WEAR_SLOTS.map(slot => ({ id: slot, label: SLOT_LABELS[slot] })),
]

export default function AvatarPage() {
  const [saved, setSaved] = useState<AvatarConfig | null>(null)
  const [hasSaved, setHasSaved] = useState(true)
  const [draft, setDraft] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [tabId, setTabId] = useState<TabId>('hair')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [preview, setPreview] = useState<{ config: AvatarConfig; seed: number } | null>(null)
  const [owned, setOwned] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (!session) return
      getMyProfile(session.token)
        .then((profile) => {
          if (cancelled) return
          const config = normalizeAvatar(profile.avatar_config)
          setSaved(config)
          setDraft(config)
          // 예전 형식으로 저장된 캐릭터는 새 형식으로 한 번 저장해야 하므로 "저장 안 함"으로 본다
          setHasSaved(profile.avatar_config?.v === 3)
        })
        .catch(() => {
          if (!cancelled) setSaved(DEFAULT_AVATAR)
        })
      getMyAvatarItems(session.token)
        .then((ids) => { if (!cancelled) setOwned(new Set(ids)) })
        .catch(() => {}) // 못 불러오면 아이템이 전부 잠겨 보인다
    })
    return () => { cancelled = true }
  }, [])

  // 아직 한 번도 저장하지 않았으면 기본 캐릭터 그대로라도 저장할 수 있게 한다
  const dirty = saved !== null && (!hasSaved || avatarKey(saved) !== avatarKey(draft))

  const openPreview = (seed = Math.floor(Math.random() * 100000) + 1) => {
    setPreview({ config: draft, seed })
  }

  // 장면은 entrants가 바뀌면 처음부터 다시 그리므로 고정한다. 내 이름표는 "나"만 보이게 1장.
  const previewEntrants = useMemo(
    () => preview
      ? sampleEntrants(preview.seed, preview.config).map(e => (e.entryNumber === SAMPLE_MY_ENTRY ? { ...e, ticketCount: 1 } : e))
      : undefined,
    [preview],
  )

  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  const update = (next: AvatarConfig) => {
    setDraft(next)
    setMessage(null)
  }

  const handleSave = async () => {
    const session = await getValidSession()
    if (!session) return
    setSaving(true)
    setMessage(null)
    try {
      const profile = await updateMyAvatar(session.token, draft)
      const config = normalizeAvatar(profile.avatar_config)
      setSaved(config)
      setDraft(config)
      setHasSaved(true)
      notifyAvatarUpdated(config)
      setMessage({ ok: true, text: '캐릭터를 저장했어요.' })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><PaintBrushIcon size={17} weight="fill" color="var(--accent)" /> 캐릭터 꾸미기</div>
      </div>

      <div className="avatar-editor">
        <div className="avatar-preview-card">
          <div className="avatar-preview" style={{ width: 220 }}>
            <AvatarRoom config={draft} label="내 캐릭터 미리보기" />
          </div>
          <button
            type="button"
            className="btn-ghost avatar-small-btn"
            disabled={!saved || avatarKey(saved) === avatarKey(draft)}
            onClick={() => { if (saved) update(saved) }}
          >
            <ArrowCounterClockwiseIcon size={16} weight="bold" /> 되돌리기
          </button>
          <button type="button" className="btn-ghost avatar-small-btn" onClick={() => openPreview()}>
            <LightningIcon size={16} weight="fill" /> 추첨영상 미리보기
          </button>
          <button type="button" className="btn-primary avatar-save-btn" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? '저장 중...' : <><CheckIcon size={16} weight="bold" /> 저장하기</>}
          </button>
          {message && (
            <div className="avatar-message" style={{ color: message.ok ? 'var(--success)' : 'var(--danger)' }}>{message.text}</div>
          )}
        </div>

        <div className="avatar-options-card">
          <div className="avatar-tabs" role="tablist">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tabId}
                className={`avatar-tab${t.id === tabId ? ' active' : ''}`}
                onClick={() => setTabId(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tabId === 'hair' ? (
            <div className="avatar-option-group">
              <div className="avatar-option-label">
                머리 모양{!hasSaved && <span className="avatar-option-hint"> · 먼저 골라 주세요</span>}
              </div>
              <div className="avatar-style-grid">
                {HAIRS.map(h => {
                  const selected = draft.hair === h.id
                  return (
                    <button
                      key={h.id}
                      type="button"
                      className={`avatar-style-option${selected ? ' selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() => update({ ...draft, hair: h.id })}
                    >
                      <PixelAvatar config={{ ...draft, hair: h.id }} size={80} />
                      <span>{h.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="avatar-option-group">
              <div className="avatar-option-label">
                {SLOT_LABELS[tabId]}<span className="avatar-option-hint"> · 쌀포인트 상점에서 산 아이템을 입을 수 있어요</span>
              </div>
              <div className="avatar-style-grid">
                <button
                  type="button"
                  className={`avatar-style-option${draft[tabId] == null ? ' selected' : ''}`}
                  aria-pressed={draft[tabId] == null}
                  onClick={() => update(withItem(draft, tabId, undefined))}
                >
                  <PixelAvatar config={withItem(draft, tabId, undefined)} size={80} />
                  <span>기본</span>
                </button>
                {AVATAR_SHOP_ITEMS.filter(item => item.slot === tabId).map(item => {
                  const has = owned.has(item.id)
                  const selected = draft[tabId] === item.id
                  return has ? (
                    <button
                      key={item.id}
                      type="button"
                      className={`avatar-style-option${selected ? ' selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() => update(withItem(draft, tabId, item.id))}
                    >
                      <PixelAvatar config={withItem(draft, tabId, item.id)} size={80} />
                      <span>{item.name}</span>
                    </button>
                  ) : (
                    // 안 산 아이템은 입은 모습만 보여주고 상점으로 보낸다
                    <Link key={item.id} href="/shop" className="avatar-style-option locked" title="쌀포인트 상점에서 구매">
                      <PixelAvatar config={withItem(draft, tabId, item.id)} size={80} />
                      <span>{item.name}</span>
                      <span className="avatar-locked-price">
                        <LockSimpleIcon size={11} weight="fill" /> <GrainsIcon size={11} weight="fill" /> {item.price.toLocaleString()}P
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`win-overlay ${preview ? 'open' : ''}`} onClick={() => setPreview(null)}>
        {preview && (
          <div className="win-modal has-scene" role="dialog" aria-label="추첨영상 미리보기" onClick={e => e.stopPropagation()}>
            <div className="avatar-scene-title">추첨영상 미리보기</div>
            <LightningDrawScene
              key={preview.seed}
              seed={preview.seed}
              myEntryNumbers={[SAMPLE_MY_ENTRY]}
              winnerEntryNumber={SAMPLE_MY_ENTRY}
              entrants={previewEntrants}
            />
            <div className="avatar-scene-actions">
              <button type="button" className="btn-ghost avatar-small-btn" onClick={() => openPreview(preview.seed + 1)}>
                <ArrowCounterClockwiseIcon size={16} weight="bold" /> 다시 보기
              </button>
              <button type="button" className="win-close" onClick={() => setPreview(null)}>닫기</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
