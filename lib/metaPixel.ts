// 메타 픽셀 — 광고 성과 측정 (브라우저만, 서버 전송(전환 API)은 하지 않는다). 개인정보처리방침 제4조
//  - 광고 측정을 거부하면(푸터 "광고 측정 설정", 브라우저 GPC·DNT) 픽셀을 불러오지 않는다
//  - Purchase는 eventID = payment_id — 나중에 전환 API를 붙이면 서버도 같은 값을 써야 Meta가 한 건으로 센다
//  - 이름·이메일·휴대전화번호·회원 ID는 보내지 않는다
import type { PaymentCompleteResponse } from './api'

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''
const OPT_OUT_KEY = 'ad-measurement-optout'
export const AD_MEASUREMENT_CHANGED_EVENT = 'ad-measurement-changed'
const PURCHASE_SENT_KEY = 'meta-purchase-sent'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] }
declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
  interface Navigator {
    globalPrivacyControl?: boolean
  }
}

// 브라우저 자체의 추적 거부 신호 — 켜져 있으면 사이트 설정과 상관없이 측정하지 않는다
export function browserRefusesTracking(): boolean {
  if (typeof navigator === 'undefined') return false
  const dnt = navigator.doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack
  return navigator.globalPrivacyControl === true || dnt === '1' || dnt === 'yes'
}

export function siteOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function trackingAllowed(): boolean {
  return typeof window !== 'undefined' && !!META_PIXEL_ID && !siteOptedOut() && !browserRefusesTracking()
}

export function setSiteOptOut(optOut: boolean) {
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, '1')
    else localStorage.removeItem(OPT_OUT_KEY)
  } catch {}
  // 이미 불러온 픽셀은 바로 멈춘다 (다시 켜면 MetaPixel 컴포넌트가 다시 시작한다)
  if (optOut) window.fbq?.('consent', 'revoke')
  window.dispatchEvent(new Event(AD_MEASUREMENT_CHANGED_EVENT))
}

// 픽셀 기본 코드 (Meta 제공 스니펫과 같은 동작)
export function loadPixel() {
  if (window.fbq) {
    window.fbq('consent', 'grant')
    return
  }
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) (fbq.callMethod as (...a: unknown[]) => void).apply(fbq, args)
    else fbq.queue!.push(args)
  }
  Object.assign(fbq, { push: fbq, loaded: true, version: '2.0', queue: [] })
  window.fbq = fbq
  window._fbq = fbq
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
  fbq('init', META_PIXEL_ID)
}

export function trackPixel(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (!trackingAllowed() || !window.fbq) return
  if (eventId) window.fbq('track', event, params ?? {}, { eventID: eventId })
  else window.fbq('track', event, params ?? {})
}

// 상품 구분 — store-21, raffle-3, kuji-5
export const contentId = (kind: 'store' | 'raffle' | 'kuji', id: number) => `${kind}-${id}`

export function trackViewContent(kind: 'store' | 'raffle' | 'kuji', id: number, name: string, value: number) {
  trackPixel('ViewContent', { content_ids: [contentId(kind, id)], content_type: 'product', content_name: name, value, currency: 'KRW' })
}

const PURCHASE_KIND: Partial<Record<PaymentCompleteResponse['order_type'], 'store' | 'raffle' | 'kuji'>> = {
  raffle_entry: 'raffle',
  store_funding: 'store',
  store_purchase: 'store',
  kuji_draw: 'kuji',
}

// 결제 완료 — 배송비는 구매로 세지 않는다. 같은 결제를 두 번 보내지 않게 기억해 둔다
export function trackPurchase(res: PaymentCompleteResponse) {
  const kind = PURCHASE_KIND[res.order_type]
  if (res.status !== 'paid' || !kind) return
  try {
    const sent = JSON.parse(sessionStorage.getItem(PURCHASE_SENT_KEY) || '[]') as string[]
    if (sent.includes(res.payment_id)) return
    sessionStorage.setItem(PURCHASE_SENT_KEY, JSON.stringify([...sent, res.payment_id].slice(-20)))
  } catch {}
  trackPixel(
    'Purchase',
    { value: res.amount, currency: 'KRW', content_ids: [contentId(kind, res.target_id)], content_type: 'product', num_items: res.quantity },
    res.payment_id,
  )
}
