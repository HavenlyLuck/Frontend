// 찜한 상품 — 일반(결제) 상점 상품과 응모 상품을 찜할 수 있고, 회원별로 서버에 저장된다
import { request } from '@/lib/api'
import { contentId, trackPixel } from '@/lib/metaPixel'
import type { RaffleProductResponse, StorePayType } from '@/lib/api'

export interface WishlistItem {
  store_product_id: number
  product_name: string
  image_url: string | null
  pay_type: StorePayType
  price: number
  stock: number
  wished_at: string | null
}

export function getMyWishlist(token: string) {
  return request<WishlistItem[]>('/wishlist/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function addToWishlist(token: string, storeProductId: number) {
  await request<null>(`/wishlist/${storeProductId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  trackPixel('AddToWishlist', { content_ids: [contentId('store', storeProductId)], content_type: 'product' })
  return null
}

export function removeFromWishlist(token: string, storeProductId: number) {
  return request<null>(`/wishlist/${storeProductId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

// 응모 상품 찜 — 응모 목록과 같은 형태(RaffleProductResponse)로 내려온다
export function getMyRaffleWishlist(token: string) {
  return request<RaffleProductResponse[]>('/wishlist/raffles/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function addRaffleToWishlist(token: string, raffleProductId: number) {
  await request<null>(`/wishlist/raffles/${raffleProductId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  trackPixel('AddToWishlist', { content_ids: [contentId('raffle', raffleProductId)], content_type: 'product' })
  return null
}

export function removeRaffleFromWishlist(token: string, raffleProductId: number) {
  return request<null>(`/wishlist/raffles/${raffleProductId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
