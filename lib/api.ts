import type { AvatarConfig } from './avatar/compose'

// 지정이 없으면(로컬 개발) 지금 접속한 주소의 8000번 백엔드로 보낸다.
// 그래서 같은 와이파이의 다른 기기가 http://<맥북 IP>:3000 으로 열어도 IP를 따로 적지 않아도 된다.
export const API_URL = process.env.NEXT_PUBLIC_API_URL
  || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = data?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
        : '요청 처리 중 오류가 발생했습니다.'
    throw new ApiError(res.status, message)
  }

  return data as T
}

export interface SignupPayload {
  login_id: string
  nickname: string
  email: string
  password: string
  identity_verification_id: string  // 포트원 본인인증 ID — 전화번호는 서버가 포트원에서 직접 가져온다
}

export interface SignupResponse {
  user_id: number
  login_id: string
  nickname: string
  email: string
}

export interface LoginPayload {
  login_id: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  is_admin: boolean
}

export interface RefreshResponse {
  access_token: string
  token_type: string
  is_admin: boolean
}

export function signup(payload: SignupPayload) {
  return request<SignupResponse>('/users/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface IdentityVerifyResponse {
  name: string | null
  phone: string
}

// 포트원 본인인증을 마친 뒤 서버에서 결과를 확인한다 (이미 가입된 번호면 에러)
export function verifyIdentity(identityVerificationId: string) {
  return request<IdentityVerifyResponse>('/users/identity-verification', {
    method: 'POST',
    body: JSON.stringify({ identity_verification_id: identityVerificationId }),
  })
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function refreshAccessToken(refreshToken: string) {
  return request<RefreshResponse>('/users/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export type DuplCheckField = 'login_id' | 'nickname' | 'email'

export interface DuplCheckResponse {
  available: boolean
  message: string
}

export function checkDuplicate(field: DuplCheckField, value: string) {
  return request<DuplCheckResponse>('/users/duplCheck', {
    method: 'POST',
    body: JSON.stringify({ field, value }),
  })
}

export function verifyAdmin(token: string) {
  return request<{ is_admin: boolean }>('/admin/verify', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface PointsResponse {
  ssal_point: number
  // 쌀 응모권 — 대회·이벤트 보상으로만 받는 무료 응모권(낙첨돼도 쌀포인트 환급 없음, 돈으로는 못 삼)
  // TODO(backend): 아직 운영 서버에 없음 — 생기기 전까지는 0장으로 표시
  ssal_ticket?: number
}

export function getMyPoints(token: string) {
  return request<PointsResponse>('/points/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface MyProfileResponse {
  user_id: number
  login_id: string
  nickname: string
  email: string
  avatar_url: string | null
  avatar_config: AvatarConfig | null
  trade_count: number
}

export function getMyProfile(token: string) {
  return request<MyProfileResponse>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function updateMyAvatar(token: string, config: AvatarConfig) {
  return request<MyProfileResponse>('/users/me/avatar', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(config),
  })
}

export interface AvatarItemResponse {
  item_id: string
  name: string
  price: number // 쌀포인트
  slot: 'weapon' | 'hat' | 'cape' | 'costume'
  index: number
}

export interface AvatarItemPurchaseResponse {
  item_id: string
  points_spent: number
  remaining_ssal_point: number
}

export function getAvatarItems() {
  return request<AvatarItemResponse[]>('/avatar-items')
}

// 내가 보유한 아바타 아이템 id 목록
export function getMyAvatarItems(token: string) {
  return request<string[]>('/avatar-items/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function purchaseAvatarItem(token: string, itemId: string) {
  return request<AvatarItemPurchaseResponse>(`/avatar-items/${itemId}/purchase`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface RaffleProductResponse {
  raffle_product_id: number
  product_name: string
  description: string | null
  price_krw: number
  ticket_price: number
  total_slots: number
  sold_slots: number
  image_url: string | null
  status: 'open' | 'completed' | 'cancelled'
  starts_at: string
  ends_at: string
  drawn_at: string | null
  winner_entry_number: number | null
  winner_user_id: number | null
  remaining_seconds: number
  is_open: boolean
  remaining_slots: number
  // 응모권이 매진된 시각(UTC) — 이 시각 + 1분에 서버가 자동 추첨한다
  sold_out_at: string | null
}

export function getRaffleProducts(status?: 'open' | 'completed' | 'cancelled') {
  const query = status ? `?status=${status}` : ''
  return request<RaffleProductResponse[]>(`/raffles${query}`)
}

export function getRaffleProduct(raffleProductId: number) {
  return request<RaffleProductResponse>(`/raffles/${raffleProductId}`)
}

// 번개 추첨 화면에 세울 응모자 — 응모 번호와 캐릭터 착장(저장 안 한 사람은 null)
export interface RaffleCastMember {
  entry_number: number
  ticket_count: number
  avatar_config: AvatarConfig | null
  nickname: string | null
}

export interface RaffleDrawCastResponse {
  raffle_product_id: number
  sold_out_at: string | null
  draw_at: string | null
  winner_entry_number: number | null
  cast: RaffleCastMember[]
}

export function getRaffleDrawCast(token: string, raffleProductId: number) {
  return request<RaffleDrawCastResponse>(`/raffles/${raffleProductId}/draw-cast`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface RaffleEntryResponse {
  entry_id: number
  raffle_product_id: number
  ticket_count: number
  amount_paid: number  // 결제 금액(원)
  created_at: string
  entry_number: number
}

export interface RaffleEntryCreateResponse extends RaffleEntryResponse {
  total_ticket_count: number
}

export function getMyRaffleEntriesForProduct(token: string, raffleProductId: number) {
  return request<RaffleEntryResponse[]>(`/raffles/${raffleProductId}/entries/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface MyRaffleEntryResponse {
  entry_id: number
  raffle_product_id: number
  ticket_count: number
  amount_paid: number  // 결제 금액(원)
  entry_number: number
  created_at: string
  product_name: string
  image_url: string | null
  price_krw: number
  status: 'open' | 'completed' | 'cancelled'
  ends_at: string
  sold_out_at: string | null
  winner_entry_number: number | null
}

export function getMyRaffleEntries(token: string) {
  return request<MyRaffleEntryResponse[]>('/raffles/entries/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface CreateRaffleProductPayload {
  product_name: string
  description?: string
  price_krw: number
  image: File
  duration_days: number
}

export interface StoreProductResponse {
  store_product_id: number
  product_name: string
  description: string | null
  pay_type: StorePayType
  price: number
  stock: number
  image_url: string | null
  created_at: string
  // 상점 세부 탭 분류 — 결제 상점: figure | goods | card / 쌀포인트 상점: coupon | goods | avatar
  // 분류 도입 전에 등록된 상품은 null
  category: StoreCategory | null
}

export type StoreCategory = 'figure' | 'goods' | 'card' | 'coupon' | 'avatar'
// cash: 카드 결제(원) 상품, ssal: 쌀포인트 상품
export type StorePayType = 'cash' | 'ssal'

// 상점별 분류 — 상점 세부 탭과 관리자 상품 등록 폼이 같이 쓴다
export const STORE_CATEGORIES: Record<StorePayType, { id: StoreCategory; label: string }[]> = {
  cash: [
    { id: 'figure', label: '피규어' },
    { id: 'goods', label: '굿즈' },
    { id: 'card', label: '카드' },
  ],
  ssal: [
    { id: 'coupon', label: '쿠폰' },
    { id: 'goods', label: '굿즈' },
    { id: 'avatar', label: '아바타' },
  ],
}

export function getStoreProducts(payType?: StorePayType) {
  const query = payType ? `?pay_type=${payType}` : ''
  return request<StoreProductResponse[]>(`/store-products${query}`)
}

export function getStoreProduct(storeProductId: number) {
  return request<StoreProductResponse>(`/store-products/${storeProductId}`)
}

export interface StorePurchaseResponse {
  storage_item_id: number
  store_product_id: number
  quantity: number
  amount_spent: number
  pay_type: StorePayType
  remaining_stock: number
}

// 쌀포인트 상품 구매 (결제 상점 상품은 lib/payment.ts의 카드 결제로 산다)
export function purchaseStoreProduct(token: string, storeProductId: number, quantity: number) {
  return request<StorePurchaseResponse>(`/store-products/${storeProductId}/purchase`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ quantity }),
  })
}

export interface StorageItemResponse {
  storage_item_id: number
  source: 'raffle' | 'store' | 'kuji'
  raffle_product_id: number | null
  store_product_id: number | null
  kuji_set_id: number | null
  kuji_prize_id: number | null
  product_name: string
  image_url: string | null
  quantity: number
  price_krw: number | null
  pay_type: StorePayType | null
  amount_spent: number | null  // 결제 상점·쿠지는 원, 쌀포인트 상점은 쌀포인트
  status: 'ready' | 'requested' | 'shipped'
  address_id: number | null
  requested_at: string | null
  created_at: string
  // TODO(backend): 발송 처리 때 저장 — 아직 서버가 안 내려주면 undefined
  carrier?: string | null
  tracking_number?: string | null
  shipped_at?: string | null
}

export function getMyStorage(token: string) {
  return request<StorageItemResponse[]>('/storage/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function requestShipping(token: string, storageItemIds: number[], addressId: number) {
  return request<StorageItemResponse[]>('/storage/ship', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ storage_item_ids: storageItemIds, address_id: addressId }),
  })
}

// 관리자 배송 관리 — 배송 신청된 보관함 상품 + 누가 · 어디로
// TODO(backend): GET /storage/admin?status=, POST /storage/admin/ship 아직 없음 (lib/adminShipping.ts가 그때까지 가짜 데이터를 쓴다)
export interface AdminShippingItemResponse extends StorageItemResponse {
  user_id: number
  nickname: string
  address: Pick<AddressResponse, 'recipient' | 'phone' | 'zip_code' | 'address1' | 'address2'> | null
}

export function getAdminShippingItems(token: string, status: 'requested' | 'shipped') {
  return request<AdminShippingItemResponse[]>(`/storage/admin?status=${status}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// 같은 박스로 보낸 상품들에 택배사 · 송장번호를 넣고 발송 완료로 바꾼다
export function markItemsShipped(token: string, storageItemIds: number[], carrier: string, trackingNumber: string) {
  return request<AdminShippingItemResponse[]>('/storage/admin/ship', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ storage_item_ids: storageItemIds, carrier, tracking_number: trackingNumber }),
  })
}

export interface AddressResponse {
  address_id: number
  label: string
  recipient: string
  phone: string
  zip_code: string | null
  address1: string
  address2: string | null
  is_default: boolean
  created_at: string
}

export interface CreateAddressPayload {
  label?: string
  recipient: string
  phone: string
  zip_code?: string
  address1: string
  address2?: string
  is_default?: boolean
}

export function getMyAddresses(token: string) {
  return request<AddressResponse[]>('/addresses/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createAddress(token: string, payload: CreateAddressPayload) {
  return request<AddressResponse>('/addresses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export interface AddressSearchItem {
  zip_code: string
  road_address: string
  jibun_address: string
  building_name: string
}

export interface AddressSearchResponse {
  total: number
  page: number
  items: AddressSearchItem[]
}

export function searchAddress(token: string, keyword: string, page = 1) {
  const query = new URLSearchParams({ keyword, page: String(page) })
  return request<AddressSearchResponse>(`/addresses/search?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface CreateStoreProductPayload {
  product_name: string
  description?: string
  pay_type: StorePayType
  price: number
  stock: number
  category: StoreCategory
  image?: File
}

export async function createStoreProduct(token: string, payload: CreateStoreProductPayload) {
  const formData = new FormData()
  formData.append('product_name', payload.product_name)
  if (payload.description) formData.append('description', payload.description)
  formData.append('pay_type', payload.pay_type)
  formData.append('price', String(payload.price))
  formData.append('stock', String(payload.stock))
  formData.append('category', payload.category)
  if (payload.image) formData.append('image', payload.image)

  const res = await fetch(`${API_URL}/store-products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = data?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
        : '요청 처리 중 오류가 발생했습니다.'
    throw new ApiError(res.status, message)
  }

  return data as StoreProductResponse
}

export interface KujiPrizeResponse {
  kuji_prize_id: number
  tier: 'upper' | 'lower'
  grade: string
  name: string
  image_url: string | null
  quantity: number
  remaining_quantity: number
}

export interface KujiSetResponse {
  kuji_set_id: number
  title: string
  description: string | null
  image_url: string | null
  ticket_price: number
  total_tickets: number
  remaining_tickets: number
  status: 'open' | 'sold_out' | 'closed'
  prizes: KujiPrizeResponse[]
  last_one_name: string | null
  last_one_image_url: string | null
  created_at: string
  // 마지막 제비가 나간 시각(UTC) — 이 시각부터 하루 동안만 목록에 매진 카드로 남긴다
  // TODO(backend): 아직 안 내려줌. 없으면 매진 카드가 계속 남아 있다
  sold_out_at?: string | null
}

// 관리자용 — 원가·예상 매출 포함
export interface KujiSetAdminResponse extends KujiSetResponse {
  prizes: (KujiPrizeResponse & { cost: number })[]
  last_one_cost: number | null
  total_cost: number
  expected_revenue: number
}

export interface CreateKujiPrize {
  tier: 'upper' | 'lower'
  name: string
  quantity: number
  cost: number
  image?: Blob
}

export interface CreateKujiSetPayload {
  title: string
  description?: string
  ticket_price: number
  image: Blob
  prizes: CreateKujiPrize[]
  last_one?: { name: string; cost: number; image?: Blob }
}

export interface KujiBoardResponse {
  kuji_set_id: number
  version: number
  total_tickets: number
  remaining_tickets: number
  drawn: { ticket_number: number; grade: string }[]
}

export interface KujiDrawResponse {
  ok: boolean
  drawn: { ticket_number: number; kuji_prize_id: number; grade: string; tier: 'upper' | 'lower'; name: string; image_url: string | null }[]
  last_one: { name: string; image_url: string | null } | null
  amount_paid: number  // 결제 금액(원)
  conflict_ticket_numbers: number[]
  board: KujiBoardResponse
}

export function getKujiSets(status?: KujiSetResponse['status']) {
  return request<KujiSetResponse[]>(`/kuji${status ? `?status=${status}` : ''}`)
}

export function getKujiSet(kujiSetId: number) {
  return request<KujiSetResponse>(`/kuji/${kujiSetId}`)
}

// since가 서버의 최신 버전과 같으면 바뀐 게 없어서 null
export function getKujiBoard(kujiSetId: number, since?: number) {
  return request<KujiBoardResponse | null>(`/kuji/${kujiSetId}/board${since != null ? `?since=${since}` : ''}`)
}


export function getKujiSetsAdmin(token: string) {
  return request<KujiSetAdminResponse[]>('/kuji/admin', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// 쿠지 한 판 등록 — 상품 사진은 prize_images로 모아 보내고 각 상품의 image_index로 가리킨다
export async function createKujiSet(token: string, payload: CreateKujiSetPayload) {
  const formData = new FormData()
  formData.append('title', payload.title)
  if (payload.description) formData.append('description', payload.description)
  formData.append('ticket_price', String(payload.ticket_price))
  formData.append('image', payload.image)
  let imageCount = 0
  const prizes = payload.prizes.map(({ image, ...prize }) => {
    if (!image) return prize
    formData.append('prize_images', image)
    return { ...prize, image_index: imageCount++ }
  })
  formData.append('prizes', JSON.stringify(prizes))
  if (payload.last_one) {
    formData.append('last_one_name', payload.last_one.name)
    formData.append('last_one_cost', String(payload.last_one.cost))
    if (payload.last_one.image) formData.append('last_one_image', payload.last_one.image)
  }

  const res = await fetch(`${API_URL}/kuji`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = data?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
        : '요청 처리 중 오류가 발생했습니다.'
    throw new ApiError(res.status, message)
  }

  return data as KujiSetAdminResponse
}

export async function createRaffleProduct(token: string, payload: CreateRaffleProductPayload) {
  const formData = new FormData()
  formData.append('product_name', payload.product_name)
  if (payload.description) formData.append('description', payload.description)
  formData.append('price_krw', String(payload.price_krw))
  formData.append('image', payload.image)
  formData.append('duration_days', String(payload.duration_days))

  const res = await fetch(`${API_URL}/raffles`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = data?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
        : '요청 처리 중 오류가 발생했습니다.'
    throw new ApiError(res.status, message)
  }

  return data as RaffleProductResponse
}

// ── 카드 결제 (포트원) — 응모권 · 쿠지 제비 · 결제 상점 상품 ──
export type PaymentOrder =
  | { order_type: 'raffle_entry'; target_id: number; quantity: number }
  | { order_type: 'kuji_draw'; target_id: number; ticket_numbers: number[] }
  | { order_type: 'store_purchase'; target_id: number; quantity: number }

export interface PaymentPrepareResponse {
  // 없으면 결제창을 열지 않는다 — 쿠지에서 고른 제비가 이미 나간 경우
  payment_id: string | null
  order_name: string
  amount: number
  customer: { full_name: string; phone_number: string; email: string } | null
  conflict_ticket_numbers: number[]
}

export interface PaymentCompleteResponse {
  payment_id: string
  order_type: PaymentOrder['order_type']
  // cancelled: 결제 후 지급할 수 없어 결제를 자동 취소함(message에 이유), pending: 아직 결제 확인 전
  status: 'paid' | 'pending' | 'failed' | 'cancelled'
  message: string | null
  raffle_entry: RaffleEntryCreateResponse | null
  kuji_draw: KujiDrawResponse | null
  store_purchase: StorePurchaseResponse | null
}

export function preparePayment(token: string, order: PaymentOrder) {
  return request<PaymentPrepareResponse>('/payments/prepare', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(order),
  })
}

export function completePayment(token: string, paymentId: string) {
  return request<PaymentCompleteResponse>(`/payments/${encodeURIComponent(paymentId)}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}
