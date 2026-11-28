'use client'

import { useEffect, useState } from 'react'
import { productInfoTemplate } from '@/lib/productInfo'
import Link from 'next/link'
import {
  CoinsIcon,
  DotsSixVerticalIcon,
  GiftIcon,
  GrainsIcon,
  PaperclipIcon,
  TicketIcon,
} from '@phosphor-icons/react'
import { ApiError, closeKujiSet, getRaffleProducts, createRaffleProduct, type RaffleProductResponse, getStoreProducts, createStoreProduct, getKujiSetsAdmin, createKujiSet, type KujiSetAdminResponse, STORE_CATEGORIES, type StoreCategory, type StoreProductResponse } from '@/lib/api'
import { isRegular, isSoldOut } from '@/lib/storeStock'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import {
  PRODUCT_TABS,
  type ProductType, type KujiItem, type Product,
} from '@/lib/adminProducts'
import { fetchCatalog, type CatalogItem } from '@/lib/catalog'
import { cancelRaffle, closeKuji, deleteStore, setStoreStock } from '@/lib/productActions'
import CatalogPicker from '@/components/admin/CatalogPicker'
import { fetchSalesSnapshot, formatSaleTime, type SaleLogEntry, type SalesSnapshot } from '@/lib/adminSales'

// 판매 상태 탭 — 판매중: 지금 팔고 있음 / 판매완료: 한 번이라도 팔린 것(팔리는 순간부터, 판매중과 겹칠 수 있음) /
// 내린 상품: 하나도 안 팔리고 끝난 것(응모 실패 · 관리자 취소 · 안 팔린 채 판매 종료)
type SaleFilter = 'selling' | 'done' | 'ended'
const SALE_FILTERS: [SaleFilter, string, string][] = [
  ['selling', '판매중', '판매중인 상품이 없어요.'],
  ['done', '판매완료', '아직 팔린 상품이 없어요.'],
  ['ended', '내린 상품', '안 팔리고 내린 상품이 없어요.'],
]

type KujiTier = 'upper' | 'lower'

// 미리보기용 사진 주소(data URL 또는 등록 상품 사진 URL)를 업로드할 파일로 바꾼다
const urlToBlob = async (url: string) => (url ? await (await fetch(url)).blob() : undefined)

const TAB_ICON: Record<ProductType, React.ReactNode> = {
  '응모': <TicketIcon size={13} weight="fill" />,
  '쿠지': <GiftIcon size={13} weight="fill" />,
  '상점(일반)': <CoinsIcon size={13} weight="fill" />,
  '상점(쌀포인트)': <GrainsIcon size={13} weight="fill" />,
}
const ADMIN_PAGE_SIZE = 10
const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

