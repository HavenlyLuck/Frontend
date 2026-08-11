export interface WishlistItem {
  id: string
  href: string
  title: string
  image: string | null
  emoji?: string
  subtitle: string
}

const items: WishlistItem[] = []

export function isWished(id: string): boolean {
  return items.some(i => i.id === id)
}

// 찜 상태를 뒤집고, 뒤집은 뒤의 상태(true=찜됨)를 반환
export function toggleWishlist(item: WishlistItem): boolean {
  const idx = items.findIndex(i => i.id === item.id)
  if (idx >= 0) {
    items.splice(idx, 1)
    return false
  }
  items.unshift(item)
  return true
}

export function removeWishlistItem(id: string) {
  const idx = items.findIndex(i => i.id === id)
  if (idx >= 0) items.splice(idx, 1)
}

export function getWishlistItems(): WishlistItem[] {
  return items
}
