// 합성한 픽셀을 PNG(data URL)로 만들고 캐싱한다.
// 같은 설정은 한 번만 그리고, 메모리 → localStorage 순으로 재사용한다.

import { AVATAR_CANVAS, avatarKey, composeAvatar, type AvatarConfig } from './compose'

// 16px 원본을 정수배로 키워 저장해 두면 어디에 붙여도 흐려지지 않는다
const EXPORT_SCALE = 8
const STORAGE_PREFIX = 'avatar-png:'
const MAX_STORED = 6

const memory = new Map<string, string>()

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key)
  } catch {
    return null
  }
}

function writeStored(key: string, url: string) {
  try {
    // 오래된 캐시를 정리해 저장 공간을 조금만 쓴다
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(STORAGE_PREFIX) && k !== STORAGE_PREFIX + key) keys.push(k)
    }
    keys.slice(0, Math.max(0, keys.length - (MAX_STORED - 1))).forEach(k => localStorage.removeItem(k))
    localStorage.setItem(STORAGE_PREFIX + key, url)
  } catch {
    // 저장 실패는 무시한다(메모리 캐시만 사용)
  }
}

function draw(config: AvatarConfig, background: boolean): string {
  const size = AVATAR_CANVAS
  const src = document.createElement('canvas')
  src.width = size
  src.height = size
  src.getContext('2d')!.putImageData(new ImageData(composeAvatar(config, { background }), size, size), 0, 0)

  const out = document.createElement('canvas')
  out.width = size * EXPORT_SCALE
  out.height = size * EXPORT_SCALE
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(src, 0, 0, out.width, out.height)
  return out.toDataURL('image/png')
}

// persist: 프로필처럼 자주 보이는 이미지만 localStorage에 남긴다(편집 화면의 썸네일은 메모리만).
export function avatarToDataUrl(config: AvatarConfig, { background = true, persist = false } = {}): string {
  const key = `${avatarKey(config)}${background ? '' : '-t'}`
  const cached = memory.get(key) ?? (persist ? readStored(key) : null)
  if (cached) {
    memory.set(key, cached)
    return cached
  }
  const url = draw(config, background)
  memory.set(key, url)
  if (persist) writeStored(key, url)
  return url
}
