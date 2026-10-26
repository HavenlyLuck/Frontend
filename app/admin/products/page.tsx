'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CoinsIcon,
  DotsSixVerticalIcon,
  GiftIcon,
  GrainsIcon,
  PaperclipIcon,
  TicketIcon,
} from '@phosphor-icons/react'
import { ApiError, getRaffleProducts, createRaffleProduct, type RaffleProductResponse, getStoreProducts, createStoreProduct, getKujiSetsAdmin, createKujiSet, type KujiSetAdminResponse, STORE_CATEGORIES, type StoreCategory, type StoreProductResponse } from '@/lib/api'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import {
  PRODUCT_TABS,
  type ProductType, type KujiItem, type Product,
} from '@/lib/adminProducts'
import { fetchInventoryItemForProduct, fetchInventoryItems, type InventoryItem } from '@/lib/inventory'
import { cancelRaffle, closeKuji, setStoreStock } from '@/lib/productActions'
import InventoryPicker from '@/components/admin/InventoryPicker'

type KujiTier = 'upper' | 'lower'

// 미리보기용 사진 주소(data URL 또는 재고 품목 사진 URL)를 업로드할 파일로 바꾼다
const urlToBlob = async (url: string) => (url ? await (await fetch(url)).blob() : undefined)

const TAB_ICON: Record<ProductType, React.ReactNode> = {
  '응모': <TicketIcon size={13} weight="fill" />,
  '쿠지': <GiftIcon size={13} weight="fill" />,
  '상점(일반)': <CoinsIcon size={13} weight="fill" />,
  '상점(쌀포인트)': <GrainsIcon size={13} weight="fill" />,
}
const ADMIN_PAGE_SIZE = 10
const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

