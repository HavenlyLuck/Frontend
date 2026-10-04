export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
  phone: string
  phone_verified_at: string
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
  woon_point: number
  ssal_point: number
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
  trade_count: number
}

export function getMyProfile(token: string) {
  return request<MyProfileResponse>('/users/me', {
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
  draw_video_url: string | null
  remaining_seconds: number
  is_open: boolean
  remaining_slots: number
  // TODO(backend): 아직 운영 서버에 없음 — 매진된 시각(UTC). 생기면 추첨 5분 타이머가 이 값 기준으로 정확해진다
  sold_out_at?: string | null
}

export function getRaffleProducts(status?: 'open' | 'completed' | 'cancelled') {
  const query = status ? `?status=${status}` : ''
  return request<RaffleProductResponse[]>(`/raffles${query}`)
}

export function getRaffleProduct(raffleProductId: number) {
  return request<RaffleProductResponse>(`/raffles/${raffleProductId}`)
}

export function getPendingDrawProducts(token: string) {
  return request<RaffleProductResponse[]>('/raffles/pending-draw', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface RaffleEntrantResponse {
  entry_number: number
  ticket_count: number
}

export function getRaffleEntrants(token: string, raffleProductId: number) {
  return request<RaffleEntrantResponse[]>(`/raffles/${raffleProductId}/entrants`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function drawRaffleWinner(token: string, raffleProductId: number, winnerEntryNumber: number, video: Blob) {
  const formData = new FormData()
  formData.append('winner_entry_number', String(winnerEntryNumber))
  formData.append('video', video, 'draw.webm')

  const res = await fetch(`${API_URL}/raffles/${raffleProductId}/draw`, {
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

export interface RaffleEntryResponse {
  entry_id: number
  raffle_product_id: number
  ticket_count: number
  points_spent: number
  created_at: string
  entry_number: number
}

export interface RaffleEntryCreateResponse extends RaffleEntryResponse {
  total_ticket_count: number
}

export function createRaffleEntry(token: string, raffleProductId: number, ticketCount: number) {
  return request<RaffleEntryCreateResponse>(`/raffles/${raffleProductId}/entries`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ticket_count: ticketCount }),
  })
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
  points_spent: number
  entry_number: number
  created_at: string
  product_name: string
  image_url: string | null
  price_krw: number
  status: 'open' | 'completed' | 'cancelled'
  ends_at: string
  winner_entry_number: number | null
  draw_video_url: string | null
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
  point_type: 'woon' | 'ssal'
  price: number
  stock: number
  image_url: string | null
  created_at: string
}

export function getStoreProducts(pointType?: 'woon' | 'ssal') {
  const query = pointType ? `?point_type=${pointType}` : ''
  return request<StoreProductResponse[]>(`/store-products${query}`)
}

export function getStoreProduct(storeProductId: number) {
  return request<StoreProductResponse>(`/store-products/${storeProductId}`)
}

export interface StorePurchaseResponse {
  storage_item_id: number
  store_product_id: number
  quantity: number
  points_spent: number
  point_type: 'woon' | 'ssal'
  remaining_stock: number
}

export function purchaseStoreProduct(token: string, storeProductId: number, quantity: number) {
  return request<StorePurchaseResponse>(`/store-products/${storeProductId}/purchase`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ quantity }),
  })
}

export interface StorageItemResponse {
  storage_item_id: number
  source: 'raffle' | 'store'
  raffle_product_id: number | null
  store_product_id: number | null
  product_name: string
  image_url: string | null
  quantity: number
  price_krw: number | null
  point_type: 'woon' | 'ssal' | null
  points_spent: number | null
  status: 'ready' | 'requested' | 'shipped'
  address_id: number | null
  requested_at: string | null
  created_at: string
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

export interface CreateStoreProductPayload {
  product_name: string
  description?: string
  point_type: 'woon' | 'ssal'
  price: number
  stock: number
  image?: File
}

export async function createStoreProduct(token: string, payload: CreateStoreProductPayload) {
  const formData = new FormData()
  formData.append('product_name', payload.product_name)
  if (payload.description) formData.append('description', payload.description)
  formData.append('point_type', payload.point_type)
  formData.append('price', String(payload.price))
  formData.append('stock', String(payload.stock))
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
