import type { AvatarConfig } from './compose'

// 캐릭터를 저장하면 이 이벤트로 알려서 사이드바 프로필 등 다른 화면이 바로 갱신되게 한다.
export const AVATAR_UPDATED_EVENT = 'avatar-updated'

export function notifyAvatarUpdated(config: AvatarConfig) {
  window.dispatchEvent(new CustomEvent<AvatarConfig>(AVATAR_UPDATED_EVENT, { detail: config }))
}
