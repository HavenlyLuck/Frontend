'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyAdmin, ApiError } from '@/lib/api'
import { TODAY, DAILY_REV, MONTHLY_REV, DAILY_SALES } from '@/lib/adminStats'
import {
  PRODUCTS, PRODUCT_TABS, TAB_EMOJI, addProduct, removeProduct, toggleProductActive,
  type ProductType, type KujiItem, type Product,
} from '@/lib/adminProducts'

const TYPE_COLOR: Record<string, string> = { '응모': '#e14d72', '쿠지': '#4fa8e8', '상점': '#7c3aed' }
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
  background: '#ffffff',
  border: '1px solid #ececec', borderRadius: 14, padding: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
}
const navBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#767676',
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
        <span style={{ color: '#181818', fontWeight: 700, fontSize: 14 }}>{vy}년 {MONTH_NAMES[vm]}</span>
        <button style={navBtn} onClick={next}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10, padding: '2px 0', color: i === 0 ? '#e14d72aa' : i === 6 ? '#4fa8e8aa' : '#9a9a9a' }}>{w}</div>
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
              border: isToday && !isSel ? '1px solid #4fa8e888' : 'none',
              background: isSel ? '#181818' : 'transparent',
              color: isSel ? '#fff' : i % 7 === 0 ? '#e14d72' : i % 7 === 6 ? '#4fa8e8' : '#454545',
              fontSize: 12, fontWeight: isSel || isToday ? 700 : 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {day}
              {hasDot && !isSel && (
                <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#4fa8e8' }} />
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
        <span style={{ color: '#181818', fontWeight: 700, fontSize: 14 }}>{vy}년</span>
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
              border: isSel ? 'none' : hasData ? '1px solid #e2e2e4' : 'none',
              background: isSel ? '#181818' : hasData ? '#f5f6f7' : 'transparent',
              color: isSel ? '#fff' : hasData ? '#454545' : '#d0d0d0',
              fontWeight: isSel ? 700 : 400, cursor: hasData ? 'pointer' : 'default',
            }}>{mn}</button>
          )
        })}
      </div>
    </div>
  )
}

