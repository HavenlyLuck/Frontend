import * as PortOne from '@portone/browser-sdk/v2'
import { preparePayment, completePayment, PaymentOrder, PaymentCompleteResponse } from './api'

// 포트원 콘솔 > 결제 연동 > 연동 정보 의 상점 아이디와 결제 채널 키 (KG이니시스)
const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? ''
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_PAYMENT_CHANNEL_KEY ?? ''

// 결제창에서 사용자가 닫았거나 카드사가 거절한 경우
export class PaymentWindowError extends Error {}

export type PayResult =
  | PaymentCompleteResponse
  // 쿠지 — 결제창을 열기 전에 고른 제비가 이미 나간 걸 알았다
  | { status: 'conflict'; conflict_ticket_numbers: number[] }

// 카드 결제 → 서버 확인까지. 금액은 서버가 정하고, 서버가 포트원에 결제를 직접 확인한 뒤 지급한다.
// PC는 결제 팝업이 끝나면 여기서 결과를 돌려준다.
// 모바일은 결제창이 페이지를 이동시켰다가 /payment/complete 로 돌아오고, 그 페이지가 마무리한다.
export async function payWithCard(token: string, order: PaymentOrder): Promise<PayResult> {
  if (!STORE_ID || !CHANNEL_KEY) {
    throw new PaymentWindowError('결제 설정이 되어있지 않습니다. 관리자에게 문의해주세요.')
  }
  const prepared = await preparePayment(token, order)
  if (!prepared.payment_id) {
    return { status: 'conflict', conflict_ticket_numbers: prepared.conflict_ticket_numbers }
  }

  const back = `${window.location.pathname}${window.location.search}`
  const res = await PortOne.requestPayment({
    storeId: STORE_ID,
    channelKey: CHANNEL_KEY,
    paymentId: prepared.payment_id,
    orderName: prepared.order_name,
    totalAmount: prepared.amount,
    currency: 'KRW',
    payMethod: 'CARD',
    // KG이니시스 PC 결제는 구매자 이름·전화번호·이메일이 필수
    customer: prepared.customer
      ? {
          fullName: prepared.customer.full_name,
          phoneNumber: prepared.customer.phone_number,
          email: prepared.customer.email,
        }
      : undefined,
    redirectUrl: `${window.location.origin}/payment/complete?next=${encodeURIComponent(back)}`,
  })
  if (!res || res.code !== undefined) {
    throw new PaymentWindowError(res?.message || '결제가 취소되었습니다.')
  }
  return completePayment(token, prepared.payment_id)
}

// 결제는 됐지만 지급하지 못해 자동 취소된 경우 등 — 사용자에게 보여줄 문구
export function paymentFailureMessage(res: PaymentCompleteResponse): string {
  if (res.status === 'cancelled') return `${res.message ?? '주문을 처리하지 못했습니다.'}\n결제 금액은 카드로 자동 환불됩니다.`
  if (res.status === 'pending') return '결제 확인이 늦어지고 있어요. 잠시 후 마이페이지에서 확인해주세요.'
  return res.message ?? '결제가 완료되지 않았습니다.'
}
