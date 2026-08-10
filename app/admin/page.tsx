'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyAdmin, ApiError } from '@/lib/api'

interface SaleItem { type: string; title: string; buyer: string; price: string }
type ProductType = '응모' | '쿠지' | '상점(운포인트)' | '상점(쌀포인트)'
interface Product { id: number; type: ProductType; title: string; price: string; img: string; active: boolean; stock: number; maxTickets?: number; ticketPrice?: string }

// ── Mock Data ──────────────────────────────────────────────
const DAILY_REV: Record<string, number> = {
  '2026-07-01': 389000, '2026-07-02': 612000, '2026-07-03': 478000,
  '2026-07-04': 325000, '2026-07-05': 189000, '2026-07-06': 534000,
  '2026-07-07': 721000, '2026-07-08': 398000, '2026-07-09': 265000,
  '2026-07-10': 489000, '2026-07-11': 634000, '2026-07-12': 312000,
  '2026-07-13': 578000, '2026-07-14': 423000, '2026-07-15': 267000,
  '2026-07-16': 541000, '2026-07-17': 398000, '2026-07-18': 712000,
  '2026-07-19': 289000, '2026-07-20': 456000, '2026-07-21': 623000,
  '2026-07-22': 345000, '2026-07-23': 578000, '2026-07-24': 234000,
  '2026-07-25': 467000, '2026-07-26': 312000, '2026-07-27': 689000,
  '2026-07-28': 384000, '2026-07-29': 521000, '2026-07-30': 293000,
  '2026-07-31': 617000,
  '2026-08-01': 748000, '2026-08-02': 432000, '2026-08-03': 195000,
  '2026-08-04': 863000, '2026-08-05': 576000, '2026-08-06': 941000,
}

const MONTHLY_REV: Record<string, number> = {
  '2025-09': 2840000, '2025-10': 3670000, '2025-11': 4320000, '2025-12': 6180000,
  '2026-01': 5240000, '2026-02': 7810000, '2026-03': 6430000, '2026-04': 9250000,
  '2026-05': 8120000, '2026-06': 11430000, '2026-07': 10870000, '2026-08': 3760000,
}

const DAILY_SALES: Record<string, SaleItem[]> = {
  '2026-08-06': [
    { type: '응모', title: '아이폰 14 Pro 256GB 스페이스 블랙', buyer: 'user_2847', price: '650,000 운포인트' },
    { type: '상점', title: '인기 캐릭터 아크릴 스탠드', buyer: 'user_1023', price: '18,000 운포인트' },
    { type: '쿠지', title: '주술회전 나오야 젠인 쿠지', buyer: 'user_3391', price: '10,000 운포인트' },
    { type: '응모', title: '플레이스테이션 5 디스크 에디션', buyer: 'user_0584', price: '450,000 운포인트' },
    { type: '상점', title: '캐릭터 굿즈 스티커 세트', buyer: 'user_2210', price: '12,000 운포인트' },
  ],
  '2026-08-05': [
    { type: '쿠지', title: '원피스 A상 루피 쿠지', buyer: 'user_1748', price: '10,000 운포인트' },
    { type: '응모', title: '에어팟 프로 2세대', buyer: 'user_3902', price: '180,000 운포인트' },
    { type: '상점', title: 'PS5 듀얼센스 무선 컨트롤러', buyer: 'user_0091', price: '78,000 운포인트' },
  ],
  '2026-08-04': [
    { type: '응모', title: '닌텐도 스위치 OLED', buyer: 'user_2215', price: '280,000 운포인트' },
    { type: '쿠지', title: '귀멸의 칼날 최애의 쿠지', buyer: 'user_4412', price: '10,000 운포인트' },
    { type: '상점', title: '데스크용 미니 피규어', buyer: 'user_1902', price: '25,000 운포인트' },
    { type: '응모', title: '갤럭시 워치 6 클래식', buyer: 'user_0773', price: '220,000 운포인트' },
  ],
  '2026-08-02': [
    { type: '상점', title: '아이폰 14 Pro 투명 케이스', buyer: 'user_2984', price: '15,000 운포인트' },
    { type: '쿠지', title: '산리오 캐릭터즈 쿠지', buyer: 'user_3315', price: '10,000 운포인트' },
  ],
  '2026-08-01': [
    { type: '쿠지', title: '명탐정 코난 랜덤 쿠지', buyer: 'user_1188', price: '10,000 운포인트' },
    { type: '응모', title: '소니 WH-1000XM5', buyer: 'user_2241', price: '250,000 운포인트' },
  ],
  '2026-07-31': [
    { type: '응모', title: '소니 ZV-E10 미러리스', buyer: 'user_1122', price: '380,000 운포인트' },
    { type: '쿠지', title: '드래곤볼 갓 오브 데스티니 쿠지', buyer: 'user_3387', price: '10,000 운포인트' },
  ],
  '2026-07-30': [
    { type: '상점', title: '인기 캐릭터 아크릴 스탠드', buyer: 'user_0441', price: '18,000 운포인트' },
    { type: '응모', title: '아이패드 Air 5세대', buyer: 'user_2819', price: '480,000 운포인트' },
  ],
}