const lightInput: React.CSSProperties = { background: '#ffffff', border: '1px solid #e2e2e4', borderRadius: 8, color: '#181818', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

// ── Main ───────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
      return
    }
    verifyAdmin(token)
      .then(() => setAuthChecked(true))
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          localStorage.removeItem('isAdmin')
        }
        router.replace('/')
      })
  }, [router])

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
  const [newP, setNewP] = useState({ title: '', price: '', cost: '', img: '', stock: '', maxTickets: '', ticketPrice: '1,000 운포인트', description: '', durationDays: '3' })
  const autoMaxTickets = Math.floor((Number(newP.price.replace(/[^0-9]/g, '')) || 0) / 1000)
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
  const filtered = products.filter(p => p.type === productTab)

  const calBtn: React.CSSProperties = {
    padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e2e4',
    background: '#ffffff', color: '#454545', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  }

  if (!authChecked) return null

  return (
    <div>
      <div className="home-container" style={{ maxWidth: 960 }}>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#181818', marginBottom: 36 }}>⚙️ 관리자 메뉴</h1>

        {/* 스탯 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: '현재 이용자 수', value: '1,247명', icon: '👥', color: '#4fa8e8' },
            { label: '오늘 매출', value: (DAILY_REV[TODAY] ?? 0).toLocaleString() + '원', icon: '📅', color: '#7c3aed' },
            { label: '이번 달 매출', value: (MONTHLY_REV['2026-08'] ?? 0).toLocaleString() + '원', icon: '📆', color: '#e14d72' },
          ].map(c => (
            <div key={c.label} style={{ background: '#ffffff', border: '1px solid #ececec', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ color: '#767676', fontSize: 13, marginBottom: 6 }}>{c.label}</div>
              <div style={{ color: c.color, fontSize: 22, fontWeight: 800 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 매출 차트 */}
        <div style={{ background: '#ffffff', border: '1px solid #ececec', borderRadius: 14, padding: 24, marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ color: '#181818', fontWeight: 700, fontSize: 16 }}>📊 매출 현황</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {(['일별', '월별'] as const).map(t => (
                <button key={t} onClick={() => { setRevenueTab(t); setShowRevCal(false) }} style={{
                  padding: '5px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: `1px solid ${revenueTab === t ? '#4fa8e888' : '#e2e2e4'}`,
                  background: revenueTab === t ? '#eaf6fd' : '#ffffff',
                  color: revenueTab === t ? '#1477b8' : '#767676',
                  fontWeight: revenueTab === t ? 700 : 400,
                }}>{t}</button>
              ))}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowRevCal(v => !v)} style={calBtn}>
                  📅 {revenueTab === '일별' ? revDate.slice(5) : revMonth}
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
                  {d.amount > 0 && <div style={{ color: '#9a9a9a', fontSize: 9, whiteSpace: 'nowrap' }}>{(d.amount / 10000).toFixed(0)}만</div>}
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.3s',
                    height: d.amount > 0 ? `${Math.max(pct * 120, 4)}px` : '2px',
                    background: isSel ? 'linear-gradient(180deg, #e14d72, #1477b8)' : d.amount > 0 ? 'linear-gradient(180deg, #bfe3fb, #d3ecfb)' : '#ececec',
                    boxShadow: isSel ? '0 0 8px rgba(79,168,232,0.3)' : undefined,
                  }} />
                  <div style={{ color: isSel ? '#1477b8' : '#9a9a9a', fontSize: 9, whiteSpace: 'nowrap', fontWeight: isSel ? 700 : 400 }}>{d.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 판매 내역 */}
        <div style={{ background: '#ffffff', border: '1px solid #ececec', borderRadius: 14, padding: 24, marginBottom: 36, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ color: '#181818', fontWeight: 700, fontSize: 16 }}>🛍 일별 판매 내역</div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSalCal(v => !v)} style={calBtn}>
                📅 {saleDate.slice(5)}
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
            ? <div style={{ color: '#9a9a9a', textAlign: 'center', padding: '24px 0' }}>{saleDate.slice(5)} 판매 내역이 없습니다.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentSales.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: '#f7f7f8', border: '1px solid #ececec' }}>
                    <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0, background: `${TYPE_COLOR[item.type]}18`, color: TYPE_COLOR[item.type], border: `1px solid ${TYPE_COLOR[item.type]}44` }}>{item.type}</div>
                    <div style={{ flex: 1, color: '#181818', fontSize: 14 }}>{item.title}</div>
                    <div style={{ color: '#9a9a9a', fontSize: 12, flexShrink: 0 }}>{item.buyer}</div>
                    <div style={{ color: '#7c3aed', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{item.price}</div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* 자금 관리 바로가기 */}
        <Link href="/admin/finance" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#181818', borderRadius: 14, padding: '20px 24px', marginBottom: 36, cursor: 'pointer',
          }}>
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>💰 자금 관리</div>
              <div style={{ color: '#9a9a9a', fontSize: 13 }}>부대비용을 기록하고 일별 · 주별 · 월별 · 년도별 순이익을 확인하세요</div>
            </div>
            <span style={{ color: '#ffffff', fontSize: 20 }}>→</span>
          </div>
        </Link>

        {/* 상품 관리 */}
        <div style={{ color: '#181818', fontWeight: 700, fontSize: 18, marginBottom: 18 }}>📦 상품 관리</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {PRODUCT_TABS.map(t => (
            <button key={t} onClick={() => { setProductTab(t); setShowAddForm(false) }} style={{
              padding: '9px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
              border: `1px solid ${productTab === t ? '#4fa8e888' : '#e2e2e4'}`,
              background: productTab === t ? '#eaf6fd' : '#ffffff',
              color: productTab === t ? '#1477b8' : '#767676',
              fontWeight: productTab === t ? 700 : 400,
            }}>{TAB_EMOJI[t]} {t}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {filtered.length === 0 && (
            <div style={{ color: '#9a9a9a', textAlign: 'center', padding: '40px 0', border: '1px dashed #e2e2e4', borderRadius: 12 }}>등록된 상품이 없습니다.</div>
          )}
          {filtered.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 12, border: `1px solid ${p.active ? '#e2e2e4' : '#f0f0f0'}`, background: p.active ? '#ffffff' : '#f7f7f8', opacity: p.active ? 1 : 0.6, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5f6f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                {p.img ? <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌾'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#181818', fontWeight: 600, fontSize: 15, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ color: '#767676', fontSize: 13 }}>
                  {p.price}
                  {p.cost && <span style={{ marginLeft: 8, color: '#9a9a9a' }}>· 제품 원가 {p.cost}</span>}
                  {p.maxTickets && <span style={{ marginLeft: 12, color: '#9a9a9a' }}>{p.type === '쿠지' ? '총' : '최대'} {p.maxTickets}장</span>}
                  {p.ticketPrice && <span style={{ marginLeft: 8, color: '#9a9a9a' }}>· 응모권 {p.ticketPrice}</span>}
                  {p.durationDays && <span style={{ marginLeft: 8, color: '#9a9a9a' }}>· {p.durationDays}일간 판매</span>}
                  {p.type === '쿠지' && p.kujiItems && (
                    <span style={{ marginLeft: 8, color: '#9a9a9a' }}>· 상품 {p.kujiItems.length}개 · 하위상 {p.lowerCount ?? 0}개</span>
                  )}
                </div>
              </div>
              {/* 재고 */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: p.stock === 0 ? '#dc2626' : p.stock <= 3 ? '#d97706' : '#16a34a' }}>{p.stock}</span>
                <span style={{ fontSize: 11, color: '#9a9a9a', marginLeft: 2 }}>개</span>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0, background: p.active ? '#eaf6fd' : '#f0f0f0', color: p.active ? '#1477b8' : '#9a9a9a', border: `1px solid ${p.active ? '#bfe3fb' : '#e2e2e4'}` }}>{p.active ? '활성' : '비활성'}</div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => { toggleProductActive(p.id); setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x)) }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${p.active ? '#fecdd3' : '#bfe3fb'}`, background: p.active ? '#fff0f4' : '#eaf6fd', color: p.active ? '#e14d72' : '#1477b8' }}>{p.active ? '내리기' : '올리기'}</button>
                <button onClick={() => { removeProduct(p.id); setProducts(prev => prev.filter(x => x.id !== p.id)) }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #fecdd3', background: '#fff0f4', color: '#e14d72' }}>삭제</button>
              </div>
            </div>
          ))}
        </div>

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px dashed #d3ecfb', background: '#f5fbfe', color: '#1477b8', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            + 새 {productTab} 상품 추가
          </button>
        ) : (
          <div style={{ border: '1px solid #ececec', borderRadius: 14, background: '#ffffff', padding: '24px 24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#181818', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>{TAB_EMOJI[productTab]} {productTab} 상품 추가</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>{productTab === '쿠지' ? '쿠지 이름 *' : '상품명 *'}</div>
                <input style={lightInput} placeholder={productTab === '쿠지' ? '예: 주술회전 나오야 젠인 쿠지' : '상품 이름 입력'} value={newP.title} onChange={e => setNewP(p => ({ ...p, title: e.target.value }))} />
              </div>
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>판매가격 *</div>
                  <input style={lightInput} placeholder={productTab === '응모' ? undefined : '예: 50,000 운포인트'} value={newP.price} onChange={e => setNewP(p => ({ ...p, price: e.target.value }))} />
                </div>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>제품 원가</div>
                  <input style={lightInput} placeholder="예: 30,000원" value={newP.cost} onChange={e => setNewP(p => ({ ...p, cost: e.target.value }))} />
                </div>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>상품 이미지 (선택)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {newP.img && (
                      <img src={newP.img} alt="미리보기" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e2e4', flexShrink: 0 }} />
                    )}
                    <label style={{ ...lightInput, width: 'auto', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: newP.img ? '#181818' : '#9a9a9a' }}>
                      {newP.img ? '이미지 변경' : '📎 이미지 파일 선택'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => setNewP(p => ({ ...p, img: typeof reader.result === 'string' ? reader.result : '' }))
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                    {newP.img && (
                      <button type="button" onClick={() => setNewP(p => ({ ...p, img: '' }))} style={{ border: 'none', background: 'none', color: '#e14d72', fontSize: 12, cursor: 'pointer' }}>제거</button>
                    )}
                  </div>
                </div>
              )}
              {productTab === '쿠지' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ color: '#767676', fontSize: 12 }}>상품명 (상위상, 이미지 포함) *</div>
                    <button type="button" onClick={addKujiItem} style={{ border: '1px solid #bfe3fb', background: '#eaf6fd', color: '#1477b8', borderRadius: 8, width: 24, height: 24, fontSize: 15, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {kujiItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #ececec', borderRadius: 10, padding: 10 }}>
                        {item.img ? (
                          <img src={item.img} alt="미리보기" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f5f6f7', flexShrink: 0 }} />
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
                          <span style={{ fontSize: 12, color: '#9a9a9a' }}>개</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <input
                            style={{ ...lightInput, width: 84, textAlign: 'center', padding: '8px 6px' }}
                            placeholder="제품 원가"
                            value={item.cost}
                            onChange={e => updateKujiItem(idx, { cost: e.target.value })}
                          />
                        </div>
                        <label style={{ ...lightInput, width: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: item.img ? '#181818' : '#9a9a9a', fontSize: 12, padding: '8px 10px' }}>
                          📎 이미지
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
                          <button type="button" onClick={() => removeKujiItem(idx)} style={{ border: 'none', background: 'none', color: '#e14d72', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>삭제</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>상품 설명</div>
                  <textarea
                    style={{ ...lightInput, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="상품 상태, 구성품, 유의사항 등을 적어주세요"
                    value={newP.description}
                    onChange={e => setNewP(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              )}
              {productTab === '쿠지' && (
                <div><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>하위상 갯수 *</div><input style={lightInput} placeholder="예: 40" type="number" min="0" value={newP.stock} onChange={e => setNewP(p => ({ ...p, stock: e.target.value }))} /></div>
              )}
              {productTab !== '응모' && productTab !== '쿠지' && (
                <div><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>수량 *</div><input style={lightInput} placeholder="올릴 수량 입력 (예: 10)" type="number" min="1" value={newP.stock} onChange={e => setNewP(p => ({ ...p, stock: e.target.value }))} /></div>
              )}
              {productTab === '응모' && (
                <div>
                  <div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>최대 응모권 수 (자동 계산: 가격 ÷ 1,000)</div>
                  <div style={{ ...lightInput, background: '#f5f6f7', color: autoMaxTickets ? '#181818' : '#9a9a9a' }}>
                    {autoMaxTickets ? `${autoMaxTickets.toLocaleString()}장` : '가격을 입력하면 자동으로 계산돼요'}
                  </div>
                </div>
              )}
              {productTab === '응모' && (
                <div>
                  <div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>판매 기간 (일) *</div>
                  <input style={lightInput} placeholder="예: 3" type="number" min="1" value={newP.durationDays} onChange={e => setNewP(p => ({ ...p, durationDays: e.target.value }))} />
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9a9a9a' }}>
                    {Number(newP.durationDays) > 0
                      ? `등록 시점부터 ${newP.durationDays}일 뒤, ${new Date(Date.now() + Number(newP.durationDays) * 86400000).toLocaleDateString('ko-KR')}에 마감됩니다.`
                      : '기간이 지나면 자동으로 응모가 마감돼요.'}
                  </p>
                </div>
              )}
              {productTab === '쿠지' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>총 쿠지 종이 수 (자동 계산: 상품 수 + 하위상 갯수)</div>
                    <div style={{ ...lightInput, background: '#f5f6f7', color: kujiTotalPapers ? '#181818' : '#9a9a9a' }}>
                      {kujiTotalPapers ? `${kujiTotalPapers.toLocaleString()}장 (상품 ${kujiItemCount}개 + 하위상 ${kujiLowerCount}개)` : '상품명과 하위상 갯수를 입력하면 계산돼요'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>응모권 가격</div><input style={lightInput} placeholder="기본값: 1,000 운포인트" value={newP.ticketPrice} onChange={e => setNewP(p => ({ ...p, ticketPrice: e.target.value }))} /></div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => {
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
                  stock: productTab === '응모' ? 1 : (Number(newP.stock) || 1),
                  ...(productTab === '응모'
                    ? { maxTickets: autoMaxTickets || 50, ticketPrice: '1,000 운포인트', description: newP.description, durationDays: Number(newP.durationDays) || 3 }
                    : productTab === '쿠지'
                    ? { maxTickets: kujiTotalPapers || 50, ticketPrice: newP.ticketPrice || '1,000 운포인트', kujiItems: kujiItems.filter(it => it.name.trim()), lowerCount: kujiLowerCount }
                    : { description: newP.description }),
                } as Product
                addProduct(newProduct)
                setProducts(prev => [...prev, newProduct])
                setNextId(n => n + 1)
                setNewP({ title: '', price: '', cost: '', img: '', stock: '', maxTickets: '', ticketPrice: '1,000 운포인트', description: '', durationDays: '3' })
                setKujiItems([{ name: '', img: '', count: '1', cost: '' }])
                setShowAddForm(false)
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#181818', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>추가하기</button>
              <button onClick={() => { setShowAddForm(false); setNewP({ title: '', price: '', cost: '', img: '', stock: '', maxTickets: '', ticketPrice: '1,000 운포인트', description: '', durationDays: '3' }); setKujiItems([{ name: '', img: '', count: '1', cost: '' }]) }} style={{ padding: '11px 24px', borderRadius: 10, border: '1px solid #e2e2e4', background: '#f5f6f7', color: '#767676', fontSize: 14, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