// ── 상품 관리 ─────────────────────────────────────────────
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
    getStoreProducts()
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

  useEffect(() => {
    if (authChecked && adminToken) reloadKujiSets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, adminToken])

  const [productTab, setProductTab] = useState<ProductType>('응모')
  const [saleFilter, setSaleFilter] = useState<'selling' | 'done'>('selling')
  const [productPage, setProductPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newP, setNewP] = useState({ title: '', price: '', cost: '', img: '', stock: '', maxTickets: '', ticketPrice: '10,000원', description: '' })
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [deadlineDays, setDeadlineDays] = useState(1)
  const [storeCategory, setStoreCategory] = useState<StoreCategory | null>(null)
  const [raffleSubmitting, setRaffleSubmitting] = useState(false)
  const [raffleSubmitError, setRaffleSubmitError] = useState<string | null>(null)
  const autoMaxTickets = Math.floor((Number(newP.price.replace(/[^0-9]/g, '')) || 0) / 1000)

  // 재고에서 고르기 — 응모·상점은 품목 하나, 쿠지는 상 한 줄마다(KujiItem.itemId)
  const [invItems, setInvItems] = useState<InventoryItem[] | null>(null)
  const [pickedItemId, setPickedItemId] = useState<number | null>(null)
  const pickedItem = invItems?.find(i => i.item_id === pickedItemId) ?? null
  const reloadInventory = () => {
    if (adminToken) fetchInventoryItems(adminToken).then(setInvItems).catch(() => setInvItems([]))
  }
  useEffect(() => {
    if (showAddForm && invItems === null) reloadInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddForm, adminToken])

  // 고른 품목으로 상품명·원가·사진을 채운다 (사진은 등록할 때 파일로 바꿔 올린다)
  const pickForProduct = (item: InventoryItem | null) => {
    setPickedItemId(item?.item_id ?? null)
    if (!item) {
      setNewP(p => ({ ...p, cost: '' }))
      return
    }
    setNewP(p => ({ ...p, title: item.name, cost: String(item.avg_unit_cost), img: item.image_url ?? p.img }))
    if (item.image_url) setNewImageFile(null)
  }

  // 판매 종료 · 수량 조정 — 남은 물건은 재고로 돌아간다 (lib/productActions.ts)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const runProductAction = async (key: string, fn: () => Promise<void>) => {
    if (!adminToken || actionBusy) return
    setActionBusy(key)
    try {
      await fn()
      reloadInventory()
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
    return {
      meta: `${sp.pay_type === 'cash' ? `${sp.price.toLocaleString()}원` : `${sp.price.toLocaleString()} 쌀포인트`}${category ? ` · ${category}` : ''}`,
      figure: `${sp.stock}개`,
      sub: sp.stock > 0 ? '판매 중' : '품절 · 판매 종료',
      progress: null,
      tone: sp.stock === 0 ? 'var(--danger)' : sp.stock <= 3 ? 'var(--gold)' : 'var(--text)',
      ended: sp.stock === 0,
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
            if (!confirm(`"${rp.product_name}" 응모를 취소할까요?\n\n지금까지 응모권을 산 ${rp.sold_slots}장은 모두 전액 환불되고, 물건은 재고로 돌아가요. 되돌릴 수 없어요.`)) return
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
            if (!confirm(`"${ks.title}" 쿠지 판매를 끝낼까요?\n\n남은 제비 ${ks.remaining_tickets}장에 해당하는 상품과 라스트원상은 재고로 돌아가요. 이미 뽑힌 상품은 그대로예요. 되돌릴 수 없어요.`)) return
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
    return (
      <>
        <button
          disabled={!!actionBusy}
          style={actionBtn(false)}
          onClick={async () => {
            const linked = await fetchInventoryItemForProduct(adminToken!, 'store', sp.store_product_id).catch(() => null)
            const max = sp.stock + (linked?.available ?? 0)
            const input = prompt(
              `"${sp.product_name}" 판매 수량을 몇 개로 바꿀까요?\n지금 ${sp.stock}개 · ${linked ? `재고에 ${linked.available}개 더 있어서 최대 ${max}개` : '재고 연결 정보 없음'}\n줄이면 줄인 만큼 재고로 돌아가요.`,
              String(sp.stock),
            )
            if (input == null) return
            const next = Number(input.replace(/[^0-9]/g, ''))
            if (!Number.isInteger(next) || input.trim() === '') return alert('숫자로 적어주세요.')
            if (linked && next > max) return alert(`재고가 모자라요. 최대 ${max}개까지 올릴 수 있어요.`)
            if (next === sp.stock) return
            changeStock(next)
          }}
        >
          {actionBusy === key ? '바꾸는 중...' : '수량 조정'}
        </button>
        {sp.stock > 0 && (
          <button
            disabled={!!actionBusy}
            style={actionBtn(true)}
            onClick={() => {
              if (!confirm(`"${sp.product_name}" 판매를 끝낼까요?\n남은 ${sp.stock}개는 재고로 돌아가요.`)) return
              changeStock(0)
            }}
          >
            판매 종료
          </button>
        )}
      </>
    )
  }

  function resetNewProductForm() {
    setPickedItemId(null)
    setNewP({ title: '', price: '', cost: '', img: '', stock: '', maxTickets: '', ticketPrice: '10,000원', description: '' })
    setNewImageFile(null)
    setDeadlineDays(1)
    setStoreCategory(null)
    setKujiItems([{ name: '', img: '', count: '1', cost: '' }])
    setLowerItems([{ name: '', img: '', count: '1', cost: '' }])
    setLastOneItem({ name: '', img: '', cost: '' })
    setRaffleSubmitError(null)
    reloadInventory()
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
    const toItem = (p: KujiSetAdminResponse['prizes'][number]) => ({ name: p.name, img: p.image_url ?? '', count: String(p.quantity), cost: String(p.cost) })
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
      lastOne: ks.last_one_name ? { name: ks.last_one_name, img: ks.last_one_image_url ?? '', cost: String(ks.last_one_cost ?? 0) } : undefined,
    }
  }

  // 쿠지 구성 — 상위상·하위상 모두 상품명·사진·개수·원가를 한 줄씩
  const [kujiItems, setKujiItems] = useState<KujiItem[]>([{ name: '', img: '', count: '1', cost: '' }])
  const [lowerItems, setLowerItems] = useState<KujiItem[]>([{ name: '', img: '', count: '1', cost: '' }])
  const toNum = (s: string) => Number(s.replace(/[^0-9]/g, '')) || 0
  const filledItems = (list: KujiItem[]) => list.filter(it => it.name.trim())
  const sumCount = (list: KujiItem[]) => filledItems(list).reduce((sum, it) => sum + (Number(it.count) || 1), 0)
  const sumCost = (list: KujiItem[]) => filledItems(list).reduce((sum, it) => sum + (Number(it.count) || 1) * toNum(it.cost), 0)
  const kujiItemCount = sumCount(kujiItems)
  const kujiLowerCount = sumCount(lowerItems)
  const kujiTotalPapers = kujiItemCount + kujiLowerCount
  // 원가 책정용 — 총 원가, 예상 매출(총 장수 × 1장 가격), 마진
  // 라스트원상 — 제비가 아니라 마지막 장을 뽑은 사람에게 추가로 주는 상이라 장수에는 안 들어가고 원가에만 더한다
  const [lastOneItem, setLastOneItem] = useState<{ name: string; img: string; cost: string; itemId?: number }>({ name: '', img: '', cost: '' })

  // 쿠지에서 같은 재고 품목을 여러 줄(+라스트원)에 나눠 쓸 수 있으니 품목별로 합쳐서 재고와 비교한다
  const kujiItemUsage = new Map<number, number>()
  for (const it of [...filledItems(kujiItems), ...filledItems(lowerItems)]) {
    if (it.itemId != null) kujiItemUsage.set(it.itemId, (kujiItemUsage.get(it.itemId) ?? 0) + (Number(it.count) || 1))
  }
  if (lastOneItem.itemId != null && lastOneItem.name.trim()) kujiItemUsage.set(lastOneItem.itemId, (kujiItemUsage.get(lastOneItem.itemId) ?? 0) + 1)
  const kujiShortage = (itemId: number | undefined) => {
    if (itemId == null) return 0
    const available = invItems?.find(i => i.item_id === itemId)?.available ?? 0
    return Math.max(0, (kujiItemUsage.get(itemId) ?? 0) - available)
  }
  const lastOneCost = toNum(lastOneItem.cost)
  const kujiTicketPrice = toNum(newP.ticketPrice) || 10000
  const kujiTotalCost = sumCost(kujiItems) + sumCost(lowerItems) + lastOneCost
  const kujiRevenue = kujiTotalPapers * kujiTicketPrice
  const kujiMargin = kujiRevenue - kujiTotalCost
  const kujiMarginRate = kujiRevenue > 0 ? Math.round((kujiMargin / kujiRevenue) * 1000) / 10 : 0

  // 상위상 ↔ 하위상 끌어서 옮기기 — 줄 왼쪽 손잡이를 잡고 다른 줄 위(그 자리 앞) 또는 목록 빈 곳(맨 뒤)에 놓는다
  const [draggingKuji, setDraggingKuji] = useState<{ tier: KujiTier; idx: number } | null>(null)
  const [kujiDropTarget, setKujiDropTarget] = useState<{ tier: KujiTier; idx: number } | null>(null)
  const isBlankKujiRow = (it: KujiItem) => !it.name.trim() && !it.img && !it.cost.trim()

  function moveKujiItem(from: KujiTier, fromIdx: number, to: KujiTier, toIdx: number) {
    const lists = { upper: kujiItems, lower: lowerItems }
    const setters = { upper: setKujiItems, lower: setLowerItems }
    const src = [...lists[from]]
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
    setters[from](src.length ? src : [{ name: '', img: '', count: '1', cost: '' }])
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
            onClick={() => setList(prev => [...prev, { name: '', img: '', count: '1', cost: '' }])}
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
              <InventoryPicker
                compact
                items={invItems}
                selectedId={item.itemId}
                onSelect={inv => update(idx, inv
                  ? { itemId: inv.item_id, name: inv.name, img: inv.image_url ?? item.img, cost: String(inv.avg_unit_cost) }
                  : { itemId: undefined, cost: '' })}
              />
              {kujiShortage(item.itemId) > 0 && (
                <span style={{ flexBasis: '100%', fontSize: 12, color: 'var(--danger)' }}>
                  이 품목은 재고가 {kujiShortage(item.itemId)}개 모자라요 (이 판 전체에서 같은 품목을 쓴 개수 기준)
                </span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {/* 원가는 재고 평균 원가로만 — 손으로 고치지 않는다 */}
                <span title="개당 원가 (재고 평균 원가)" style={{ ...lightInput, width: 'auto', minWidth: 84, textAlign: 'center', padding: '8px 8px', background: 'var(--bg-subtle)', color: item.itemId != null ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 13 }}>
                  {item.itemId != null ? `${toNum(item.cost).toLocaleString()}원` : '원가 -'}
                </span>
              </div>
              <label style={{ ...lightInput, width: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: item.img ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 12, padding: '8px 10px' }}>
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
              </label>
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

  // 탭별 상품 + 판매중 여부 (응모: 아직 응모권을 팔고 있음 / 상점·쿠지: 재고 있음)
  const tabItems: { product: Product; selling: boolean }[] = productTab === '응모'
    ? raffleProducts.map(rp => ({ product: raffleToProduct(rp), selling: rp.status === 'open' && rp.is_open && rp.remaining_slots > 0 }))
    : productTab === '상점(일반)' || productTab === '상점(쌀포인트)'
      ? storeProducts
          .filter(sp => sp.pay_type === (productTab === '상점(일반)' ? 'cash' : 'ssal'))
          .map(sp => ({ product: storeToProduct(sp), selling: sp.stock > 0 }))
      : kujiSets.map(ks => ({ product: kujiToProduct(ks), selling: ks.status === 'open' && ks.remaining_tickets > 0 }))
  const sellingCount = tabItems.filter(x => x.selling).length
  const doneCount = tabItems.length - sellingCount
  const saleFiltered = tabItems.filter(x => x.selling === (saleFilter === 'selling')).map(x => x.product)
  const pageCount = Math.max(1, Math.ceil(saleFiltered.length / ADMIN_PAGE_SIZE))
  const currentPage = Math.min(productPage, pageCount)
  const filtered = saleFiltered.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE)

  if (!authChecked) return null

  return (
    <div>
      <AdminPageHeader
        title="상품"
        description="응모 · 쿠지 · 상점 상품을 재고에서 골라 등록하고, 판매를 끝내거나 수량을 조정해요."
        actions={!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="admin-primary-btn">+ 새 {productTab} 상품</button>
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
          {([['selling', '판매중', sellingCount], ['done', '판매완료', doneCount]] as const).map(([key, label, count]) => (
            <button
              key={key}
              role="tab"
              aria-selected={saleFilter === key}
              className={saleFilter === key ? 'active' : ''}
              onClick={() => { setSaleFilter(key); setProductPage(1) }}
            >
              {label} <span className="count">{count}</span>
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

        {showAddForm && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', padding: '24px 24px 20px', boxShadow: 'var(--shadow-md)', marginBottom: 20 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>{TAB_ICON[productTab]} {productTab} 상품 추가</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {productTab !== '쿠지' && (
                // 상품은 재고에서만 만든다 — 재고에 없으면 먼저 입고해야 원가·수량이 손익과 맞는다
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>
                    재고에서 고르기 * (이름·사진·원가가 채워지고, 등록하면 {productTab === '응모' ? '1개가' : '올린 수량만큼'} 판매 중으로 넘어가요)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                    <InventoryPicker items={invItems} selectedId={pickedItemId} onSelect={pickForProduct} />
                    <Link href="/admin/finance?tab=inventory" style={{ color: 'var(--accent-fg)', fontSize: 12 }}>재고에 없으면 먼저 입고하기 →</Link>
                  </div>
                </div>
              )}
              {/* 상점은 재고 중 몇 개를 올릴지 정한다 — 나머지는 재고에 남아 다른 상품에 쓸 수 있다 */}
              {productTab !== '응모' && productTab !== '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>
                    판매 수량 *{pickedItem && ` (재고 ${pickedItem.available}개 중 몇 개를 올릴지 — 나머지는 재고에 남아요)`}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={lightInput}
                      placeholder="올릴 수량 입력 (예: 10)"
                      type="number"
                      min="1"
                      max={pickedItem?.available}
                      value={newP.stock}
                      onChange={e => setNewP(p => ({ ...p, stock: e.target.value }))}
                    />
                    {pickedItem && pickedItem.available > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewP(p => ({ ...p, stock: String(pickedItem.available) }))}
                        style={{ flexShrink: 0, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        전부 ({pickedItem.available}개)
                      </button>
                    )}
                  </div>
                  {pickedItem && Number(newP.stock) > pickedItem.available && (
                    <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 5 }}>재고가 {pickedItem.available}개뿐이에요.</div>
                  )}
                </div>
              )}
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>{productTab === '쿠지' ? '쿠지 이름 *' : '상품명 * (재고 이름과 다르게 보여주고 싶으면 고치세요)'}</div>
                <input style={lightInput} placeholder={productTab === '쿠지' ? '예: 주술회전 나오야 젠인 쿠지' : '상품 이름 입력'} value={newP.title} onChange={e => setNewP(p => ({ ...p, title: e.target.value }))} />
              </div>
              {productTab === '쿠지' && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.6 }}>
                  상위상·하위상·라스트원상은 줄마다 <b style={{ color: 'var(--text-secondary)' }}>재고</b> 버튼으로 품목을 골라야 해요. 이름·사진·원가가 채워지고, 등록하면 개수만큼 재고에서 판매 중으로 넘어가요.
                  {' '}<Link href="/admin/finance?tab=inventory" style={{ color: 'var(--accent-fg)' }}>재고에 먼저 입고하기 →</Link>
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
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>판매가격 *</div>
                  <input style={lightInput} placeholder={productTab === '응모' ? '예: 650000 (숫자만)' : '예: 50000 (숫자만)'} value={newP.price} onChange={e => setNewP(p => ({ ...p, price: e.target.value }))} />
                </div>
              )}
              {productTab !== '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>제품 원가 (재고 평균 원가)</div>
                  <div style={{ ...lightInput, background: 'var(--bg-subtle)', color: pickedItem ? 'var(--text)' : 'var(--text-tertiary)' }}>
                    {pickedItem ? `${pickedItem.avg_unit_cost.toLocaleString()}원` : '재고에서 고르면 자동으로 채워져요'}
                  </div>
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
                label: '상위상 (상품명·사진·개수·원가) *',
                list: kujiItems,
                setList: setKujiItems,
                gradeStart: 0,
                placeholder: '예: 나오야 젠인 피규어',
              })}
              {productTab === '쿠지' && renderKujiRows({
                tier: 'lower',
                label: '하위상 (상품명·사진·개수·원가) *',
                list: lowerItems,
                setList: setLowerItems,
                gradeStart: kujiItems.length,
                placeholder: '예: 캔뱃지, 클리어파일',
              })}
              {productTab === '쿠지' && (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
                    라스트원상 (선택 · 마지막 1장을 뽑은 분께 추가로, 장수에는 안 들어가고 원가에는 들어가요)
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
                    <InventoryPicker
                      compact
                      items={invItems}
                      selectedId={lastOneItem.itemId}
                      onSelect={inv => setLastOneItem(v => (inv
                        ? { ...v, itemId: inv.item_id, name: inv.name, img: inv.image_url ?? v.img, cost: String(inv.avg_unit_cost) }
                        : { ...v, itemId: undefined, cost: '' }))}
                    />
                    {kujiShortage(lastOneItem.itemId) > 0 && (
                      <span style={{ flexBasis: '100%', fontSize: 12, color: 'var(--danger)' }}>
                        이 품목은 재고가 {kujiShortage(lastOneItem.itemId)}개 모자라요
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span title="라스트원상 원가 (재고 평균 원가)" style={{ ...lightInput, width: 'auto', minWidth: 84, textAlign: 'center', padding: '8px 8px', background: 'var(--bg-subtle)', color: lastOneItem.itemId != null ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 13 }}>
                        {lastOneItem.itemId != null ? `${lastOneCost.toLocaleString()}원` : '원가 -'}
                      </span>
                    </div>
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
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>상품 설명</div>
                  <textarea
                    style={{ ...lightInput, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="상품 상태, 구성품, 유의사항 등을 적어주세요"
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
                // 원가 책정용 자동 계산 — 구성·원가·가격을 바꾸면 바로 다시 계산된다
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', background: 'var(--bg-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {[
                    { label: '총 장수', value: kujiTotalPapers ? `${kujiTotalPapers.toLocaleString()}장` : '-', sub: `상위 ${kujiItemCount} · 하위 ${kujiLowerCount}` },
                    { label: '총 원가', value: kujiTotalCost ? `${kujiTotalCost.toLocaleString()}원` : '-', sub: lastOneCost ? `개수 × 원가 합 + 라스트원 ${lastOneCost.toLocaleString()}원` : '개수 × 원가 합' },
                    { label: '예상 매출', value: kujiRevenue ? `${kujiRevenue.toLocaleString()}P` : '-', sub: `${kujiTicketPrice.toLocaleString()}P × ${kujiTotalPapers}장` },
                    {
                      label: '예상 마진',
                      value: kujiRevenue ? `${kujiMargin.toLocaleString()}` : '-',
                      sub: kujiRevenue ? `마진율 ${kujiMarginRate}%` : '',
                      color: kujiRevenue ? (kujiMargin < 0 ? 'var(--danger)' : 'var(--success)') : undefined,
                    },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: s.color ?? 'var(--text)' }}>{s.value}</div>
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
                    setRaffleSubmitError('재고에서 품목을 골라주세요. 재고에 없으면 재고·자금 관리에서 먼저 입고해 주세요.')
                    return
                  }
                  // 재고 품목 사진을 그대로 쓴다 (따로 올린 사진이 있으면 그걸로)
                  if (!newP.title.trim() || !newP.price.trim() || (!newImageFile && !newP.img) || !adminToken) {
                    setRaffleSubmitError('상품명, 가격, 이미지를 모두 입력해주세요.')
                    return
                  }
                  const priceNum = Number(newP.price.replace(/[^0-9]/g, ''))
                  if (!priceNum) {
                    setRaffleSubmitError('가격은 숫자로 입력해주세요.')
                    return
                  }
                  if (pickedItem && pickedItem.available < 1) {
                    setRaffleSubmitError('고른 품목의 재고가 없어요.')
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
                      inventory_item_id: pickedItem?.item_id,
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
                if (productTab === '상점(일반)' || productTab === '상점(쌀포인트)') {
                  if (!newP.title.trim() || !newP.price.trim() || !newP.stock.trim() || !adminToken) {
                    setRaffleSubmitError('상품명, 가격, 수량을 모두 입력해주세요.')
                    return
                  }
                  if (!storeCategory) {
                    setRaffleSubmitError('분류를 선택해주세요.')
                    return
                  }
                  if (!pickedItem) {
                    setRaffleSubmitError('재고에서 품목을 골라주세요. 재고에 없으면 재고·자금 관리에서 먼저 입고해 주세요.')
                    return
                  }
                  const priceNum = Number(newP.price.replace(/[^0-9]/g, ''))
                  const stockNum = Number(newP.stock)
                  if (!priceNum) {
                    setRaffleSubmitError('가격은 숫자로 입력해주세요.')
                    return
                  }
                  if (pickedItem && stockNum > pickedItem.available) {
                    setRaffleSubmitError(`고른 품목의 재고가 ${pickedItem.available}개뿐이에요.`)
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
                      inventory_item_id: pickedItem?.item_id,
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
                if (!lastOneItem.name.trim() && (lastOneItem.cost.trim() || lastOneItem.img)) {
                  setRaffleSubmitError('라스트원상 이름을 입력해주세요.')
                  return
                }
                if (!newImageFile) {
                  setRaffleSubmitError('쿠지 대표 이미지를 올려주세요.')
                  return
                }
                if ([...filledItems(kujiItems), ...filledItems(lowerItems)].some(it => it.itemId == null)
                  || (lastOneItem.name.trim() && lastOneItem.itemId == null)) {
                  setRaffleSubmitError('상마다 재고에서 품목을 골라주세요. 재고에 없으면 재고·자금 관리에서 먼저 입고해 주세요.')
                  return
                }
                if ([...kujiItemUsage.keys()].some(id => kujiShortage(id) > 0)) {
                  setRaffleSubmitError('재고가 모자란 품목이 있어요. 개수를 줄이거나 재고에 먼저 입고해 주세요.')
                  return
                }
                // 상품 사진은 미리보기용 data URL(또는 재고 품목 사진 URL)로 들고 있어서 파일로 바꿔 보낸다
                const toBlob = urlToBlob
                try {
                  setRaffleSubmitting(true)
                  setRaffleSubmitError(null)
                  const toPrizes = (list: KujiItem[], tier: 'upper' | 'lower') =>
                    Promise.all(filledItems(list).map(async it => ({
                      tier,
                      name: it.name.trim(),
                      quantity: Number(it.count) || 1,
                      cost: toNum(it.cost),
                      image: await toBlob(it.img),
                      inventory_item_id: it.itemId,
                    })))
                  const created = await createKujiSet(adminToken, {
                    title: newP.title.trim(),
                    ticket_price: kujiTicketPrice,
                    image: newImageFile,
                    prizes: [...await toPrizes(kujiItems, 'upper'), ...await toPrizes(lowerItems, 'lower')],
                    last_one: lastOneItem.name.trim()
                      ? { name: lastOneItem.name.trim(), cost: lastOneCost, image: await toBlob(lastOneItem.img), inventory_item_id: lastOneItem.itemId }
                      : undefined,
                  })
                  setKujiSets(prev => [created, ...prev])
                  resetNewProductForm()
                  setShowAddForm(false)
                } catch (err) {
                  setRaffleSubmitError(err instanceof ApiError ? err.message : '등록 중 오류가 발생했습니다.')
                } finally {
                  setRaffleSubmitting(false)
                }
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: raffleSubmitting ? 'default' : 'pointer', opacity: raffleSubmitting ? 0.6 : 1 }}>{raffleSubmitting ? '등록 중...' : '추가하기'}</button>
              <button onClick={() => { setShowAddForm(false); resetNewProductForm() }} style={{ padding: '11px 24px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        )}
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12, marginBottom: 24 }}>
            {saleFilter === 'selling' ? '판매중인 상품이 없어요.' : '판매가 끝난 상품이 없어요.'}
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
