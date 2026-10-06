'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { GiftIcon, MagnifyingGlassIcon, StorefrontIcon, TicketIcon } from '@phosphor-icons/react'
import { getStoreProducts, type RaffleProductResponse, type StoreProductResponse } from '@/lib/api'
import { getListedRaffles, isListedRaffleVisible } from '@/lib/raffle'
import { KUJI_LIST } from '@/lib/kujiList'
import RaffleCard from '@/components/RaffleCard'
import KujiCard from '@/components/KujiCard'
import StoreProductCard from '@/components/StoreProductCard'

/*
 * 상품 검색 — 이미 있는 목록(진행 중인 응모, 상점 상품, 쿠지)을 불러와 상품명으로 거른다.
 * 띄어쓰기·대소문자는 무시한다("원 피스" = "원피스").
 * TODO(backend): 상품이 많아지면 서버 검색 API로 교체 — 이 화면은 그대로 두고 데이터만 바꾸면 된다
 */
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')

interface RaffleWithDeadline extends RaffleProductResponse {
  deadlineAt: number
}

function SearchResults() {
  const query = (useSearchParams().get('q') ?? '').trim()
  const [raffles, setRaffles] = useState<RaffleWithDeadline[]>([])
  const [store, setStore] = useState<StoreProductResponse[]>([])
  const [loaded, setLoaded] = useState(false)
  const [, forceTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getListedRaffles().catch(() => [] as RaffleProductResponse[]),
      getStoreProducts().catch(() => [] as StoreProductResponse[]),
    ]).then(([r, s]) => {
      if (cancelled) return
      const now = Date.now()
      setRaffles(r.map(p => ({ ...p, deadlineAt: now + p.remaining_seconds * 1000 })))
      setStore(s)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  // 응모 카드의 남은 시간 표시
  useEffect(() => {
    const timer = setInterval(() => forceTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const q = normalize(query)
  const matches = (name: string) => q !== '' && normalize(name).includes(q)

  const raffleHits = raffles.filter(p =>
    matches(p.product_name) && isListedRaffleVisible(p, Math.floor((p.deadlineAt - Date.now()) / 1000)))
  const kujiHits = KUJI_LIST.filter(k => matches(k.title))
  const storeHits = store.filter(p => matches(p.product_name))
  const total = raffleHits.length + kujiHits.length + storeHits.length

  if (!query) {
    return (
      <div className="coming-soon-box large">
        <div className="emoji"><MagnifyingGlassIcon size={32} weight="light" /></div>
        <div className="title">검색어를 입력해 주세요</div>
        <div className="desc">위 검색창에 찾고 싶은 상품 이름을 입력하고 엔터를 눌러주세요.</div>
      </div>
    )
  }

  return (
    <>
      <div className="section-title" style={{ marginBottom: 24 }}>
        <MagnifyingGlassIcon size={18} weight="bold" color="var(--accent)" />
        &lsquo;{query}&rsquo; 검색 결과{loaded && ` ${total}개`}
      </div>

      {!loaded && <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>찾는 중...</div>}

      {loaded && total === 0 && (
        <div className="coming-soon-box large">
          <div className="emoji"><MagnifyingGlassIcon size={32} weight="light" /></div>
          <div className="title">검색 결과가 없어요</div>
          <div className="desc">다른 이름으로 검색하거나, 띄어쓰기 없이 짧게 입력해 보세요.</div>
        </div>
      )}

      {raffleHits.length > 0 && (
        <section className="search-group">
          <div className="search-group-title"><TicketIcon size={17} weight="fill" color="var(--accent)" /> 응모 <span className="count">{raffleHits.length}</span></div>
          <div className="product-grid-home">
            {raffleHits.map(p => (
              <RaffleCard key={p.raffle_product_id} product={p} secondsLeft={Math.max(0, Math.floor((p.deadlineAt - Date.now()) / 1000))} />
            ))}
          </div>
        </section>
      )}

      {kujiHits.length > 0 && (
        <section className="search-group">
          <div className="search-group-title"><GiftIcon size={17} weight="fill" color="var(--accent)" /> 쿠지 <span className="count">{kujiHits.length}</span></div>
          <div className="product-grid-home">
            {kujiHits.map(k => <KujiCard key={k.href} item={k} />)}
          </div>
        </section>
      )}

      {storeHits.length > 0 && (
        <section className="search-group">
          <div className="search-group-title"><StorefrontIcon size={17} weight="fill" color="var(--accent)" /> 상점 <span className="count">{storeHits.length}</span></div>
          <div className="product-grid-home">
            {storeHits.map(p => <StoreProductCard key={p.store_product_id} product={p} />)}
          </div>
        </section>
      )}
    </>
  )
}

export default function SearchPage() {
  return (
    <div className="home-container">
      {/* useSearchParams는 Suspense 안에서만 정적 빌드가 된다 */}
      <Suspense fallback={null}>
        <SearchResults />
      </Suspense>
    </div>
  )
}