// ── 상품 게시 ─────────────────────────────────────────────
// "상품 등록"(app/admin/catalog)에 올려 둔 상품을 골라 응모 · 쿠지 · 상점에 올린다. 원가는 사이트에서 관리하지 않는다.
// 팔린 개수는 장부 기록으로 센다(lib/adminSales.ts) — 판매중 / 판매완료 / 내린 상품 탭
// 관리자 확인은 app/admin/layout.tsx(AdminShell)가 한다
export default function AdminProductsPage() {
  const adminToken: string | null = useAdminToken()
  const authChecked = true

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
    getStoreProducts(undefined, true)
      .then(setStoreProducts)
      .catch((err) => setStoreListError(err instanceof ApiError ? err.message : '상점 상품 목록을 불러오지 못했습니다.'))
  }

  const [kujiSets, setKujiSets] = useState<KujiSetAdminResponse[]>([])
  const [kujiListError, setKujiListError] = useState<string | null>(null)

  function reloadKujiSets() {
    if (!adminToken) return
    getKujiSetsAdmin(adminToken)
      .then(setKujiSets)
      .catch((err) => setKujiListError(err instanceof ApiError ? err.message : '쿠지 목록을 불러오지 못했습니다.'))
  }

  useEffect(() => {
    if (!authChecked) return
    reloadRaffleProducts()
    reloadStoreProducts()
  }, [authChecked])

  // 상점 상품별 팔린 개수 (서버 상품 목록에는 없어서 장부 기록으로 센다 — lib/adminSales.ts)
  const [sales, setSales] = useState<SalesSnapshot | null>(null)
  const [salesError, setSalesError] = useState(false)
  function reloadSales() {
    if (!adminToken) return
    fetchSalesSnapshot(adminToken)
      .then(s => { setSales(s); setSalesError(false) })
      .catch(() => setSalesError(true))
  }

  useEffect(() => {
    if (authChecked && adminToken) { reloadKujiSets(); reloadSales() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, adminToken])

  const [productTab, setProductTab] = useState<ProductType>('응모')
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('selling')
  const [productPage, setProductPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newP, setNewP] = useState({ title: '', price: '', img: '', stock: '', maxTickets: '', ticketPrice: '10,000원', description: '' })
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [deadlineDays, setDeadlineDays] = useState(1)
  const [storeCategory, setStoreCategory] = useState<StoreCategory | null>(null)
  const [fundingDisabled, setFundingDisabled] = useState(false)   // 결제 상점: 응모 전환 막기 (랜덤 상품 등)
  // 상점(결제·쌀포인트): 판매 방식 — 한정(올린 개수만큼, 다 팔리면 매진) / 일반(개수 없이 계속 판매). lib/storeStock.ts
  const [saleMode, setSaleMode] = useState<'limited' | 'regular'>('limited')
  const [raffleSubmitting, setRaffleSubmitting] = useState(false)
  const [raffleSubmitError, setRaffleSubmitError] = useState<string | null>(null)
  const autoMaxTickets = Math.floor((Number(newP.price.replace(/[^0-9]/g, '')) || 0) / 1000)

  // 등록 상품에서 고르기 — 응모·상점은 상품 하나, 쿠지는 상 한 줄마다(KujiItem.itemId)
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(null)
  const [pickedItemId, setPickedItemId] = useState<number | null>(null)
  const pickedItem = catalog?.find(i => i.id === pickedItemId) ?? null
  useEffect(() => {
    if (showAddForm && catalog === null && adminToken) fetchCatalog(adminToken).then(setCatalog).catch(() => setCatalog([]))
  }, [showAddForm, adminToken, catalog])

  // 고른 상품으로 상품명·사진·설명을 채운다 (사진은 게시할 때 파일로 바꿔 올린다).
  // 설명 칸 = 등록 상품 설명(상품정보제공고시) — 게시할 상품에만 붙일 부가 설명은 그 위에 적으면 된다
  const pickForProduct = (item: CatalogItem | null) => {
    setPickedItemId(item?.id ?? null)
    if (!item) return
    setNewP(p => ({ ...p, title: item.name, img: item.imageUrl ?? p.img, description: item.description || p.description }))
    if (item.imageUrl) setNewImageFile(null)
  }

  // "상품 등록"의 "게시하기"로 들어오면 (?item=id) 바로 그 상품을 고른 채로 게시 폼을 연다
  const [linkedItemId, setLinkedItemId] = useState<number | null>(null)
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('item'))
    if (id > 0) { setLinkedItemId(id); setShowAddForm(true) }
  }, [])
  useEffect(() => {
    if (linkedItemId == null || !catalog) return
    const item = catalog.find(i => i.id === linkedItemId)
    if (item) pickForProduct(item)
    setLinkedItemId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedItemId, catalog])

  // 판매 종료 · 수량 조정 (lib/productActions.ts)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const runProductAction = async (key: string, fn: () => Promise<void>) => {
    if (!adminToken || actionBusy) return
    setActionBusy(key)
    try {
      await fn()
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리 중 오류가 발생했어요.')
    } finally {
      setActionBusy(null)
    }
  }
  const actionBtn = (danger: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: actionBusy ? 'default' : 'pointer', whiteSpace: 'nowrap',
    border: `1px solid ${danger ? 'var(--danger-tint-border)' : 'var(--border-strong)'}`,
    background: danger ? 'var(--danger-tint)' : 'var(--surface)',
    color: danger ? 'var(--danger)' : 'var(--text-secondary)',
    opacity: actionBusy ? 0.6 : 1,
  })

  // 목록 한 줄에 보여줄 상태 — 종류마다 중요한 숫자가 다르다 (응모: 팔린 장수·마감, 쿠지: 남은 장수, 상점: 수량)
  function productStatus(p: Product): { meta: string; figure: string; sub: string; progress: number | null; tone: string; ended: boolean } {
    const left = (sec: number) => (sec >= 86400 ? `${Math.floor(sec / 86400)}일 ${Math.floor((sec % 86400) / 3600)}시간` : sec >= 3600 ? `${Math.floor(sec / 3600)}시간` : `${Math.max(1, Math.floor(sec / 60))}분`)
    if (p.type === '응모') {
      const rp = raffleProducts.find(r => r.raffle_product_id === p.id)
      if (!rp) return { meta: p.price, figure: '-', sub: '', progress: null, tone: 'var(--text)', ended: false }
      const sub = rp.status === 'completed' ? '추첨 완료'
        : rp.status === 'cancelled' ? '취소됨'
        : rp.remaining_slots <= 0 ? '매진 · 추첨 대기'
        : rp.remaining_seconds > 0 ? `마감까지 ${left(rp.remaining_seconds)}`
        : '마감 · 취소 처리 중'
      const urgent = rp.status === 'open' && rp.remaining_slots > 0 && rp.remaining_seconds > 0 && rp.remaining_seconds < 86400
      return {
        meta: `상품가 ${rp.price_krw.toLocaleString()}원 · 응모권 ${rp.ticket_price.toLocaleString()}원`,
        figure: `${rp.sold_slots} / ${rp.total_slots}장`,
        sub,
        progress: rp.total_slots > 0 ? rp.sold_slots / rp.total_slots : 0,
        tone: urgent ? 'var(--accent-fg)' : 'var(--text)',
        ended: rp.status !== 'open',
      }
    }
    if (p.type === '쿠지') {
      const ks = kujiSets.find(k => k.kuji_set_id === p.id)
      if (!ks) return { meta: p.price, figure: '-', sub: '', progress: null, tone: 'var(--text)', ended: false }
      const upper = ks.prizes.filter(x => x.tier === 'upper').length
      const lower = ks.prizes.filter(x => x.tier === 'lower').reduce((n, x) => n + x.quantity, 0)
      return {
        meta: `1장 ${ks.ticket_price.toLocaleString()}원 · 상위상 ${upper}종 · 하위상 ${lower}개${ks.last_one_name ? ' · 라스트원' : ''}`,
        figure: `남은 ${ks.remaining_tickets} / ${ks.total_tickets}장`,
        sub: ks.status === 'open' ? '판매 중' : ks.status === 'sold_out' ? '매진' : '판매 종료',
        progress: ks.total_tickets > 0 ? (ks.total_tickets - ks.remaining_tickets) / ks.total_tickets : 0,
        tone: 'var(--text)',
        ended: ks.status !== 'open',
      }
    }
    const sp = storeProducts.find(s => s.store_product_id === p.id)
    if (!sp) return { meta: p.price, figure: '-', sub: '', progress: null, tone: 'var(--text)', ended: false }
    const category = STORE_CATEGORIES[sp.pay_type].find(c => c.id === sp.category)?.label
    const soldN = sales?.storeSold.get(sp.store_product_id) ?? 0
    const storeMeta = `${sp.pay_type === 'cash' ? `${sp.price.toLocaleString()}원` : `${sp.price.toLocaleString()} 쌀포인트`}${category ? ` · ${category}` : ''}`
    const soldNote = soldN > 0 ? ` · ${soldN}개 판매` : ''
    return {
      meta: storeMeta,
      figure: isRegular(sp) ? '일반' : `${sp.stock}개`,
      sub: (isRegular(sp) ? '수량 제한 없이 판매 중' : sp.stock > 0 ? '한정 · 판매 중' : '매진 · 판매 종료') + soldNote,
      progress: null,
      tone: isRegular(sp) ? 'var(--text)' : sp.stock === 0 ? 'var(--danger)' : sp.stock <= 3 ? 'var(--gold)' : 'var(--text)',
      ended: isSoldOut(sp),
    }
  }

  function renderProductActions(p: Product) {
    const key = `${p.type}-${p.id}`
    if (p.type === '응모') {
      const rp = raffleProducts.find(r => r.raffle_product_id === p.id)
      if (!rp) return null
      // 상태는 가운데 칸(productStatus)에 이미 보이니, 할 수 있는 일이 없으면 비워 둔다
      if (rp.status !== 'open' || rp.remaining_slots <= 0) return null
      return (
        <button
          disabled={!!actionBusy}
          style={actionBtn(true)}
          onClick={() => {
            if (!confirm(`"${rp.product_name}" 응모를 취소할까요?\n\n지금까지 응모권을 산 ${rp.sold_slots}장은 모두 전액 환불돼요. 되돌릴 수 없어요.`)) return
            runProductAction(key, async () => {
              const updated = await cancelRaffle(adminToken!, rp)
              setRaffleProducts(prev => prev.map(r => (r.raffle_product_id === rp.raffle_product_id ? updated : r)))
            })
          }}
        >
          {actionBusy === key ? '취소 중...' : '응모 취소'}
        </button>
      )
    }
    if (p.type === '쿠지') {
      const ks = kujiSets.find(k => k.kuji_set_id === p.id)
      if (!ks) return null
      if (ks.status !== 'open') return null
      return (
        <button
          disabled={!!actionBusy}
          style={actionBtn(true)}
          onClick={() => {
            if (!confirm(`"${ks.title}" 쿠지 판매를 끝낼까요?\n\n남은 제비 ${ks.remaining_tickets}장은 더 팔지 않아요. 이미 뽑힌 상품은 그대로예요. 되돌릴 수 없어요.`)) return
            runProductAction(key, async () => {
              const updated = await closeKuji(adminToken!, ks)
              setKujiSets(prev => prev.map(k => (k.kuji_set_id === ks.kuji_set_id ? updated : k)))
            })
          }}
        >
          {actionBusy === key ? '종료 중...' : '판매 종료'}
        </button>
      )
    }
    const sp = storeProducts.find(s => s.store_product_id === p.id)
    if (!sp) return null
    const changeStock = (next: number) => runProductAction(key, async () => {
      const updated = await setStoreStock(adminToken!, sp, next)
      setStoreProducts(prev => prev.map(s => (s.store_product_id === sp.store_product_id ? updated : s)))
    })
    const regular = isRegular(sp)
    return (
      <>
        {/* 한정 상품만 개수가 있다 — 일반 상품은 개수 없이 팔다가 내리고 싶으면 삭제 */}
        {!regular && (
          <button
            disabled={!!actionBusy}
            style={actionBtn(false)}
            onClick={() => {
              const input = prompt(`"${sp.product_name}" 남은 수량을 몇 개로 바꿀까요?\n지금 ${sp.stock}개 (0 = 판매 종료)`, String(sp.stock))
              if (input == null) return
              const next = Number(input.replace(/[^0-9]/g, ''))
              if (!Number.isInteger(next) || input.trim() === '') return alert('숫자로 적어주세요.')
              if (next === sp.stock) return
              changeStock(next)
            }}
          >
            {actionBusy === key ? '바꾸는 중...' : '수량 조정'}
          </button>
        )}
        {!regular && sp.stock > 0 && (
          <button
            disabled={!!actionBusy}
            style={actionBtn(true)}
            onClick={() => {
              if (!confirm(`"${sp.product_name}" 판매를 끝낼까요?\n남은 ${sp.stock}개를 더 팔지 않아요.`)) return
              changeStock(0)
            }}
          >
            판매 종료
          </button>
        )}
        {(regular || sp.stock === 0) && (
          <button
            disabled={!!actionBusy}
            style={actionBtn(true)}
            onClick={() => {
              if (!confirm(`"${sp.product_name}" 상품을 상점에서 내릴까요?\n상점 목록에서 사라지고, 이미 구매한 사람의 보관함 내역은 그대로 남아요. 등록 상품은 남아 있어서 다음에 다시 게시할 수 있어요.`)) return
              runProductAction(`${key}-delete`, async () => {
                await deleteStore(adminToken!, sp)
                setStoreProducts(prev => prev.filter(s => s.store_product_id !== sp.store_product_id))
                reloadSales()   // 팔린 적 있으면 판매완료에 "상점에서 내림"으로 남는다
              })
            }}
          >
            {actionBusy === `${key}-delete` ? '내리는 중...' : regular ? '판매 종료' : '삭제'}
          </button>
        )}
      </>
    )
  }

  function resetNewProductForm() {
    setPickedItemId(null)
    setNewP({ title: '', price: '', img: '', stock: '', maxTickets: '', ticketPrice: '10,000원', description: '' })
    setSaleMode('limited')
    setNewImageFile(null)
    setDeadlineDays(1)
    setStoreCategory(null)
    setFundingDisabled(false)
    setKujiItems([{ name: '', img: '', count: '1' }])
    setLowerItems([{ name: '', img: '', count: '1' }])
    setLastOneItem({ name: '', img: '' })
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
      price: `${rp.price_krw.toLocaleString()}원`,
      img: rp.image_url ?? '',
      active: rp.is_open,
      stock: 1,
      maxTickets: rp.total_slots,
      ticketPrice: `${rp.ticket_price.toLocaleString()}원`,
      description: rp.description ?? undefined,
      deadlineLabel,
    }
  }

  function storeToProduct(sp: StoreProductResponse): Product {
    return {
      id: sp.store_product_id,
      type: sp.pay_type === 'cash' ? '상점(일반)' : '상점(쌀포인트)',
      title: sp.product_name,
      price: sp.pay_type === 'cash' ? `${sp.price.toLocaleString()}원` : `${sp.price.toLocaleString()} 쌀포인트`,
      img: sp.image_url ?? '',
      active: true,
      stock: sp.stock,
      description: sp.description ?? undefined,
    }
  }
  function kujiToProduct(ks: KujiSetAdminResponse): Product {
    const toItem = (p: KujiSetAdminResponse['prizes'][number]) => ({ name: p.name, img: p.image_url ?? '', count: String(p.quantity) })
    const lower = ks.prizes.filter(p => p.tier === 'lower')
    return {
      id: ks.kuji_set_id,
      type: '쿠지',
      title: ks.title,
      price: `${ks.ticket_price.toLocaleString()}원`,
      img: ks.image_url ?? '',
      active: ks.status === 'open',
      stock: ks.remaining_tickets,
      maxTickets: ks.total_tickets,
      ticketPrice: `${ks.ticket_price.toLocaleString()}원`,
      kujiItems: ks.prizes.filter(p => p.tier === 'upper').map(toItem),
      lowerItems: lower.map(toItem),
      lowerCount: lower.reduce((sum, p) => sum + p.quantity, 0),
      lastOne: ks.last_one_name ? { name: ks.last_one_name, img: ks.last_one_image_url ?? '' } : undefined,
    }
  }

  // 쿠지 구성 — 상위상·하위상 모두 상품명·사진·개수를 한 줄씩 (등록 상품에서 고르거나 직접 적기)
  const [kujiItems, setKujiItems] = useState<KujiItem[]>([{ name: '', img: '', count: '1' }])
  const [lowerItems, setLowerItems] = useState<KujiItem[]>([{ name: '', img: '', count: '1' }])
  const toNum = (s: string) => Number(s.replace(/[^0-9]/g, '')) || 0
  const filledItems = (list: KujiItem[]) => list.filter(it => it.name.trim())
  // 쌀포인트 상 이름 — "쌀포인트 500P" (숫자를 안 적었으면 빈 이름 → 빈 줄로 본다)
  const pointPrizeName = (points: string) => (toNum(points) > 0 ? `쌀포인트 ${toNum(points).toLocaleString()}P` : '')
  const sumCount = (list: KujiItem[]) => filledItems(list).reduce((sum, it) => sum + (Number(it.count) || 1), 0)
  const kujiItemCount = sumCount(kujiItems)
  const kujiLowerCount = sumCount(lowerItems)
  const kujiTotalPapers = kujiItemCount + kujiLowerCount
  // 라스트원상 — 제비가 아니라 마지막 장을 뽑은 사람에게 추가로 주는 상이라 장수에는 안 들어간다
  const [lastOneItem, setLastOneItem] = useState<{ name: string; img: string; itemId?: number }>({ name: '', img: '' })
  const kujiTicketPrice = toNum(newP.ticketPrice) || 10000
  const kujiRevenue = kujiTotalPapers * kujiTicketPrice

  // 상위상 ↔ 하위상 끌어서 옮기기 — 줄 왼쪽 손잡이를 잡고 다른 줄 위(그 자리 앞) 또는 목록 빈 곳(맨 뒤)에 놓는다
  const [draggingKuji, setDraggingKuji] = useState<{ tier: KujiTier; idx: number } | null>(null)
  const [kujiDropTarget, setKujiDropTarget] = useState<{ tier: KujiTier; idx: number } | null>(null)
  const isBlankKujiRow = (it: KujiItem) => !it.name.trim() && !it.img

  function moveKujiItem(from: KujiTier, fromIdx: number, to: KujiTier, toIdx: number) {
    const lists = { upper: kujiItems, lower: lowerItems }
    const setters = { upper: setKujiItems, lower: setLowerItems }
    const src = [...lists[from]]
    if (to === 'upper' && lists[from][fromIdx]?.kind === 'point') return   // 쌀포인트 상은 하위상에만
    const [item] = src.splice(fromIdx, 1)
    if (!item) return
    if (from === to) {
      src.splice(fromIdx < toIdx ? toIdx - 1 : toIdx, 0, item)
      setters[from](src)
      return
    }
    // 받는 쪽이 빈 줄 하나뿐이면 그 줄을 대신한다
    const dst = lists[to].length === 1 && isBlankKujiRow(lists[to][0]) ? [] : [...lists[to]]
    dst.splice(Math.min(toIdx, dst.length), 0, item)
    setters[from](src.length ? src : [{ name: '', img: '', count: '1' }])
    setters[to](dst)
  }

  function endKujiDrag() {
    setDraggingKuji(null)
    setKujiDropTarget(null)
  }

  // 상위상·하위상 입력 줄 — 등급은 순서대로 A, B, … (하위상은 상위상 다음 글자부터)
  function renderKujiRows({ tier, label, list, setList, gradeStart, placeholder }: {
    tier: KujiTier
    label: string
    list: KujiItem[]
    setList: React.Dispatch<React.SetStateAction<KujiItem[]>>
    gradeStart: number
    placeholder: string
  }) {
    const update = (idx: number, patch: Partial<KujiItem>) =>
      setList(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
    const dropOn = (idx: number) => (e: React.DragEvent) => {
      if (!draggingKuji) return
      e.preventDefault()
      e.stopPropagation()
      moveKujiItem(draggingKuji.tier, draggingKuji.idx, tier, idx)
      endKujiDrag()
    }
    const hoverOn = (idx: number) => (e: React.DragEvent) => {
      if (!draggingKuji) return
      e.preventDefault()
      e.stopPropagation()
      if (kujiDropTarget?.tier !== tier || kujiDropTarget.idx !== idx) setKujiDropTarget({ tier, idx })
    }
    const listDropActive = kujiDropTarget?.tier === tier && kujiDropTarget.idx === list.length
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{label}</div>
          <button
            type="button"
            aria-label={`${label.split(' ')[0]} 추가`}
            onClick={() => setList(prev => [...prev, { name: '', img: '', count: '1' }])}
            style={{ border: '1px solid var(--accent-tint-border)', background: 'var(--accent-tint)', color: 'var(--accent-fg)', borderRadius: 8, width: 24, height: 24, fontSize: 15, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}
          >+</button>
        </div>
        <div
          onDragOver={hoverOn(list.length)}
          onDrop={dropOn(list.length)}
          style={{
            display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 12,
            padding: draggingKuji ? 6 : 0,
            outline: draggingKuji ? `2px dashed ${listDropActive ? 'var(--accent)' : 'var(--border-strong)'}` : 'none',
            background: listDropActive ? 'var(--accent-tint)' : 'transparent',
            transition: 'background-color 0.12s',
          }}
        >
          {list.map((item, idx) => {
            const isDragging = draggingKuji?.tier === tier && draggingKuji.idx === idx
            const isDropBefore = kujiDropTarget?.tier === tier && kujiDropTarget.idx === idx && !isDragging
            return (
            <div
              key={idx}
              data-kuji-row
              onDragOver={hoverOn(idx)}
              onDrop={dropOn(idx)}
              style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, border: '1px solid var(--border)', borderRadius: 10, padding: 10,
                background: 'var(--surface)',
                opacity: isDragging ? 0.4 : 1,
                boxShadow: isDropBefore ? '0 -3px 0 0 var(--accent)' : 'none',
              }}
            >
              <span
                draggable
                title="끌어서 상위상·하위상으로 옮기기"
                aria-label="끌어서 옮기기"
                onDragStart={e => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', `${tier}:${idx}`)
                  const row = e.currentTarget.closest('[data-kuji-row]')
                  if (row instanceof HTMLElement) e.dataTransfer.setDragImage(row, 20, 20)
                  setDraggingKuji({ tier, idx })
                }}
                onDragEnd={endKujiDrag}
                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', cursor: 'grab', color: 'var(--text-tertiary)', padding: '4px 0', touchAction: 'none' }}
              >
                <DotsSixVerticalIcon size={18} weight="bold" />
              </span>
              <span style={{ flexShrink: 0, minWidth: 34, textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--gold)', background: 'var(--gold-tint)', border: '1px solid var(--gold-tint-border)', borderRadius: 6, padding: '4px 6px' }}>
                {String.fromCharCode(65 + gradeStart + idx)}상
              </span>
              {tier === 'lower' && (
                // 하위상만 — 실물 상품 대신 쌀포인트로 줄 수 있다
                <span role="group" aria-label="상 종류" style={{ display: 'inline-flex', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 8, overflow: 'hidden' }}>
                  {([['item', '상품'], ['point', '쌀포인트']] as const).map(([k, label]) => {
                    const on = (item.kind ?? 'item') === k
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={on}
                        onClick={() => update(idx, k === 'point'
                          ? { kind: 'point', itemId: undefined, img: '', name: pointPrizeName(item.points ?? '') }
                          : { kind: 'item', name: '', points: undefined })}
                        style={{ border: 'none', padding: '6px 9px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: on ? 'var(--accent-tint)' : 'var(--surface)', color: on ? 'var(--accent-fg)' : 'var(--text-tertiary)' }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </span>
              )}
              {item.kind === 'point' ? (
                <>
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--gold-tint)', color: 'var(--gold)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GrainsIcon size={20} weight="fill" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 140 }}>
                    <input
                      style={{ ...lightInput, textAlign: 'right' }}
                      type="number"
                      min="1"
                      placeholder="예: 500"
                      aria-label="쌀포인트"
                      value={item.points ?? ''}
                      onChange={e => update(idx, { points: e.target.value, name: pointPrizeName(e.target.value) })}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>P 적립</span>
                  </div>
                </>
              ) : (
                <>
                  {item.img ? (
                    <img src={item.img} alt="미리보기" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-subtle)', flexShrink: 0 }} />
                  )}
                  <input
                    style={{ ...lightInput, flex: 1, minWidth: 140 }}
                    placeholder={placeholder}
                    value={item.name}
                    onChange={e => update(idx, { name: e.target.value })}
                  />
                  <CatalogPicker
                    compact
                    items={catalog}
                    selectedId={item.itemId}
                    onSelect={c => update(idx, c ? { itemId: c.id, name: c.name, img: c.imageUrl ?? item.img } : { itemId: undefined })}
                  />
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <input
                  style={{ ...lightInput, width: 56, textAlign: 'center', padding: '8px 6px' }}
                  type="number"
                  min="1"
                  placeholder="1"
                  aria-label="개수"
                  value={item.count}
                  onChange={e => update(idx, { count: e.target.value })}
                />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>개</span>
              </div>
              {item.kind !== 'point' && <label style={{ ...lightInput, width: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: item.img ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 12, padding: '8px 10px' }}>
                <PaperclipIcon size={12} /> 사진
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => update(idx, { img: typeof reader.result === 'string' ? reader.result : '' })
                    reader.readAsDataURL(file)
                  }}
                />
              </label>}
              {list.length > 1 && (
                <button type="button" onClick={() => setList(prev => prev.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>삭제</button>
              )}
            </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 탭별 상품 + 판매 상태. selling: 지금 팔고 있음 / sold: 한 번이라도 팔림(결제 끝남) — 둘 다 아니면 "내린 상품"
  //   응모: 응모권 다 팔림(추첨 대기 · 추첨 완료)만 팔린 것. 매진 못 해 취소된 응모는 내린 상품
  //   쿠지: 제비가 1장이라도 팔리면 팔린 것 (판매 종료 때 안 나간 상은 재고로 돌아간다)
  //   상점: 1개라도 팔리면 팔린 것. 팔린 개수는 장부 기록에서 — 못 불러오면 0으로 본다
  const isStoreTab = productTab === '상점(일반)' || productTab === '상점(쌀포인트)'
  const storePay = productTab === '상점(일반)' ? 'cash' : 'ssal'
  const tabItems: { product: Product; selling: boolean; sold: boolean }[] = productTab === '응모'
    ? raffleProducts.map(rp => ({
        product: raffleToProduct(rp),
        selling: rp.status === 'open' && rp.is_open && rp.remaining_slots > 0,
        sold: rp.status === 'completed' || (rp.status === 'open' && rp.remaining_slots <= 0),
      }))
    : isStoreTab
      ? storeProducts
          .filter(sp => sp.pay_type === storePay)
          .map(sp => ({ product: storeToProduct(sp), selling: !isSoldOut(sp), sold: (sales?.storeSold.get(sp.store_product_id) ?? 0) > 0 }))
      : kujiSets.map(ks => ({
          product: kujiToProduct(ks),
          selling: ks.status === 'open' && ks.remaining_tickets > 0,
          sold: ks.total_tickets - ks.remaining_tickets > 0,
        }))

  // 판매완료 — 쿠지 · 상점은 판매 기록(결제 1건 = 한 줄, 최신순, 같은 상품이 또 팔려도 따로).
  // 응모는 판 하나가 통째로 팔리므로 응모 하나 = 한 줄 (응모권 다 팔림)
  const logKind = productTab === '쿠지' ? 'kuji' : productTab === '상점(일반)' ? 'store_cash' : 'store_ssal'
  const saleLog = productTab === '응모' ? [] : (sales?.log ?? []).filter(e => e.kind === logKind)
  const showLog = saleFilter === 'done' && productTab !== '응모'

  const inFilter = (x: { selling: boolean; sold: boolean }, f: SaleFilter) =>
    f === 'selling' ? x.selling : f === 'done' ? x.sold : !x.selling && !x.sold
  const filterCount = (f: SaleFilter) =>
    f === 'done' && productTab !== '응모' ? saleLog.length : tabItems.filter(x => inFilter(x, f)).length
  const saleFiltered = tabItems.filter(x => inFilter(x, saleFilter)).map(x => x.product)
  const listLength = showLog ? saleLog.length : saleFiltered.length
  const pageCount = Math.max(1, Math.ceil(listLength / ADMIN_PAGE_SIZE))
  const currentPage = Math.min(productPage, pageCount)
  const pageSlice = <T,>(list: T[]) => list.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE)
  const filtered = showLog ? [] : pageSlice(saleFiltered)
  const logPage = showLog ? pageSlice(saleLog) : []

  // 판매 기록 한 줄에 붙일 사진 — 지금 목록에 있는 상품이면 그 사진 (내린 상품은 사진 없이)
  const logImage = (e: SaleLogEntry) =>
    e.productId == null ? null
      : e.kind === 'kuji' ? kujiSets.find(k => k.kuji_set_id === e.productId)?.image_url ?? null
        : storeProducts.find(s => s.store_product_id === e.productId)?.image_url ?? null

  if (!authChecked) return null

  return (
    <div>
      <AdminPageHeader
        title="상품 게시"
        description="상품 등록에 올려 둔 상품을 골라 응모 · 쿠지 · 상점에 올리고, 판매를 끝내거나 수량을 조정해요."
        actions={!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="admin-primary-btn">+ {productTab}에 게시</button>
        )}
      />

      <div className="admin-toolbar">
        <div className="admin-sale-toggle" role="tablist" aria-label="상품 종류">
          {PRODUCT_TABS.map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={productTab === t}
              className={productTab === t ? 'active' : ''}
              onClick={() => { setProductTab(t); setShowAddForm(false); setStoreCategory(null); setPickedItemId(null); setSaleFilter('selling'); setProductPage(1) }}
            >
              {TAB_ICON[t]} {t}
            </button>
          ))}
        </div>
        <div className="admin-sale-toggle" role="tablist" aria-label="판매 상태">
          {SALE_FILTERS.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={saleFilter === key}
              className={saleFilter === key ? 'active' : ''}
              onClick={() => { setSaleFilter(key); setProductPage(1) }}
            >
              {label} <span className="count">{filterCount(key)}</span>
            </button>
          ))}
        </div>
      </div>

        {productTab === '응모' && raffleListError && (
          <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{raffleListError}</div>
        )}

        {productTab === '쿠지' && kujiListError && (
          <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{kujiListError}</div>
        )}
        {(productTab === '상점(일반)' || productTab === '상점(쌀포인트)') && storeListError && (
          <div style={{ color: '#e14d72', fontSize: 13, marginBottom: 12 }}>{storeListError}</div>
        )}
        {(productTab === '상점(일반)' || productTab === '상점(쌀포인트)') && salesError && (
          <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>판매 기록을 불러오지 못해서 팔린 개수가 안 보여요. 판매완료 · 내린 상품 탭이 맞지 않을 수 있어요. 새로고침해 주세요.</div>
        )}

        {showAddForm && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', padding: '24px 24px 20px', boxShadow: 'var(--shadow-md)', marginBottom: 20 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>{TAB_ICON[productTab]} {productTab}에 게시</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {productTab !== '쿠지' && (
                // 게시는 "상품 등록"에 올려 둔 상품에서 고른다 — 상품명·사진·설명(상품정보제공고시)이 채워진다
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>
                    게시할 상품 * (상품명·사진·설명이 채워져요)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                    <CatalogPicker items={catalog} selectedId={pickedItemId} onSelect={pickForProduct} />
                    <Link href="/admin/catalog" style={{ color: 'var(--accent-fg)', fontSize: 12 }}>목록에 없으면 먼저 상품 등록 →</Link>
                  </div>
                </div>
              )}
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>{productTab === '쿠지' ? '쿠지 이름 *' : '상품명 * (등록 이름과 다르게 보여주고 싶으면 고치세요)'}</div>
                <input style={lightInput} placeholder={productTab === '쿠지' ? '예: 주술회전 나오야 젠인 쿠지' : '상품 이름 입력'} value={newP.title} onChange={e => setNewP(p => ({ ...p, title: e.target.value }))} />
              </div>
              {productTab === '쿠지' && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.6 }}>
                  상위상·하위상·라스트원상은 줄마다 <b style={{ color: 'var(--text-secondary)' }}>고르기</b> 버튼으로 등록 상품을 고르거나, 이름과 사진을 직접 넣어도 돼요.
                  {' '}<Link href="/admin/catalog" style={{ color: 'var(--accent-fg)' }}>상품 등록 →</Link>
                </div>
              )}
              {(productTab === '상점(일반)' || productTab === '상점(쌀포인트)') && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>분류 * (상점 세부 탭)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {STORE_CATEGORIES[productTab === '상점(일반)' ? 'cash' : 'ssal'].map(c => (
                      <button key={c.id} type="button" onClick={() => setStoreCategory(c.id)} style={{
                        flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                        border: `1px solid ${storeCategory === c.id ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
                        background: storeCategory === c.id ? 'var(--accent-tint)' : 'var(--surface)',
                        color: storeCategory === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: storeCategory === c.id ? 700 : 400,
                      }}>{c.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {(productTab === '상점(일반)' || productTab === '상점(쌀포인트)') && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>판매 방식 *</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {([
                      ['limited', '한정', '올린 개수만큼 팔아요. 남은 개수가 보이고, 다 팔리면 매진 (구하기 힘든 상품)'],
                      ['regular', '일반', '개수 없이 계속 팔아요. 남은 개수도 안 보여요 (구하기 쉬운 상품)'],
                    ] as const).map(([id, name, desc]) => (
                      <label key={id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                        border: `1px solid ${saleMode === id ? 'var(--accent-tint-border)' : 'var(--border-strong)'}`,
                        background: saleMode === id ? 'var(--accent-tint)' : 'var(--surface)',
                      }}>
                        <input type="radio" name="sale-mode" checked={saleMode === id} onChange={() => setSaleMode(id)} style={{ marginTop: 3 }} />
                        <span><b style={{ color: 'var(--text)' }}>{name}</b> <span style={{ color: 'var(--text-tertiary)' }}>— {desc}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {(productTab === '상점(일반)' || productTab === '상점(쌀포인트)') && saleMode === 'limited' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>판매 수량 *</div>
                  <input
                    style={lightInput}
                    placeholder="올릴 개수 (예: 10)"
                    type="number"
                    min="1"
                    value={newP.stock}
                    onChange={e => setNewP(p => ({ ...p, stock: e.target.value }))}
                  />
                </div>
              )}
              {productTab === '상점(일반)' && (
                // 랜덤 상품처럼 응모로 돌리면 안 되는 상품 — 상세 화면에 "응모 전환" 칸이 안 나온다
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={fundingDisabled} onChange={e => setFundingDisabled(e.target.checked)} />
                  응모 전환 막기 (랜덤 상품처럼 응모로 돌리면 안 되는 상품)
                </label>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>판매가격 *</div>
                  <input style={lightInput} placeholder={productTab === '응모' ? '예: 650000 (숫자만)' : '예: 50000 (숫자만)'} value={newP.price} onChange={e => setNewP(p => ({ ...p, price: e.target.value }))} />
                </div>
              )}
              {(
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>
                    {productTab === '쿠지' ? '쿠지 대표 이미지 * (목록·배너에 쓰여요, 상위상 사진과 별개)' : '상품 이미지 (선택)'}
                  </div>
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
              {productTab === '쿠지' && renderKujiRows({
                tier: 'upper',
                label: '상위상 (상품명·사진·개수) *',
                list: kujiItems,
                setList: setKujiItems,
                gradeStart: 0,
                placeholder: '예: 나오야 젠인 피규어',
              })}
              {productTab === '쿠지' && renderKujiRows({
                tier: 'lower',
                label: '하위상 (상품명·사진·개수, 또는 쌀포인트) *',
                list: lowerItems,
                setList: setLowerItems,
                gradeStart: kujiItems.length,
                placeholder: '예: 캔뱃지, 클리어파일',
              })}
              {productTab === '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
                    라스트원상 (선택 · 마지막 1장을 뽑은 분께 추가로, 장수에는 안 들어가요)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, border: '1px solid #8b5cf6', borderRadius: 10, padding: 10 }}>
                    <span className="kuji-last-badge" style={{ position: 'static', transform: 'none', flexShrink: 0 }}>LAST ONE</span>
                    {lastOneItem.img ? (
                      <img src={lastOneItem.img} alt="미리보기" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-subtle)', flexShrink: 0 }} />
                    )}
                    <input
                      style={{ ...lightInput, flex: 1, minWidth: 140 }}
                      placeholder="예: 나오야 젠인 라스트원 스페셜 컬러 피규어"
                      value={lastOneItem.name}
                      onChange={e => setLastOneItem(v => ({ ...v, name: e.target.value }))}
                    />
                    <CatalogPicker
                      compact
                      items={catalog}
                      selectedId={lastOneItem.itemId}
                      onSelect={c => setLastOneItem(v => (c ? { ...v, itemId: c.id, name: c.name, img: c.imageUrl ?? v.img } : { ...v, itemId: undefined }))}
                    />
                    <label style={{ ...lightInput, width: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: lastOneItem.img ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 12, padding: '8px 10px' }}>
                      <PaperclipIcon size={12} /> 사진
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => setLastOneItem(v => ({ ...v, img: typeof reader.result === 'string' ? reader.result : '' }))
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>부가 설명 · 상품정보제공고시 (등록 상품 설명이 채워져요. 이번 게시에만 붙일 말은 위에 덧붙이세요)</span>
                    {/* "항목: 값" 줄은 상품 상세에서 표로 보인다. 값을 비운 줄은 안 보인다 */}
                    <button
                      type="button"
                      onClick={() => setNewP(p => p.description.includes('품명 및 모델명:') ? p : ({ ...p, description: (p.description ? p.description.trimEnd() + '\n\n' : '') + productInfoTemplate() }))}
                      style={{ border: '1px solid var(--border-strong)', background: 'var(--surface)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      고시 양식 넣기
                    </button>
                  </div>
                  <textarea
                    style={{ ...lightInput, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder={'소개 글을 먼저 쓰고, "고시 양식 넣기"로 상품정보제공고시 항목을 채워 주세요.\n(예: 크기·중량: 높이 약 15cm)'}
                    value={newP.description}
                    onChange={e => setNewP(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
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
              {raffleSubmitError && (
                <div style={{ color: 'var(--danger)', fontSize: 12 }}>{raffleSubmitError}</div>
              )}
              {productTab === '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>1장 가격</div>
                  <input style={lightInput} placeholder="기본값: 10,000원" value={newP.ticketPrice} onChange={e => setNewP(p => ({ ...p, ticketPrice: e.target.value }))} />
                </div>
              )}
              {productTab === '쿠지' && (
                // 구성·가격을 바꾸면 바로 다시 계산된다 (원가·마진은 사이트 밖에서 계산)
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', background: 'var(--bg-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {[
                    { label: '총 장수', value: kujiTotalPapers ? `${kujiTotalPapers.toLocaleString()}장` : '-', sub: `상위 ${kujiItemCount} · 하위 ${kujiLowerCount}` },
                    { label: '예상 매출', value: kujiRevenue ? `${kujiRevenue.toLocaleString()}원` : '-', sub: `${kujiTicketPrice.toLocaleString()}원 × ${kujiTotalPapers}장` },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button disabled={raffleSubmitting} onClick={async () => {
                if (productTab === '응모') {
                  if (!pickedItem) {
                    setRaffleSubmitError('게시할 상품을 골라주세요. 목록에 없으면 상품 등록에서 먼저 올려 주세요.')
                    return
                  }
                  // 등록 상품 사진을 그대로 쓴다 (따로 올린 사진이 있으면 그걸로)
                  if (!newP.title.trim() || !newP.price.trim() || (!newImageFile && !newP.img) || !adminToken) {
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
                    const image = newImageFile ?? await urlToBlob(newP.img)
                    if (!image) throw new Error('이미지를 불러오지 못했어요.')
                    const created = await createRaffleProduct(adminToken, {
                      product_name: newP.title,
                      description: newP.description || undefined,
                      price_krw: priceNum,
                      image,
                      duration_days: deadlineDays,
                      catalog_item_id: pickedItem.id,
                    })
                    setRaffleProducts(prev => [created, ...prev])
                    resetNewProductForm()
                    setShowAddForm(false)
                  } catch (err) {
                    setRaffleSubmitError(err instanceof ApiError ? err.message : '게시 중 오류가 발생했습니다.')
                  } finally {
                    setRaffleSubmitting(false)
                  }
                  return
                }
                if (productTab === '상점(일반)' || productTab === '상점(쌀포인트)') {
                  const regularMode = saleMode === 'regular'
                  if (!newP.title.trim() || !newP.price.trim() || (!regularMode && !newP.stock.trim()) || !adminToken) {
                    setRaffleSubmitError('상품명, 가격, 수량을 모두 입력해주세요.')
                    return
                  }
                  if (!storeCategory) {
                    setRaffleSubmitError('분류를 선택해주세요.')
                    return
                  }
                  if (!pickedItem) {
                    setRaffleSubmitError('게시할 상품을 골라주세요. 목록에 없으면 상품 등록에서 먼저 올려 주세요.')
                    return
                  }
                  const priceNum = Number(newP.price.replace(/[^0-9]/g, ''))
                  // 일반 상품은 개수가 없다 — 서버에는 0을 보내고 sale_mode로 구분한다
                  const stockNum = regularMode ? 0 : Number(newP.stock)
                  if (!priceNum) {
                    setRaffleSubmitError('가격은 숫자로 입력해주세요.')
                    return
                  }
                  if (!regularMode && !(stockNum > 0)) {
                    setRaffleSubmitError('판매 수량은 1개 이상 숫자로 입력해주세요.')
                    return
                  }
                  try {
                    setRaffleSubmitting(true)
                    setRaffleSubmitError(null)
                    const created = await createStoreProduct(adminToken, {
                      product_name: newP.title,
                      description: newP.description || undefined,
                      pay_type: productTab === '상점(일반)' ? 'cash' : 'ssal',
                      price: priceNum,
                      stock: stockNum,
                      category: storeCategory,
                      image: newImageFile ?? await urlToBlob(newP.img),
                      funding_disabled: productTab === '상점(일반)' && fundingDisabled,
                      sale_mode: saleMode,
                      catalog_item_id: pickedItem.id,
                    })
                    setStoreProducts(prev => [created, ...prev])
                    // 서버가 판매 방식을 아직 모르면 일반으로 골라도 수량 0개 한정(=매진)으로 올라간다 — 조용히 넘어가지 않게 알린다
                    if (regularMode && created.sale_mode !== 'regular') {
                      alert('게시는 됐지만 서버가 아직 "일반" 판매 방식을 저장하지 못해 매진 상태로 올라갔어요.\n서버 작업이 끝나면 이 상품을 내리고 다시 게시해 주세요.')
                    }
                    resetNewProductForm()
                    setShowAddForm(false)
                  } catch (err) {
                    setRaffleSubmitError(err instanceof ApiError ? err.message : '게시 중 오류가 발생했습니다.')
                  } finally {
                    setRaffleSubmitting(false)
                  }
                  return
                }
                if (productTab !== '쿠지') return
                if (!adminToken) return
                if (!newP.title.trim()) {
                  setRaffleSubmitError('쿠지 이름을 입력해주세요.')
                  return
                }
                if (kujiItemCount === 0 || kujiLowerCount === 0) {
                  setRaffleSubmitError('상위상과 하위상을 각각 하나 이상 입력해주세요.')
                  return
                }
                if (!lastOneItem.name.trim() && lastOneItem.img) {
                  setRaffleSubmitError('라스트원상 이름을 입력해주세요.')
                  return
                }
                if (!newImageFile) {
                  setRaffleSubmitError('쿠지 대표 이미지를 올려주세요.')
                  return
                }
                // 상품 사진은 미리보기용 data URL(또는 등록 상품 사진 URL)로 들고 있어서 파일로 바꿔 보낸다
                const toBlob = urlToBlob
                try {
                  setRaffleSubmitting(true)
                  setRaffleSubmitError(null)
                  const toPrizes = (list: KujiItem[], tier: 'upper' | 'lower') =>
                    Promise.all(filledItems(list).map(async it => ({
                      tier,
                      name: it.name.trim(),
                      quantity: Number(it.count) || 1,
                      cost: 0,   // 원가는 사이트 밖에서 관리 (서버 칸은 남아 있어서 0)
                      ...(it.kind === 'point'
                        ? { point_amount: toNum(it.points ?? '') }
                        : { image: await toBlob(it.img), ...(it.itemId != null ? { catalog_item_id: it.itemId } : {}) }),
                    })))
                  const created = await createKujiSet(adminToken, {
                    title: newP.title.trim(),
                    ticket_price: kujiTicketPrice,
                    image: newImageFile,
                    prizes: [...await toPrizes(kujiItems, 'upper'), ...await toPrizes(lowerItems, 'lower')],
                    last_one: lastOneItem.name.trim()
                      ? { name: lastOneItem.name.trim(), cost: 0, image: await toBlob(lastOneItem.img), catalog_item_id: lastOneItem.itemId }
                      : undefined,
                  })
                  // 서버가 쌀포인트 상을 아직 모르면 "쌀포인트 500P"라는 실물 상으로 저장된다 — 그대로 팔면 안 되니 바로 판매를 끝낸다
                  const wantsPoints = filledItems(lowerItems).some(it => it.kind === 'point')
                  if (wantsPoints && !created.prizes.some(p => (p.point_amount ?? 0) > 0)) {
                    const closed = await closeKujiSet(adminToken, created.kuji_set_id).catch(() => null)
                    setKujiSets(prev => [closed ?? created, ...prev])
                    alert(closed
                      ? '서버가 아직 쌀포인트 상을 지원하지 않아서, 방금 만든 쿠지는 바로 판매 종료했어요.\n서버 작업이 끝난 뒤 다시 만들어 주세요.'
                      : '서버가 아직 쌀포인트 상을 지원하지 않아요. 방금 만든 쿠지를 목록에서 바로 "판매 종료"해 주세요.')
                    resetNewProductForm()
                    setShowAddForm(false)
                    return
                  }
                  setKujiSets(prev => [created, ...prev])
                  resetNewProductForm()
                  setShowAddForm(false)
                } catch (err) {
                  setRaffleSubmitError(err instanceof ApiError ? err.message : '게시 중 오류가 발생했습니다.')
                } finally {
                  setRaffleSubmitting(false)
                }
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: raffleSubmitting ? 'default' : 'pointer', opacity: raffleSubmitting ? 0.6 : 1 }}>{raffleSubmitting ? '게시 중...' : '게시하기'}</button>
              <button onClick={() => { setShowAddForm(false); resetNewProductForm() }} style={{ padding: '11px 24px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        )}
        {showLog && productTab === '쿠지' && salesError && (
          <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>판매 기록을 불러오지 못했어요. 새로고침해 주세요.</div>
        )}
        {showLog ? (
          logPage.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12, marginBottom: 24 }}>
              {sales == null && !salesError ? '판매 기록을 불러오는 중...' : SALE_FILTERS.find(([key]) => key === saleFilter)?.[2]}
            </div>
          ) : (
            <div className="admin-plist">
              {logPage.map(e => {
                const img = logImage(e)
                const paid = e.kind === 'store_ssal'
                  ? `${e.amountSsal.toLocaleString()} 쌀포인트`
                  : `카드 ${e.amountKrw.toLocaleString()}원${e.amountSsal > 0 ? ` · 할인 ${e.amountSsal.toLocaleString()}P` : ''}`
                return (
                  <div key={e.id} className="admin-prow">
                    <div className="admin-prow-thumb">{img ? <img src={img} alt="" /> : null}</div>
                    <div className="admin-prow-main">
                      <div className="admin-prow-title">{e.title}</div>
                      <div className="admin-prow-meta">{formatSaleTime(e.at)} · {paid}</div>
                    </div>
                    <div className="admin-prow-status">
                      <div className="admin-prow-figure">{e.quantity}{e.kind === 'kuji' ? '장' : '개'} 판매</div>
                      {e.kind === 'kuji' && e.prizes.length > 0 && <div className="admin-prow-sub">{e.prizes.join(' · ')}</div>}
                    </div>
                    <div className="admin-prow-actions" />
                  </div>
                )
              })}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12, marginBottom: 24 }}>
            {SALE_FILTERS.find(([key]) => key === saleFilter)?.[2]}
          </div>
        ) : (
          <div className="admin-plist">
            {filtered.map(p => {
              const info = productStatus(p)
              return (
                <div key={`${p.type}-${p.id}`} className={`admin-prow${info.ended ? ' is-ended' : ''}`}>
                  <div className="admin-prow-thumb">{p.img ? <img src={p.img} alt="" /> : null}</div>
                  <div className="admin-prow-main">
                    <div className="admin-prow-title">{p.title}</div>
                    <div className="admin-prow-meta">{info.meta}</div>
                  </div>
                  <div className="admin-prow-status">
                    <div className="admin-prow-figure" style={{ color: info.tone }}>{info.figure}</div>
                    {info.progress != null && (
                      <div className="admin-prow-bar"><span style={{ transform: `scaleX(${Math.min(1, info.progress)})` }} /></div>
                    )}
                    <div className="admin-prow-sub">{info.sub}</div>
                  </div>
                  <div className="admin-prow-actions">{renderProductActions(p)}</div>
                </div>
              )
            })}
          </div>
        )}

        {pageCount > 1 && (
          // 전역 nav 스타일(상단 메뉴용 sticky·세로 정렬)을 피하려고 div + role 사용
          <div className="admin-pagination" role="navigation" aria-label="상품 목록 페이지">
            <button onClick={() => setProductPage(currentPage - 1)} disabled={currentPage === 1} aria-label="이전 페이지">‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={n === currentPage ? 'active' : ''}
                aria-current={n === currentPage ? 'page' : undefined}
                onClick={() => setProductPage(n)}
              >
                {n}
              </button>
            ))}
            <button onClick={() => setProductPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="다음 페이지">›</button>
          </div>
        )}
    </div>
  )
}
