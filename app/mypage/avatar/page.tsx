'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowCounterClockwiseIcon, CheckIcon, PaintBrushIcon } from '@phosphor-icons/react'
import PixelAvatar from '@/components/PixelAvatar'
import { getValidSession } from '@/lib/auth'
import { getMyProfile, updateMyAvatar, ApiError } from '@/lib/api'
import {
  DEFAULT_AVATAR, avatarKey, normalizeAvatar,
  type AvatarConfig, type AvatarNumberKey,
} from '@/lib/avatar/compose'
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
        })
        .catch(() => {
          if (!cancelled) setSaved(DEFAULT_AVATAR)
        })
    })
    return () => { cancelled = true }
  }, [])

  const tab = TABS.find(t => t.id === tabId)!
  // 아직 한 번도 저장하지 않았으면 기본 캐릭터 그대로라도 저장할 수 있게 한다
  const dirty = saved !== null && (!hasSaved || avatarKey(saved) !== avatarKey(draft))

  // 스타일 썸네일은 지금 고른 다른 값들을 그대로 두고 해당 항목만 바꿔서 보여준다
  const styleOptions = useMemo(() => {
    if (!tab.style) return []
    const key = tab.style.key
    return tab.style.parts(draft.gender).map((part, i) => ({ name: part.name, i, config: { ...draft, [key]: i } as AvatarConfig }))
  }, [tab, draft])

  const genderOptions = useMemo(
    () => GENDERS.map(g => ({ ...g, config: withGender(draft, g.id) })),
    [draft],
  )

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
          <div className="avatar-preview">
            <PixelAvatar config={draft} size={192} alt="내 캐릭터 미리보기" />
          </div>
          <button
            type="button"
            className="btn-ghost avatar-small-btn"
            disabled={!saved || avatarKey(saved) === avatarKey(draft)}
            onClick={() => { if (saved) update(saved) }}
          >
            <ArrowCounterClockwiseIcon size={16} weight="bold" /> 되돌리기
          </button>
          <button type="button" className="btn-primary avatar-save-btn" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? '저장 중...' : <><CheckIcon size={16} weight="bold" /> 저장하기</>}
          </button>
          {message && (
            <div className="avatar-message" style={{ color: message.ok ? 'var(--success)' : 'var(--danger)' }}>{message.text}</div>
          )}
        </div>

        <div className="avatar-options-card">
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

          {tab.style && (
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

          <div className="avatar-option-group">
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
          </div>
        </div>
      </div>
    </>
  )
}
