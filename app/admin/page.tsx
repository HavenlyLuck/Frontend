'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarIcon,
  ChartBarIcon,
  ChartLineUpIcon,
  CoinsIcon,
  GearIcon,
  PackageIcon,
  PaperclipIcon,
  ShoppingBagIcon,
  UsersIcon,
} from '@phosphor-icons/react'
import { verifyAdmin, ApiError, getRaffleProducts, createRaffleProduct, type RaffleProductResponse, getStoreProducts, createStoreProduct, type StoreProductResponse } from '@/lib/api'
import { getValidSession, clearAuth } from '@/lib/auth'
import { TODAY, DAILY_REV, MONTHLY_REV, DAILY_SALES } from '@/lib/adminStats'
import {
  PRODUCTS, PRODUCT_TABS, TAB_EMOJI, addProduct, removeProduct, toggleProductActive,
  type ProductType, type KujiItem, type Product,
} from '@/lib/adminProducts'

const TYPE_COLOR: Record<string, string> = { '응모': 'var(--accent)', '쿠지': 'var(--gold)', '상점': '#a78bfa' }
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

// ── Helpers ───────────────────────────────────────────────
function getDailyWindow(endDate: string) {
  const result: { label: string; fullDate: string; amount: number }[] = []
  const end = new Date(endDate + 'T00:00:00')
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const fullDate = `${d.getFullYear()}-${mm}-${dd}`
    result.push({ label: `${mm}-${dd}`, fullDate, amount: DAILY_REV[fullDate] ?? 0 })
  }
  return result
}

