// 후기·문의 API (Backend/app/routers/review.py, inquiry.py)
import { API_URL, ApiError, request } from './api'

export type ReviewProductType = 'raffle' | 'store' | 'kuji'

export type StorePayType = 'cash' | 'ssal'

// 후기 배지 — 상점은 결제 방식으로 일반 상점 / 쌀포인트 상점을 나눈다
export function productBadge(type: ReviewProductType, payType?: StorePayType | null): { label: string; className: string } {
  if (type === 'raffle') return { label: '응모', className: 'eungmo' }
  if (type === 'kuji') return { label: '쿠지', className: 'kuji' }
  return payType === 'ssal' ? { label: '쌀포인트 상점', className: 'ssal' } : { label: '상점', className: 'shop' }
}

export interface ReviewResponse {
  review_id: number
  rating: number
  title: string
  content: string
  image_url: string | null
  product_name: string | null
  product_type: ReviewProductType | null
  pay_type: StorePayType | null
  author: string // 작성자 가입 아이디, 가운데는 * 로 가려서 온다 (ab****g)
  is_mine: boolean
  created_at: string
}

// 후기를 쓸 수 있는 내 보관함 상품 (아직 후기를 안 쓴 것)
export interface ReviewableItem {
  storage_item_id: number
  product_name: string
  product_type: ReviewProductType
  pay_type: StorePayType | null
  image_url: string | null
  created_at: string
}

// 비공개 문의를 남이 보면 title은 "비공개 문의입니다", content·answer는 null
export interface InquiryResponse {
  inquiry_id: number
  title: string
  content: string | null
  is_private: boolean
  answer: string | null
  answered: boolean
  answered_at: string | null
  nickname: string
  is_mine: boolean
  created_at: string
}

const auth = (token?: string | null): HeadersInit => (token ? { Authorization: `Bearer ${token}` } : {})

export function getReviews(token?: string | null) {
  return request<ReviewResponse[]>('/reviews', { headers: auth(token) })
}

export function getReviewableItems(token: string) {
  return request<ReviewableItem[]>('/reviews/reviewable', { headers: auth(token) })
}

export async function createReview(token: string, payload: {
  storage_item_id: number
  rating: number
  title: string
  content: string
  image?: File | null
}): Promise<ReviewResponse> {
  const form = new FormData()
  form.append('storage_item_id', String(payload.storage_item_id))
  form.append('rating', String(payload.rating))
  form.append('title', payload.title)
  form.append('content', payload.content)
  if (payload.image) form.append('image', payload.image)
  // FormData는 Content-Type을 브라우저가 정하게 둬야 해서 request() 대신 fetch를 직접 쓴다
  const res = await fetch(`${API_URL}/reviews`, { method: 'POST', headers: auth(token), body: form })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, typeof data?.detail === 'string' ? data.detail : '후기를 올리지 못했습니다.')
  return data as ReviewResponse
}

export async function deleteReview(token: string, reviewId: number): Promise<void> {
  const res = await fetch(`${API_URL}/reviews/${reviewId}`, { method: 'DELETE', headers: auth(token) })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new ApiError(res.status, typeof data?.detail === 'string' ? data.detail : '후기를 지우지 못했습니다.')
  }
}

export function getInquiries(token?: string | null) {
  return request<InquiryResponse[]>('/inquiries', { headers: auth(token) })
}

export function createInquiry(token: string, payload: { title: string; content: string; is_private: boolean }) {
  return request<InquiryResponse>('/inquiries', { method: 'POST', headers: auth(token), body: JSON.stringify(payload) })
}

export function getAdminInquiries(token: string, answered?: boolean) {
  return request<InquiryResponse[]>(`/inquiries/admin${answered === undefined ? '' : `?answered=${answered}`}`, { headers: auth(token) })
}

export function answerInquiry(token: string, inquiryId: number, answer: string) {
  return request<InquiryResponse>(`/inquiries/${inquiryId}/answer`, { method: 'PUT', headers: auth(token), body: JSON.stringify({ answer }) })
}
