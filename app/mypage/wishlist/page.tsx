'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HeartIcon } from '@phosphor-icons/react'
import type { RaffleProductResponse } from '@/lib/api'
import {
  getMyRaffleWishlist,
  getMyWishlist,
  removeFromWishlist,
  removeRaffleFromWishlist,
  type WishlistItem,
} from '@/lib/wishlist'
import { getValidSession } from '@/lib/auth'
import { formatStorePrice, PayTypeIcon } from '@/components/StoreProductCard'
import RaffleCard from '@/components/RaffleCard'
import CardImage from '@/components/CardImage'

type Tab = 'raffle' | 'shop'
const TABS: { id: Tab; label: string }[] = [
  { id: 'raffle', label: '응모 상품' },
  { id: 'shop', label: '상점' },
]

export default function WishlistPage() {
  const [tab, setTab] = useState<Tab>('raffle')
  const [shopItems, setShopItems] = useState<WishlistItem[] | null>(null)
  const [raffleItems, setRaffleItems] = useState<RaffleProductResponse[] | null>(null)
  const [failed, setFailed] = useState(false)
  // 응모 카드의 남은 시간 — 불러온 시각 기준으로 1초마다 다시 계산한다
  const [loadedAt, setLoadedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    getValidSession()
      .then(session =>
        session
          ? Promise.all([getMyRaffleWishlist(session.token), getMyWishlist(session.token)])
          : [[], []] as [RaffleProductResponse[], WishlistItem[]],
      )
      .then(([raffles, shop]) => {
        if (cancelled) return
        setRaffleItems(raffles)
        setShopItems(shop)
        setLoadedAt(Date.now())
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const removeShop = async (id: number) => {
    const session = await getValidSession()
    if (!session) return
    const prev = shopItems
    setShopItems(list => list?.filter(i => i.store_product_id !== id) ?? list)
    try {
      await removeFromWishlist(session.token, id)
    } catch {
      setShopItems(prev)
    }
  }

  const removeRaffle = async (id: number) => {
    const session = await getValidSession()
    if (!session) return
    const prev = raffleItems
    setRaffleItems(list => list?.filter(i => i.raffle_product_id !== id) ?? list)
    try {
      await removeRaffleFromWishlist(session.token, id)
    } catch {
      setRaffleItems(prev)
    }
  }

  const loaded = shopItems !== null && raffleItems !== null
  const count = (t: Tab) => (t === 'raffle' ? raffleItems?.length : shopItems?.length) ?? 0
  const elapsed = Math.floor((now - loadedAt) / 1000)

  return (
    <>
      <div className="mypage-section-header">
        <div className="mypage-section-title"><HeartIcon size={17} weight="fill" color="var(--danger)" /> 찜한 상품</div>
      </div>

      <div className="entry-filter-tabs" role="tablist" aria-label="찜한 상품 종류별 보기">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`entry-filter-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}{loaded ? ` ${count(t.id)}` : ''}
          </button>
        ))}
      </div>

      {failed ? (
        <div className="coming-soon-box">
          <div className="desc">찜한 상품을 불러오지 못했어요.<br />잠시 후 다시 시도해주세요.</div>
        </div>
      ) : !loaded ? null : count(tab) === 0 ? (
        <div className="coming-soon-box">
          <div className="desc">
            {tab === 'raffle' ? '아직 찜한 응모 상품이 없어요.' : '아직 찜한 상점 상품이 없어요.'}
            <br />상품 사진 위의 하트를 눌러보세요.
          </div>
        </div>
      ) : tab === 'raffle' ? (
        <div className="product-grid-home">
          {raffleItems!.map(p => (
            <div key={p.raffle_product_id} className="wish-card">
              <button onClick={() => removeRaffle(p.raffle_product_id)} aria-label="찜 해제" className="wish-heart liked">
                <HeartIcon size={18} weight="fill" />
              </button>
              <RaffleCard product={p} secondsLeft={Math.max(0, p.remaining_seconds - elapsed)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="product-grid-home">
          {shopItems!.map(item => {
            const soldOut = item.stock === 0
            return (
              <div key={item.store_product_id} className="wish-card">
                <button onClick={() => removeShop(item.store_product_id)} aria-label="찜 해제" className="wish-heart liked">
                  <HeartIcon size={18} weight="fill" />
                </button>
                <Link className="product-card-home is-shop" href={`/shop/${item.store_product_id}`}>
                  <div className={`card-img${soldOut ? ' is-dimmed' : ''}`}>
                    {item.image_url ? (
                      <CardImage src={item.image_url} alt={item.product_name} />
                    ) : (
                      <span style={{ display: 'flex', color: 'var(--text-tertiary)' }}><PayTypeIcon type={item.pay_type} size={44} /></span>
                    )}
                    {soldOut && <div className="card-soldout-stamp"><span>품절</span></div>}
                  </div>
                  <div className="card-body">
                    <div className="card-title" style={soldOut ? { color: 'var(--text-tertiary)' } : undefined}>{item.product_name}</div>
                    <div className="card-price" style={soldOut ? { color: 'var(--text-tertiary)' } : undefined}>
                      {formatStorePrice(item.pay_type, item.price)}
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
