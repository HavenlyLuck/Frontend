import * as PortOne from '@portone/browser-sdk/v2'

// 포트원 콘솔 > 결제 연동 > 연동 정보 의 상점 아이디와 본인인증 채널 키
const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? ''
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY ?? ''

export type IdentityVerificationResult =
  | { ok: true; identityVerificationId: string }
  | { ok: false; message: string }

// 모바일은 인증창이 페이지를 이동시켰다가 redirectUrl로 돌아온다(결과는 쿼리스트링).
// PC는 팝업으로 열리고 이 Promise가 결과를 돌려준다.
export async function requestIdentityVerification(redirectUrl: string): Promise<IdentityVerificationResult> {
  if (!STORE_ID || !CHANNEL_KEY) {
    return { ok: false, message: '본인인증 설정이 되어있지 않습니다. 관리자에게 문의해주세요.' }
  }
  // KCP는 인증 ID에 영문·숫자만, 40자 이하만 허용한다 → 'iv' + 하이픈 뺀 UUID(32자)
  const identityVerificationId = `iv${crypto.randomUUID().replace(/-/g, '')}`
  const res = await PortOne.requestIdentityVerification({
    storeId: STORE_ID,
    channelKey: CHANNEL_KEY,
    identityVerificationId,
    redirectUrl,
  })
  return toResult(res?.identityVerificationId ?? identityVerificationId, res?.code, res?.message)
}

// 모바일 리다이렉트로 돌아온 경우 쿼리스트링에서 결과를 꺼낸다. 본인인증 복귀가 아니면 null
export function readIdentityVerificationRedirect(search: string): IdentityVerificationResult | null {
  const params = new URLSearchParams(search)
  const identityVerificationId = params.get('identityVerificationId')
  if (!identityVerificationId) return null
  return toResult(identityVerificationId, params.get('code') ?? undefined, params.get('message') ?? undefined)
}

function toResult(identityVerificationId: string, code?: string, message?: string): IdentityVerificationResult {
  if (code === undefined) return { ok: true, identityVerificationId }
  return { ok: false, message: message || '본인인증에 실패했습니다.' }
}