function getMonthlyWindow(year: string) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`
    return { label: `${i + 1}월`, fullDate: m, amount: MONTHLY_REV[m] ?? 0 }
  })
}

// ── Calendar Components ────────────────────────────────────
const popupStyle: React.CSSProperties = {
  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300,
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)', borderRadius: 14, padding: 16,
  boxShadow: 'var(--shadow-lg)',
}
const navBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text-secondary)',
  fontSize: 18, cursor: 'pointer', padding: '2px 10px', borderRadius: 6,
}

function DayCalendar({ selected, onSelect, highlighted }: {
  selected: string; onSelect: (d: string) => void; highlighted: Set<string>
}) {
  const [vy, setVy] = useState(() => parseInt(selected.slice(0, 4)))
  const [vm, setVm] = useState(() => parseInt(selected.slice(5, 7)) - 1)

  function prev() { if (vm === 0) { setVy(y => y - 1); setVm(11) } else setVm(m => m - 1) }
  function next() { if (vm === 11) { setVy(y => y + 1); setVm(0) } else setVm(m => m + 1) }

  const firstDow = new Date(vy, vm, 1).getDay()
  const daysInMonth = new Date(vy, vm + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ width: 252 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button style={navBtn} onClick={prev}>‹</button>
        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>{vy}년 {MONTH_NAMES[vm]}</span>
        <button style={navBtn} onClick={next}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10, padding: '2px 0', color: i === 0 ? 'var(--danger)' : i === 6 ? 'var(--gold)' : 'var(--text-tertiary)' }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} style={{ aspectRatio: '1' }} />
          const ds = `${vy}-${String(vm + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isSel = ds === selected
          const isToday = ds === TODAY
          const hasDot = highlighted.has(ds)
          return (
            <button key={i} onClick={() => onSelect(ds)} style={{
              position: 'relative', aspectRatio: '1', borderRadius: 6, cursor: 'pointer',
              border: isToday && !isSel ? '1px solid var(--accent-tint-border)' : 'none',
              background: isSel ? 'var(--accent)' : 'transparent',
              color: isSel ? '#fff' : i % 7 === 0 ? 'var(--danger)' : i % 7 === 6 ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: isSel || isToday ? 700 : 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {day}
              {hasDot && !isSel && (
                <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--gold)' }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MonthCalendar({ selected, onSelect, highlighted }: {
  selected: string; onSelect: (m: string) => void; highlighted: Set<string>
}) {
  const [vy, setVy] = useState(() => parseInt(selected.slice(0, 4)))
  return (
    <div style={{ width: 220 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button style={navBtn} onClick={() => setVy(y => y - 1)}>‹</button>
        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>{vy}년</span>
        <button style={navBtn} onClick={() => setVy(y => y + 1)}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {MONTH_NAMES.map((mn, i) => {
          const ms = `${vy}-${String(i + 1).padStart(2, '0')}`
          const isSel = ms === selected
          const hasData = highlighted.has(ms)
          return (
            <button key={mn} onClick={() => hasData && onSelect(ms)} style={{
              padding: '10px 4px', borderRadius: 8, fontSize: 13,
              border: isSel ? 'none' : hasData ? '1px solid var(--border-strong)' : 'none',
              background: isSel ? 'var(--accent)' : hasData ? 'var(--bg-subtle)' : 'transparent',
              color: isSel ? '#fff' : hasData ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              fontWeight: isSel ? 700 : 400, cursor: hasData ? 'pointer' : 'default',
            }}>{mn}</button>
          )
        })}
      </div>
    </div>
  )
}

const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

// ── Main ───────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getValidSession().then((session) => {
      if (cancelled) return
      if (!session) {
        router.replace('/login')
        return
      }
      verifyAdmin(session.token)
        .then(() => {
          if (cancelled) return
          setAdminToken(session.token)
          setAuthChecked(true)
        })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            clearAuth()
          }
          router.replace('/')
        })
    })
    return () => {
      cancelled = true
    }
  }, [router])

  const [raffleProducts, setRaffleProducts] = useState<RaffleProductResponse[]>([])
  const [raffleListError, setRaffleListError] = useState<string | null>(null)

  function reloadRaffleProducts() {
    getRaffleProducts()
      .then(setRaffleProducts)
      .catch((err) => setRaffleListError(err instanceof ApiError ? err.message : '응모 상품 목록을 불러오지 못했습니다.'))
  }

  const [storeProducts, setStoreProducts] = useState<StoreProductResponse[]>([])
  const [storeListError, setStoreListError] = useState<string | null>(null)

  function reloadStoreProducts() {
    getStoreProducts()
      .then(setStoreProducts)
      .catch((err) => setStoreListError(err instanceof ApiError ? err.message : '상점 상품 목록을 불러오지 못했습니다.'))
  }

  useEffect(() => {
    if (!authChecked) return
    reloadRaffleProducts()
    reloadStoreProducts()
  }, [authChecked])

  const [revenueTab, setRevenueTab] = useState<'일별' | '월별'>('일별')
  const [revDate, setRevDate] = useState(TODAY)
  const [revMonth, setRevMonth] = useState('2026-08')
  const [showRevCal, setShowRevCal] = useState(false)
  const [saleDate, setSaleDate] = useState(TODAY)
  const [showSalCal, setShowSalCal] = useState(false)
  const [productTab, setProductTab] = useState<ProductType>('응모')
  const [products, setProducts] = useState<Product[]>(() => [...PRODUCTS])
  const [showAddForm, setShowAddForm] = useState(false)
  const [nextId, setNextId] = useState(100)
  const [newP, setNewP] = useState({ title: '', price: '', cost: '', img: '', stock: '', maxTickets: '', ticketPrice: '1,000 운포인트', description: '' })
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [deadlineDays, setDeadlineDays] = useState(1)
  const [raffleSubmitting, setRaffleSubmitting] = useState(false)
  const [raffleSubmitError, setRaffleSubmitError] = useState<string | null>(null)
  const autoMaxTickets = Math.floor((Number(newP.price.replace(/[^0-9]/g, '')) || 0) / 1000)

  function resetNewProductForm() {
    setNewP({ title: '', price: '', cost: '', img: '', stock: '', maxTickets: '', ticketPrice: '1,000 운포인트', description: '' })
    setNewImageFile(null)
    setDeadlineDays(1)
    setKujiItems([{ name: '', img: '', count: '1', cost: '' }])
    setRaffleSubmitError(null)
  }

  function raffleToProduct(rp: RaffleProductResponse): Product {
    const startMs = new Date(rp.starts_at).getTime()
    const endMs = new Date(rp.ends_at).getTime()
    const hours = Math.round((endMs - startMs) / (1000 * 60 * 60))
    const deadlineLabel = hours > 0 && hours % 24 === 0 ? `${hours / 24}일` : `${hours}시간`
    return {
      id: rp.raffle_product_id,
      type: '응모',
      title: rp.product_name,
      price: `${rp.price_krw.toLocaleString()} 운포인트`,
      img: rp.image_url ?? '',
      active: rp.is_open,
      stock: 1,
      maxTickets: rp.total_slots,
      ticketPrice: `${rp.ticket_price.toLocaleString()} 운포인트`,
      description: rp.description ?? undefined,
      deadlineLabel,
    }
  }

  function storeToProduct(sp: StoreProductResponse): Product {
    const label = sp.point_type === 'woon' ? '운포인트' : '쌀포인트'
    return {
      id: sp.store_product_id,
      type: sp.point_type === 'woon' ? '상점(운포인트)' : '상점(쌀포인트)',
      title: sp.product_name,
      price: `${sp.price.toLocaleString()} ${label}`,
      img: sp.image_url ?? '',
      active: true,
      stock: sp.stock,
      description: sp.description ?? undefined,
    }
  }
  const [kujiItems, setKujiItems] = useState<KujiItem[]>([{ name: '', img: '', count: '1', cost: '' }])
  const kujiItemCount = kujiItems.filter(it => it.name.trim()).reduce((sum, it) => sum + (Number(it.count) || 1), 0)
  const kujiLowerCount = Number(newP.stock) || 0
  const kujiTotalPapers = kujiItemCount + kujiLowerCount
  const addKujiItem = () => setKujiItems(prev => [...prev, { name: '', img: '', count: '1', cost: '' }])
  const removeKujiItem = (idx: number) => setKujiItems(prev => prev.filter((_, i) => i !== idx))
  const updateKujiItem = (idx: number, patch: Partial<KujiItem>) =>
    setKujiItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const chartData = revenueTab === '일별' ? getDailyWindow(revDate) : getMonthlyWindow(revMonth.slice(0, 4))
  const maxAmt = Math.max(...chartData.map(d => d.amount), 1)

  const dailyRevDates = new Set(Object.keys(DAILY_REV))
  const monthlyRevMonths = new Set(Object.keys(MONTHLY_REV))
  const saleDates = new Set(Object.keys(DAILY_SALES))
  const currentSales = DAILY_SALES[saleDate] ?? []
  const filtered = productTab === '응모'
    ? raffleProducts.map(raffleToProduct)
    : productTab === '상점(운포인트)' || productTab === '상점(쌀포인트)'
      ? storeProducts
          .filter(sp => sp.point_type === (productTab === '상점(운포인트)' ? 'woon' : 'ssal'))
          .map(storeToProduct)
      : products.filter(p => p.type === productTab)

  const calBtn: React.CSSProperties = {
    padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border-strong)',
    background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  }

  if (!authChecked) return null

  return (
    <div>
      <div className="home-container" style={{ maxWidth: 960 }}>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
          <GearIcon size={28} weight="fill" color="var(--accent)" /> 관리자 메뉴
        </h1>

        {/* 스탯 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: '현재 이용자 수', value: '1,247명', icon: <UsersIcon size={22} weight="fill" />, color: 'var(--accent)' },
            { label: '오늘 매출', value: (DAILY_REV[TODAY] ?? 0).toLocaleString() + '원', icon: <CalendarIcon size={22} weight="fill" />, color: '#a78bfa' },
            { label: '이번 달 매출', value: (MONTHLY_REV['2026-08'] ?? 0).toLocaleString() + '원', icon: <ChartLineUpIcon size={22} weight="fill" />, color: 'var(--gold)' },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: 8, color: c.color }}>{c.icon}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>{c.label}</div>
              <div style={{ color: c.color, fontSize: 22, fontWeight: 800 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 매출 차트 */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ChartBarIcon size={17} weight="fill" color="var(--accent)" /> 매출 현황</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {(['일별', '월별'] as const).map(t => (
                <button key={t} onClick={() => { setRevenueTab(t); setShowRevCal(false) }} style={{
                  padding: '5px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: `1px solid ${revenueTab === t ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
                  background: revenueTab === t ? 'var(--accent-tint)' : 'var(--surface)',
                  color: revenueTab === t ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: revenueTab === t ? 700 : 400,
                }}>{t}</button>
              ))}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowRevCal(v => !v)} style={calBtn}>
                  <CalendarIcon size={14} /> {revenueTab === '일별' ? revDate.slice(5) : revMonth}
                </button>
                {showRevCal && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowRevCal(false)} />
                    <div style={popupStyle}>
                      {revenueTab === '일별'
                        ? <DayCalendar selected={revDate} onSelect={d => { setRevDate(d); setShowRevCal(false) }} highlighted={dailyRevDates} />
                        : <MonthCalendar selected={revMonth} onSelect={m => { setRevMonth(m); setShowRevCal(false) }} highlighted={monthlyRevMonths} />
                      }
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
            {chartData.map((d, i) => {
              const pct = d.amount / maxAmt
              const isSel = revenueTab === '일별' ? d.fullDate === revDate : d.fullDate === revMonth
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  {d.amount > 0 && <div style={{ color: 'var(--text-tertiary)', fontSize: 9, whiteSpace: 'nowrap' }}>{(d.amount / 10000).toFixed(0)}만</div>}
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.3s',
                    height: d.amount > 0 ? `${Math.max(pct * 120, 4)}px` : '2px',
                    background: isSel ? 'var(--accent)' : d.amount > 0 ? 'var(--gold-tint-border)' : 'var(--border)',
                    boxShadow: isSel ? '0 0 8px rgba(224,56,76,0.4)' : undefined,
                  }} />
                  <div style={{ color: isSel ? 'var(--accent)' : 'var(--text-tertiary)', fontSize: 9, whiteSpace: 'nowrap', fontWeight: isSel ? 700 : 400 }}>{d.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 판매 내역 */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 36, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingBagIcon size={17} weight="fill" color="var(--accent)" /> 일별 판매 내역</div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSalCal(v => !v)} style={calBtn}>
                <CalendarIcon size={14} /> {saleDate.slice(5)}
              </button>
              {showSalCal && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowSalCal(false)} />
                  <div style={popupStyle}>
                    <DayCalendar selected={saleDate} onSelect={d => { setSaleDate(d); setShowSalCal(false) }} highlighted={saleDates} />
                  </div>
                </>
              )}
            </div>
          </div>
          {currentSales.length === 0
            ? <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>{saleDate.slice(5)} 판매 내역이 없습니다.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentSales.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0, background: `color-mix(in srgb, ${TYPE_COLOR[item.type]} 16%, transparent)`, color: TYPE_COLOR[item.type], border: `1px solid color-mix(in srgb, ${TYPE_COLOR[item.type]} 45%, transparent)` }}>{item.type}</div>
                    <div style={{ flex: 1, color: 'var(--text)', fontSize: 14 }}>{item.title}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 12, flexShrink: 0 }}>{item.buyer}</div>
                    <div style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{item.price}</div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* 자금 관리 바로가기 */}
        <Link href="/admin/finance" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--gold-tint)', border: '1px solid var(--gold-tint-border)', borderRadius: 14, padding: '20px 24px', marginBottom: 36, cursor: 'pointer',
          }}>
            <div>
              <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><CoinsIcon size={18} weight="fill" color="var(--gold)" /> 자금 관리</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>부대비용을 기록하고 일별 · 주별 · 월별 · 년도별 순이익을 확인하세요</div>
            </div>
            <span style={{ color: 'var(--gold)', fontSize: 20 }}>→</span>
          </div>
        </Link>

        {/* 상품 관리 */}
        <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 18, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}><PackageIcon size={19} weight="fill" color="var(--accent)" /> 상품 관리</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {PRODUCT_TABS.map(t => (
            <button key={t} onClick={() => { setProductTab(t); setShowAddForm(false) }} style={{
              padding: '9px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
              border: `1px solid ${productTab === t ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
              background: productTab === t ? 'var(--accent-tint)' : 'var(--surface)',
              color: productTab === t ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: productTab === t ? 700 : 400,
            }}>{TAB_EMOJI[t]} {t}</button>
          ))}
        </div>

        {productTab === '응모' && raffleListError && (
          <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{raffleListError}</div>
        )}

        {(productTab === '상점(운포인트)' || productTab === '상점(쌀포인트)') && storeListError && (
          <div style={{ color: '#e14d72', fontSize: 13, marginBottom: 12 }}>{storeListError}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {filtered.length === 0 && (
            <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>등록된 상품이 없습니다.</div>
          )}
          {filtered.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 12, border: `1px solid ${p.active ? 'var(--border-strong)' : 'var(--border)'}`, background: p.active ? 'var(--surface)' : 'var(--bg-subtle)', opacity: p.active ? 1 : 0.6, transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                {p.img ? <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌾'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {p.price}
                  {p.cost && <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>· 제품 원가 {p.cost}</span>}
                  {p.maxTickets && <span style={{ marginLeft: 12, color: 'var(--text-tertiary)' }}>{p.type === '쿠지' ? '총' : '최대'} {p.maxTickets}장</span>}
                  {p.ticketPrice && <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>· 응모권 {p.ticketPrice}</span>}
                  {p.type === '응모' && <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>· 등록 후 {p.deadlineLabel ?? '24시간'} 자동 마감</span>}
                  {p.type === '쿠지' && p.kujiItems && (
                    <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>· 상품 {p.kujiItems.length}개 · 하위상 {p.lowerCount ?? 0}개</span>
                  )}
                </div>
              </div>
              {/* 재고 */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: p.stock === 0 ? 'var(--danger)' : p.stock <= 3 ? 'var(--gold)' : 'var(--success)' }}>{p.stock}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 2 }}>개</span>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0, background: p.active ? 'var(--accent-tint)' : 'var(--bg-subtle)', color: p.active ? 'var(--accent)' : 'var(--text-tertiary)', border: `1px solid ${p.active ? 'var(--accent-tint-border)' : 'var(--border)'}` }}>{p.active ? '활성' : '비활성'}</div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {p.type === '응모' || p.type === '상점(운포인트)' || p.type === '상점(쌀포인트)' ? (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>상태 변경 API 미구현</span>
                ) : (
                  <>
                    <button onClick={() => { if (p.active && !confirm(`"${p.title}"을(를) 비활성화할까요? 지금 이 상품은 목록에서 즉시 내려갑니다.`)) return; toggleProductActive(p.id); setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x)) }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${p.active ? 'var(--danger-tint-border)' : 'var(--accent-tint-border)'}`, background: p.active ? 'var(--danger-tint)' : 'var(--accent-tint)', color: p.active ? 'var(--danger)' : 'var(--accent)' }}>{p.active ? '내리기' : '올리기'}</button>
                    <button onClick={() => { if (!confirm(`"${p.title}"을(를) 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return; removeProduct(p.id); setProducts(prev => prev.filter(x => x.id !== p.id)) }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--danger-tint-border)', background: 'var(--danger-tint)', color: 'var(--danger)' }}>삭제</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px dashed var(--accent-tint-border)', background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            + 새 {productTab} 상품 추가
          </button>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', padding: '24px 24px 20px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>{TAB_EMOJI[productTab]} {productTab} 상품 추가</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>{productTab === '쿠지' ? '쿠지 이름 *' : '상품명 *'}</div>
                <input style={lightInput} placeholder={productTab === '쿠지' ? '예: 주술회전 나오야 젠인 쿠지' : '상품 이름 입력'} value={newP.title} onChange={e => setNewP(p => ({ ...p, title: e.target.value }))} />
              </div>
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>판매가격 *</div>
                  <input style={lightInput} placeholder={productTab === '응모' ? '예: 650000 (숫자만)' : '예: 50,000 운포인트'} value={newP.price} onChange={e => setNewP(p => ({ ...p, price: e.target.value }))} />
                </div>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>제품 원가</div>
                  <input style={lightInput} placeholder="예: 30,000원" value={newP.cost} onChange={e => setNewP(p => ({ ...p, cost: e.target.value }))} />
                </div>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>상품 이미지 (선택)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {newP.img && (
                      <img src={newP.img} alt="미리보기" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-strong)', flexShrink: 0 }} />
                    )}
                    <label style={{ ...lightInput, width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: newP.img ? 'var(--text)' : 'var(--text-tertiary)' }}>
                      <PaperclipIcon size={14} /> {newP.img ? '이미지 변경' : '이미지 파일 선택'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setNewImageFile(file)
                          const reader = new FileReader()
                          reader.onload = () => setNewP(p => ({ ...p, img: typeof reader.result === 'string' ? reader.result : '' }))
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                    {newP.img && (
                      <button type="button" onClick={() => { setNewP(p => ({ ...p, img: '' })); setNewImageFile(null) }} style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: 12, cursor: 'pointer' }}>제거</button>
                    )}
                  </div>
                </div>
              )}
              {productTab === '쿠지' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>상품명 (상위상, 이미지 포함) *</div>
                    <button type="button" onClick={addKujiItem} style={{ border: '1px solid var(--accent-tint-border)', background: 'var(--accent-tint)', color: 'var(--accent)', borderRadius: 8, width: 24, height: 24, fontSize: 15, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {kujiItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
                        {item.img ? (
                          <img src={item.img} alt="미리보기" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-subtle)', flexShrink: 0 }} />
                        )}
                        <input
                          style={{ ...lightInput, flex: 1 }}
                          placeholder={`상품명 ${idx + 1} (예: 나오야 젠인 피규어)`}
                          value={item.name}
                          onChange={e => updateKujiItem(idx, { name: e.target.value })}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <input
                            style={{ ...lightInput, width: 56, textAlign: 'center', padding: '8px 6px' }}
                            type="number"
                            min="1"
                            placeholder="1"
                            value={item.count}
                            onChange={e => updateKujiItem(idx, { count: e.target.value })}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>개</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <input
                            style={{ ...lightInput, width: 84, textAlign: 'center', padding: '8px 6px' }}
                            placeholder="제품 원가"
                            value={item.cost}
                            onChange={e => updateKujiItem(idx, { cost: e.target.value })}
                          />
                        </div>
                        <label style={{ ...lightInput, width: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: item.img ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 12, padding: '8px 10px' }}>
                          <PaperclipIcon size={12} /> 이미지
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const reader = new FileReader()
                              reader.onload = () => updateKujiItem(idx, { img: typeof reader.result === 'string' ? reader.result : '' })
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>
                        {kujiItems.length > 1 && (
                          <button type="button" onClick={() => removeKujiItem(idx)} style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>삭제</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>상품 설명</div>
                  <textarea
                    style={{ ...lightInput, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="상품 상태, 구성품, 유의사항 등을 적어주세요"
                    value={newP.description}
                    onChange={e => setNewP(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              )}
              {productTab === '쿠지' && (
                <div><div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>하위상 갯수 *</div><input style={lightInput} placeholder="예: 40" type="number" min="0" value={newP.stock} onChange={e => setNewP(p => ({ ...p, stock: e.target.value }))} /></div>
              )}
              {productTab !== '응모' && productTab !== '쿠지' && (
                <div><div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>수량 *</div><input style={lightInput} placeholder="올릴 수량 입력 (예: 10)" type="number" min="1" value={newP.stock} onChange={e => setNewP(p => ({ ...p, stock: e.target.value }))} /></div>
              )}
              {productTab === '응모' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>최대 응모권 수 (자동 계산: 가격 ÷ 1,000)</div>
                  <div style={{ ...lightInput, background: 'var(--bg-subtle)', color: autoMaxTickets ? 'var(--text)' : 'var(--text-tertiary)' }}>
                    {autoMaxTickets ? `${autoMaxTickets.toLocaleString()}장` : '가격을 입력하면 자동으로 계산돼요'}
                  </div>
                </div>
              )}
              {productTab === '응모' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>응모 마감 기한</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3].map(d => (
                      <button key={d} type="button" onClick={() => setDeadlineDays(d)} style={{
                        flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                        border: `1px solid ${deadlineDays === d ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
                        background: deadlineDays === d ? 'var(--accent-tint)' : 'var(--surface)',
                        color: deadlineDays === d ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: deadlineDays === d ? 700 : 400,
                      }}>{d}일</button>
                    ))}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 5 }}>등록 시점부터 선택한 기간 뒤 자동 마감돼요</div>
                </div>
              )}
              {(productTab === '응모' || productTab === '상점(운포인트)' || productTab === '상점(쌀포인트)') && raffleSubmitError && (
                <div style={{ color: 'var(--danger)', fontSize: 12 }}>{raffleSubmitError}</div>
              )}
              {productTab === '쿠지' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>총 쿠지 종이 수 (자동 계산: 상품 수 + 하위상 갯수)</div>
                    <div style={{ ...lightInput, background: 'var(--bg-subtle)', color: kujiTotalPapers ? 'var(--text)' : 'var(--text-tertiary)' }}>
                      {kujiTotalPapers ? `${kujiTotalPapers.toLocaleString()}장 (상품 ${kujiItemCount}개 + 하위상 ${kujiLowerCount}개)` : '상품명과 하위상 갯수를 입력하면 계산돼요'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}><div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>응모권 가격</div><input style={lightInput} placeholder="기본값: 1,000 운포인트" value={newP.ticketPrice} onChange={e => setNewP(p => ({ ...p, ticketPrice: e.target.value }))} /></div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button disabled={raffleSubmitting} onClick={async () => {
                if (productTab === '응모') {
                  if (!newP.title.trim() || !newP.price.trim() || !newImageFile || !adminToken) {
                    setRaffleSubmitError('상품명, 가격, 이미지를 모두 입력해주세요.')
                    return
                  }
                  const priceNum = Number(newP.price.replace(/[^0-9]/g, ''))
                  if (!priceNum) {
                    setRaffleSubmitError('가격은 숫자로 입력해주세요.')
                    return
                  }
                  try {
                    setRaffleSubmitting(true)
                    setRaffleSubmitError(null)
                    const created = await createRaffleProduct(adminToken, {
                      product_name: newP.title,
                      description: newP.description || undefined,
                      price_krw: priceNum,
                      image: newImageFile,
                      duration_days: deadlineDays,
                    })
                    setRaffleProducts(prev => [created, ...prev])
                    resetNewProductForm()
                    setShowAddForm(false)
                  } catch (err) {
                    setRaffleSubmitError(err instanceof ApiError ? err.message : '등록 중 오류가 발생했습니다.')
                  } finally {
                    setRaffleSubmitting(false)
                  }
                  return
                }
                if (productTab === '상점(운포인트)' || productTab === '상점(쌀포인트)') {
                  if (!newP.title.trim() || !newP.price.trim() || !newP.stock.trim() || !adminToken) {
                    setRaffleSubmitError('상품명, 가격, 수량을 모두 입력해주세요.')
                    return
                  }
                  const priceNum = Number(newP.price.replace(/[^0-9]/g, ''))
                  const stockNum = Number(newP.stock)
                  if (!priceNum) {
                    setRaffleSubmitError('가격은 숫자로 입력해주세요.')
                    return
                  }
                  try {
                    setRaffleSubmitting(true)
                    setRaffleSubmitError(null)
                    const created = await createStoreProduct(adminToken, {
                      product_name: newP.title,
                      description: newP.description || undefined,
                      point_type: productTab === '상점(운포인트)' ? 'woon' : 'ssal',
                      price: priceNum,
                      stock: stockNum,
                      image: newImageFile ?? undefined,
                    })
                    setStoreProducts(prev => [created, ...prev])
                    resetNewProductForm()
                    setShowAddForm(false)
                  } catch (err) {
                    setRaffleSubmitError(err instanceof ApiError ? err.message : '등록 중 오류가 발생했습니다.')
                  } finally {
                    setRaffleSubmitting(false)
                  }
                  return
                }
                if (!newP.title.trim()) return
                if (productTab !== '쿠지' && !newP.price.trim()) return
                if (productTab === '쿠지' && kujiItemCount === 0) return
                const kujiThumb = kujiItems.find(it => it.name.trim() && it.img)?.img || ''
                const newProduct = {
                  id: nextId, type: productTab,
                  title: newP.title,
                  price: productTab === '쿠지' ? (newP.ticketPrice || '1,000 운포인트') : newP.price,
                  cost: productTab === '쿠지' ? undefined : newP.cost,
                  img: productTab === '쿠지' ? kujiThumb : newP.img,
                  active: true,
                  stock: Number(newP.stock) || 1,
                  ...(productTab === '쿠지'
                    ? { maxTickets: kujiTotalPapers || 50, ticketPrice: newP.ticketPrice || '1,000 운포인트', kujiItems: kujiItems.filter(it => it.name.trim()), lowerCount: kujiLowerCount }
                    : { description: newP.description }),
                } as Product
                addProduct(newProduct)
                setProducts(prev => [...prev, newProduct])
                setNextId(n => n + 1)
                resetNewProductForm()
                setShowAddForm(false)
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: raffleSubmitting ? 'default' : 'pointer', opacity: raffleSubmitting ? 0.6 : 1 }}>{raffleSubmitting ? '등록 중...' : '추가하기'}</button>
              <button onClick={() => { setShowAddForm(false); resetNewProductForm() }} style={{ padding: '11px 24px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
