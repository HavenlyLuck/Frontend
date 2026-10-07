'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowCounterClockwiseIcon, CheckIcon, LightningIcon, PaintBrushIcon } from '@phosphor-icons/react'
import PixelAvatar from '@/components/PixelAvatar'
import LightningDrawScene from '@/components/LightningDrawScene'
import { SAMPLE_MY_ENTRY, sampleEntrants } from '@/lib/lightningDraw/sample'
import { getValidSession } from '@/lib/auth'
import { getMyAvatarItems, getMyProfile, updateMyAvatar, ApiError } from '@/lib/api'
import {
  DEFAULT_AVATAR, ITEM_SLOTS, avatarKey, normalizeAvatar, withItem,
  type AvatarConfig, type AvatarNumberKey, type ItemSlot,
} from '@/lib/avatar/compose'
import { AVATAR_SHOP_ITEMS } from '@/lib/avatar/shopItems'
import {
  BOTTOMS, BOTTOM_COLORS, HAIRS, HAIR_COLORS, SKIN_TONES, TOPS, TOP_COLORS,
  type Gender, type Part, type Swatch,
} from '@/lib/avatar/parts'
import { notifyAvatarUpdated } from '@/lib/avatar/events'

interface Tab {
  id: string
  label: string
  style?: { key: AvatarNumberKey; parts: (g: Gender) => Part[] }
  color: { key: AvatarNumberKey; label: string; swatches: Swatch[] }
}

const TABS: Tab[] = [
  {
    id: 'hair', label: '머리',
    style: { key: 'hair', parts: g => HAIRS[g] },
    color: { key: 'hairColor', label: '머리색', swatches: HAIR_COLORS },
  },
  {
    id: 'top', label: '상의',
    style: { key: 'top', parts: () => TOPS },
    color: { key: 'topColor', label: '상의 색', swatches: TOP_COLORS },
  },
  {
    id: 'bottom', label: '하의',
    style: { key: 'bottom', parts: g => BOTTOMS[g] },
    color: { key: 'bottomColor', label: '하의 색', swatches: BOTTOM_COLORS },
  },
  {
    id: 'skin', label: '피부',
    color: { key: 'skin', label: '피부색', swatches: SKIN_TONES },
  },
]

// 기본 모드의 "아이템" 탭 — 쌀포인트 상점에서 산 무기·모자·망토를 끼고 벗는다
const ITEMS_TAB_ID = 'items'
const ITEM_SLOT_LABELS: Record<ItemSlot, string> = { weapon: '무기', hat: '모자', cape: '망토' }

// 기본 모드: 직접 꾸민 캐릭터 + 아이템 / 스킨 모드: 산 전체 스킨으로 통째로 바꾼다
type Mode = 'basic' | 'skin'

type StashedItems = Partial<Pick<AvatarConfig, ItemSlot>>
function pickItems(c: AvatarConfig): StashedItems {
  const out: StashedItems = {}
  for (const slot of Object.keys(ITEM_SLOTS) as ItemSlot[]) if (c[slot] != null) out[slot] = c[slot]
  return out
}

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'm', label: '남자' },
  { id: 'f', label: '여자' },
]

// 성별을 바꾸면 머리·하의 목록이 달라지므로 그 둘만 첫 번째 스타일로 돌린다(색·상의·피부는 유지)
function withGender(c: AvatarConfig, gender: Gender): AvatarConfig {
  return c.gender === gender ? c : { ...c, gender, hair: 0, bottom: 0 }
}

