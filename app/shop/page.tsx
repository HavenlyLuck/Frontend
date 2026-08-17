'use client'

import { useEffect, useState } from 'react'
import { getStoreProducts, type StoreProductResponse } from '@/lib/api'

const SORTS = ['최신순', '낮은 가격순', '높은 가격순', '인기순']

type StoreTab = '운포인트' | '쌀포인트'

const TAB_POINT_TYPE: Record<StoreTab, 'woon' | 'ssal'> = { '운포인트': 'woon', '쌀포인트': 'ssal' }
const TAB_EMOJI: Record<StoreTab, string> = { '운포인트': '🎰', '쌀포인트': '🌾' }

export default function ShopPage() {
  const [sort, setSort] = useState('최신순')
  const [storeTab, setStoreTab] = useState<StoreTab>('운포인트')
  // 탭별로 결과를 캐싱해서, 이미 불러온 탭은 다시 눌러도 상품이 그대로 유지되고
  // storeTab이 바뀌는 렌더와 상품 데이터가 항상 같이 바뀌어 라벨이 섞이는 프레임도 생기지 않음
  const [cache, setCache] = useState<Partial<Record<StoreTab, StoreProductResponse[]>>>({})
  const products = cache[storeTab] ?? []
  const loaded = cache[storeTab] !== undefined

  useEffect(() => {
    if (cache[storeTab] !== undefined) return
    let cancelled = false
    getStoreProducts(TAB_POINT_TYPE[storeTab])
      .then(data => { if (!cancelled) setCache(prev => ({ ...prev, [storeTab]: data })) })
      .catch(() => { if (!cancelled) setCache(prev => ({ ...prev, [storeTab]: [] })) })
    return () => { cancelled = true }
  }, [storeTab, cache])

  return (
    <div>
      <div className="home-container">

        {/* 상점 타이틀 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div className="section-title"><span className="emoji">🏪</span> 상점</div>
          <a href="/guide#상점" style={{ fontSize: 12, color: '#767676', textDecoration: 'none', border: '1px solid #e2e2e4', borderRadius: 8, padding: '4px 12px', background: '#f5f6f7' }}>
            도움이 필요하다면?
          </a>
        </div>

        {/* 상점 탭 + 정렬 버튼 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(['운포인트', '쌀포인트'] as StoreTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setStoreTab(tab)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  border: `1px solid ${storeTab === tab ? '#4fa8e888' : '#e2e2e4'}`,
                  background: storeTab === tab ? '#eaf6fd' : '#ffffff',
                  color: storeTab === tab ? '#1477b8' : '#767676',
                  fontSize: 14,
                  fontWeight: storeTab === tab ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab === '운포인트' ? '🎰 운포인트 상점' : '🌾 쌀포인트 상점'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SORTS.map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${sort === s ? '#4fa8e888' : '#e2e2e4'}`,
                  background: sort === s ? '#eaf6fd' : '#ffffff',
                  color: sort === s ? '#1477b8' : '#767676',
                  fontSize: 12,
                  fontWeight: sort === s ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loaded && products.length === 0 && (
          <div className="coming-soon-box large">
            <div className="emoji">{TAB_EMOJI[storeTab]}</div>
            <div className="title">상품 준비중</div>
            <div className="desc">{storeTab} 상점 상품을 준비하고 있어요. 조금만 기다려주세요!</div>
          </div>
        )}

        {products.length > 0 && (
          <div className="product-grid-home">
            {products.map(p => (
              <div key={p.store_product_id} className="product-card-home" style={{ cursor: 'default' }}>
                <div className="card-img" style={{ position: 'relative' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.product_name} style={{ filter: p.stock === 0 ? 'blur(3px) brightness(0.45)' : undefined }} />
                  ) : (
                    <span style={{ fontSize: 72 }}>{TAB_EMOJI[storeTab]}</span>
                  )}
                  {p.stock === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: 3, padding: '5px 14px', borderRadius: 6, border: '2px solid #ffffff66', background: 'rgba(0,0,0,0.5)', textShadow: '0 0 12px #fff8' }}>SOLD OUT</span>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <div className="card-raffle-badge">{storeTab === '운포인트' ? '🎰 운포인트 상점' : '🌾 쌀포인트 상점'}</div>
                  <div className="card-title" style={{ color: p.stock === 0 ? '#b0b0b0' : undefined }}>{p.product_name}</div>
                  <div className="card-price" style={{ color: p.stock === 0 ? '#c8c8c8' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>{p.price.toLocaleString()} {storeTab}</span>
                    {p.stock > 0 && p.stock <= 3 && (
                      <span style={{ background: '#4fa8e8', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0 }}>
                        재고 {p.stock}개 남음
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