const TODAY = '2026-08-06'
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

// ── Product Data ───────────────────────────────────────────
const INIT_PRODUCTS: Product[] = [
  { id: 1, type: '응모', title: '아이폰 14 Pro 256GB 스페이스 블랙', price: '650,000 운포인트', img: '/images/iphone14pro.jpg', active: true, stock: 3, maxTickets: 50, ticketPrice: '1,000 운포인트' },
  { id: 2, type: '응모', title: '플레이스테이션 5 디스크 에디션', price: '450,000 운포인트', img: '/images/ps5.jpg', active: true, stock: 2, maxTickets: 50, ticketPrice: '1,000 운포인트' },
  { id: 3, type: '응모', title: '에어팟 프로 2세대', price: '180,000 운포인트', img: '/images/demo-4.jpg', active: true, stock: 5, maxTickets: 50, ticketPrice: '1,000 운포인트' },
  { id: 4, type: '쿠지', title: '주술회전 나오야 젠인 쿠지', price: '10,000 운포인트', img: '/images/naoya.jpg', active: true, stock: 2, maxTickets: 50, ticketPrice: '10,000 운포인트' },
  { id: 5, type: '쿠지', title: '원피스 A상 루피 쿠지', price: '10,000 운포인트', img: '/images/demo-5.jpg', active: true, stock: 1, maxTickets: 50, ticketPrice: '10,000 운포인트' },
  { id: 6, type: '상점(운포인트)', title: '캐릭터 굿즈 스티커 세트', price: '12,000 운포인트', img: '/images/demo-1.jpg', active: true, stock: 15 },
  { id: 7, type: '상점(운포인트)', title: '인기 캐릭터 아크릴 스탠드', price: '18,000 운포인트', img: '/images/demo-2.jpg', active: true, stock: 8 },
  { id: 9, type: '상점(운포인트)', title: '데스크용 미니 피규어', price: '25,000 운포인트', img: '/images/demo-4.jpg', active: true, stock: 0 },
  { id: 8, type: '상점(쌀포인트)', title: '쌀포인트 특별 상품', price: '10,000 쌀포인트', img: '', active: true, stock: 20 },
]
const PRODUCT_TABS: ProductType[] = ['응모', '쿠지', '상점(운포인트)', '상점(쌀포인트)']
const TAB_EMOJI: Record<ProductType, string> = { '응모': '🎟', '쿠지': '🎁', '상점(운포인트)': '🎰', '상점(쌀포인트)': '🌾' }
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
  const [products, setProducts] = useState<Product[]>(INIT_PRODUCTS)
  const [showAddForm, setShowAddForm] = useState(false)
  const [nextId, setNextId] = useState(100)
  const [newP, setNewP] = useState({ title: '', price: '', img: '', stock: '', maxTickets: '', ticketPrice: '1,000 운포인트' })

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
                  {p.maxTickets && <span style={{ marginLeft: 12, color: '#9a9a9a' }}>최대 {p.maxTickets}장</span>}
                  {p.ticketPrice && <span style={{ marginLeft: 8, color: '#9a9a9a' }}>· 응모권 {p.ticketPrice}</span>}
                </div>
              </div>
              {/* 재고 */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: p.stock === 0 ? '#dc2626' : p.stock <= 3 ? '#d97706' : '#16a34a' }}>{p.stock}</span>
                <span style={{ fontSize: 11, color: '#9a9a9a', marginLeft: 2 }}>개</span>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0, background: p.active ? '#eaf6fd' : '#f0f0f0', color: p.active ? '#1477b8' : '#9a9a9a', border: `1px solid ${p.active ? '#bfe3fb' : '#e2e2e4'}` }}>{p.active ? '활성' : '비활성'}</div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${p.active ? '#fecdd3' : '#bfe3fb'}`, background: p.active ? '#fff0f4' : '#eaf6fd', color: p.active ? '#e14d72' : '#1477b8' }}>{p.active ? '내리기' : '올리기'}</button>
                <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #fecdd3', background: '#fff0f4', color: '#e14d72' }}>삭제</button>
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
              <div><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>상품명 *</div><input style={lightInput} placeholder="상품 이름 입력" value={newP.title} onChange={e => setNewP(p => ({ ...p, title: e.target.value }))} /></div>
              <div><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>가격 *</div><input style={lightInput} placeholder="예: 50,000 운포인트" value={newP.price} onChange={e => setNewP(p => ({ ...p, price: e.target.value }))} /></div>
              <div><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>이미지 경로 (선택)</div><input style={lightInput} placeholder="예: /images/product.jpg" value={newP.img} onChange={e => setNewP(p => ({ ...p, img: e.target.value }))} /></div>
              <div><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>수량 *</div><input style={lightInput} placeholder="올릴 수량 입력 (예: 10)" type="number" min="1" value={newP.stock} onChange={e => setNewP(p => ({ ...p, stock: e.target.value }))} /></div>
              {(productTab === '응모' || productTab === '쿠지') && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>최대 응모권 수</div><input style={lightInput} placeholder="기본값: 50" type="number" value={newP.maxTickets} onChange={e => setNewP(p => ({ ...p, maxTickets: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><div style={{ color: '#767676', fontSize: 12, marginBottom: 5 }}>응모권 가격</div><input style={lightInput} placeholder="기본값: 1,000 운포인트" value={newP.ticketPrice} onChange={e => setNewP(p => ({ ...p, ticketPrice: e.target.value }))} /></div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => {
                if (!newP.title.trim() || !newP.price.trim()) return
                setProducts(prev => [...prev, { id: nextId, type: productTab, title: newP.title, price: newP.price, img: newP.img, active: true, stock: Number(newP.stock) || 1, ...(productTab === '응모' || productTab === '쿠지' ? { maxTickets: newP.maxTickets ? Number(newP.maxTickets) : 50, ticketPrice: newP.ticketPrice || '1,000 운포인트' } : {}) } as Product])
                setNextId(n => n + 1)
                setNewP({ title: '', price: '', img: '', stock: '', maxTickets: '', ticketPrice: '1,000 운포인트' })
                setShowAddForm(false)
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#181818', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>추가하기</button>
              <button onClick={() => { setShowAddForm(false); setNewP({ title: '', price: '', img: '', stock: '', maxTickets: '', ticketPrice: '1,000 운포인트' }) }} style={{ padding: '11px 24px', borderRadius: 10, border: '1px solid #e2e2e4', background: '#f5f6f7', color: '#767676', fontSize: 14, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