export default function AvatarPage() {
  const [saved, setSaved] = useState<AvatarConfig | null>(null)
  const [hasSaved, setHasSaved] = useState(true)
  const [draft, setDraft] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [tabId, setTabId] = useState(TABS[0].id)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [preview, setPreview] = useState<{ config: AvatarConfig; seed: number } | null>(null)
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<Mode>('basic')
  // 스킨 모드로 바꾸면 무기·모자·망토가 벗겨지므로, 기본 모드로 돌아올 때 다시 끼워 준다
  const [stashedItems, setStashedItems] = useState<StashedItems>({})
  const [lastSkin, setLastSkin] = useState<number | null>(null)

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
          setHasSaved(profile.avatar_config?.v === 2)
          if (config.costume != null) {
            setMode('skin')
            setLastSkin(config.costume)
          }
        })
        .catch(() => {
          if (!cancelled) setSaved(DEFAULT_AVATAR)
        })
      getMyAvatarItems(session.token)
        .then((ids) => { if (!cancelled) setOwned(new Set(ids)) })
        .catch(() => {}) // 못 불러오면 아이템·스킨 목록이 비어 보인다
    })
    return () => { cancelled = true }
  }, [])

  const tab = TABS.find(t => t.id === tabId)
  const ownedItems = AVATAR_SHOP_ITEMS.filter(item => owned.has(item.id) && item.slot !== 'costume')
  const ownedSkins = AVATAR_SHOP_ITEMS.filter(item => owned.has(item.id) && item.slot === 'costume')
  // 아직 한 번도 저장하지 않았으면 기본 캐릭터 그대로라도 저장할 수 있게 한다
  const dirty = saved !== null && (!hasSaved || avatarKey(saved) !== avatarKey(draft))

  // 스타일 썸네일은 지금 고른 다른 값들을 그대로 두고 해당 항목만 바꿔서 보여준다
  const styleOptions = useMemo(() => {
    if (!tab?.style) return []
    const key = tab.style.key
    return tab.style.parts(draft.gender).map((part, i) => ({ name: part.name, i, config: { ...draft, [key]: i } as AvatarConfig }))
  }, [tab, draft])

  const genderOptions = useMemo(
    () => GENDERS.map(g => ({ ...g, config: withGender(draft, g.id) })),
    [draft],
  )

  // 고르던 모습(저장 전이어도) 그대로 샘플 공원에 세워서 "내가 당첨"되는 장면으로 보여준다.
  // 다시 보기는 장면 번호를 바꿔 다른 공원·다른 사람들로.
  const openPreview = (seed = Math.floor(Math.random() * 100000) + 1) => {
    setPreview({ config: draft, seed })
  }

  // 장면은 entrants가 바뀌면 처음부터 다시 그리므로, 렌더마다 새 배열을 만들지 않게 고정한다
  // 꾸미기 미리보기에선 내 이름표가 "나"만 보이게 1장으로 둔다 (샘플 장수가 붙으면 실제로 산 것처럼 보임)
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

  const applySkin = (index: number) => {
    if (draft.costume == null) setStashedItems(pickItems(draft))
    setLastSkin(index)
    update(withItem(draft, 'costume', index))
  }

  const changeMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    if (next === 'basic') {
      // 스킨을 벗기고 스킨 모드로 가기 전에 끼고 있던 아이템을 다시 끼운다
      let config = withItem(draft, 'costume', undefined)
      for (const [slot, index] of Object.entries(stashedItems) as [ItemSlot, number][]) config = withItem(config, slot, index)
      update(config)
    } else {
      // 마지막으로 고른 스킨(없으면 처음 산 스킨)을 바로 입혀 본다
      const skin = lastSkin ?? ownedSkins[0]?.index
      if (skin != null) applySkin(skin)
    }
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
          <div className="avatar-preview">
            <PixelAvatar config={draft} size={192} alt="내 캐릭터 미리보기" />
          </div>
          <button
            type="button"
            className="btn-ghost avatar-small-btn"
            disabled={!saved || avatarKey(saved) === avatarKey(draft)}
            onClick={() => {
              if (!saved) return
              update(saved)
              setMode(saved.costume != null ? 'skin' : 'basic')
            }}
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
          <div className="avatar-tabs avatar-mode-tabs" role="tablist" aria-label="꾸미기 모드">
            {([['basic', '기본 모드'], ['skin', '스킨 모드']] as [Mode, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                className={`avatar-tab${mode === id ? ' active' : ''}`}
                onClick={() => changeMode(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'skin' ? (
            <div className="avatar-option-group">
              <div className="avatar-option-label">
                스킨<span className="avatar-option-hint"> · 스킨을 끼면 무기·모자·망토는 같이 못 껴요</span>
              </div>
              {ownedSkins.length === 0 ? (
                <Link href="/shop" className="avatar-shop-login">쌀포인트 상점에서 스킨을 구매하면 여기서 바꿔 낄 수 있어요</Link>
              ) : (
                <div className="avatar-style-grid">
                  {ownedSkins.map(item => {
                    const selected = draft.costume === item.index
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`avatar-style-option${selected ? ' selected' : ''}`}
                        aria-pressed={selected}
                        onClick={() => applySkin(item.index)}
                      >
                        <PixelAvatar config={withItem(draft, 'costume', item.index)} size={64} />
                        <span>{item.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (<>
          <div className="avatar-option-group">
            <div className="avatar-option-label">
              성별{!hasSaved && <span className="avatar-option-hint"> · 먼저 골라 주세요</span>}
            </div>
            <div className="avatar-gender-grid">
              {genderOptions.map(g => {
                const selected = draft.gender === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`avatar-style-option avatar-gender-option${selected ? ' selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => update(g.config)}
                  >
                    <PixelAvatar config={g.config} size={72} />
                    <span>{g.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="avatar-tabs" role="tablist">
            {[...TABS, { id: ITEMS_TAB_ID, label: '아이템' }].map(t => (
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

          {tabId === ITEMS_TAB_ID && (
            <div className="avatar-option-group">
              <div className="avatar-option-label">
                내 아이템<span className="avatar-option-hint"> · 한 번 더 누르면 벗어요</span>
              </div>
              {ownedItems.length === 0 ? (
                <Link href="/shop" className="avatar-shop-login">쌀포인트 상점에서 아이템을 구매하면 여기서 끼고 벗을 수 있어요</Link>
              ) : (
                <div className="avatar-style-grid">
                  {ownedItems.map(item => {
                    const slot = item.slot as ItemSlot
                    const selected = draft[slot] === item.index
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`avatar-style-option${selected ? ' selected' : ''}`}
                        aria-pressed={selected}
                        onClick={() => {
                          const next = withItem(draft, slot, selected ? undefined : item.index)
                          update(next)
                          setStashedItems(pickItems(next))
                        }}
                      >
                        <PixelAvatar config={withItem(draft, slot, item.index)} size={64} />
                        <span>{item.name} · {ITEM_SLOT_LABELS[slot]}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab?.style && (
            <div className="avatar-option-group">
              <div className="avatar-option-label">스타일</div>
              <div className="avatar-style-grid">
                {styleOptions.map(opt => {
                  const selected = draft[tab.style!.key] === opt.i
                  return (
                    <button
                      key={`${draft.gender}-${opt.i}`}
                      type="button"
                      className={`avatar-style-option${selected ? ' selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() => update({ ...draft, [tab.style!.key]: opt.i })}
                    >
                      <PixelAvatar config={opt.config} size={64} />
                      <span>{opt.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {tab && <div className="avatar-option-group">
            <div className="avatar-option-label">{tab.color.label}</div>
            <div className="avatar-swatches">
              {tab.color.swatches.map((sw, i) => {
                const selected = draft[tab.color.key] === i
                return (
                  <button
                    key={sw.name}
                    type="button"
                    title={sw.name}
                    aria-label={sw.name}
                    aria-pressed={selected}
                    className={`avatar-swatch${selected ? ' selected' : ''}`}
                    style={{ background: sw.color }}
                    onClick={() => update({ ...draft, [tab.color.key]: i })}
                  />
                )
              })}
            </div>
          </div>}
          </>)}
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
