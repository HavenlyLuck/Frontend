'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MagnifyingGlassIcon, PaperclipIcon } from '@phosphor-icons/react'
import { AdminPageHeader, useAdminToken } from '@/components/admin/AdminShell'
import { ApiError } from '@/lib/api'
import { josa } from '@/lib/josa'
import { createCatalogItem, deleteCatalogItem, fetchCatalog, updateCatalogItem, type CatalogItem } from '@/lib/catalog'
import { PRODUCT_INFO_FIELDS, parseProductDescription, productInfoTemplate } from '@/lib/productInfo'
import PurchasePanel from '@/components/admin/PurchasePanel'

const lightInput: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const smallBtn = (danger = false): React.CSSProperties => ({
  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none',
  border: `1px solid ${danger ? 'var(--danger-tint-border)' : 'var(--border-strong)'}`,
  background: danger ? 'var(--danger-tint)' : 'var(--surface)',
  color: danger ? 'var(--danger)' : 'var(--text-secondary)',
})

type Draft = { name: string; description: string; img: string; file: File | null }
const EMPTY: Draft = { name: '', description: '', img: '', file: null }

// ── 상품 등록 ─────────────────────────────────────────────
// 떼 온 물건을 사진 · 상품명 · 설명(상품정보제공고시)으로 한 번 등록해 두면, "상품 게시"에서 골라 응모 · 쿠지 · 상점에 올린다.
export default function AdminCatalogPage() {
  const token = useAdminToken()
  const [items, setItems] = useState<CatalogItem[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  // null = 폼 닫힘, 'new' = 새로 등록, 숫자 = 그 상품 수정
  const [editing, setEditing] = useState<'new' | number | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  // 입고 패널을 연 상품 — adding: 바로 입고 입력 칸을 연 채로
  const [openStock, setOpenStock] = useState<{ id: number; adding: boolean } | null>(null)

  const reload = () => fetchCatalog(token)
    .then(list => { setItems(list); setListError(null) })
    .catch(err => setListError(err instanceof ApiError ? err.message : '등록된 상품을 불러오지 못했어요.'))
  useEffect(() => { reload() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => { setEditing('new'); setDraft(EMPTY); setFormError(null) }
  const openEdit = (it: CatalogItem) => { setEditing(it.id); setDraft({ name: it.name, description: it.description, img: it.imageUrl ?? '', file: null }); setFormError(null) }
  const close = () => { setEditing(null); setDraft(EMPTY); setFormError(null) }

  async function save() {
    if (!draft.name.trim()) return setFormError('상품명을 입력해 주세요.')
    if (editing === 'new' && !draft.file) return setFormError('상품 사진을 올려 주세요.')
    setSaving(true)
    setFormError(null)
    try {
      if (editing === 'new') {
        await createCatalogItem(token, { name: draft.name, image: draft.file!, description: draft.description })
      } else if (typeof editing === 'number') {
        const saved = await updateCatalogItem(token, editing, { name: draft.name, description: draft.description })
        if (saved.name !== draft.name.trim()) alert('설명은 저장됐지만, 상품명 바꾸기는 서버 작업이 끝나야 저장돼요.')
      }
      close()
      await reload()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '저장 중 오류가 발생했어요.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(it: CatalogItem) {
    if (!confirm(`"${it.name}"${josa(it.name, '을/를')} 등록 상품에서 지울까요?\n이미 게시한 응모·쿠지·상점 상품은 그대로 남아요. 되돌릴 수 없어요.`)) return
    setBusyId(it.id)
    try {
      await deleteCatalogItem(token, it.id)
      setItems(prev => prev?.filter(x => x.id !== it.id) ?? prev)
      if (editing === it.id) close()
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했어요.')
    } finally {
      setBusyId(null)
    }
  }

  const q = query.replace(/\s+/g, '').toLowerCase()
  const shown = (items ?? []).filter(i => !q || i.name.replace(/\s+/g, '').toLowerCase().includes(q))

  return (
    <div>
      <AdminPageHeader
        title="상품 등록"
        description={'새 상품은 사진 · 상품명 · 상품정보제공고시로 한 번만 등록하고, 물건을 떼 올 때마다 그 상품의 "+ 입고"로 날짜 · 거래처 · 수량 · 원가를 남겨 주세요. 응모 · 쿠지 · 상점에 올리는 건 상품 게시에서 해요.'}
        actions={editing === null && <button onClick={openNew} className="admin-primary-btn">+ 새 상품 등록</button>}
      />

      {editing !== null && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', padding: '24px 24px 20px', boxShadow: 'var(--shadow-md)', marginBottom: 20 }}>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>{editing === 'new' ? '새 상품 등록' : '등록 상품 고치기'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>상품 사진 *</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {draft.img && <img src={draft.img} alt="미리보기" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-strong)', flexShrink: 0 }} />}
                {editing === 'new' ? (
                  <label style={{ ...lightInput, width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: draft.img ? 'var(--text)' : 'var(--text-tertiary)' }}>
                    <PaperclipIcon size={14} /> {draft.img ? '사진 바꾸기' : '사진 파일 선택'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => setDraft(d => ({ ...d, file, img: typeof reader.result === 'string' ? reader.result : '' }))
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>사진을 바꾸려면 새로 등록하고 이 상품은 지워 주세요.</span>
                )}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 5 }}>상품명 *</div>
              <input style={lightInput} placeholder="예: 주술회전 나오야 젠인 피규어" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>상품 설명 · 상품정보제공고시</span>
                {/* "항목: 값" 줄은 상품 상세에서 표로 보인다. 값을 비운 줄은 안 보인다 */}
                <button
                  type="button"
                  onClick={() => setDraft(d => d.description.includes('품명 및 모델명:') ? d : ({ ...d, description: (d.description ? d.description.trimEnd() + '\n\n' : '') + productInfoTemplate() }))}
                  style={{ border: '1px solid var(--border-strong)', background: 'var(--surface)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  고시 양식 넣기
                </button>
              </div>
              <textarea
                style={{ ...lightInput, minHeight: 180, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder={'소개 글을 먼저 쓰고, "고시 양식 넣기"로 상품정보제공고시 항목을 채워 주세요.\n(예: 크기·중량: 높이 약 15cm)\n게시할 때 가격과 부가 설명은 따로 적을 수 있어요.'}
                value={draft.description}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              />
            </div>
            {formError && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{formError}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button disabled={saving} onClick={save} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : editing === 'new' ? '등록하기' : '저장하기'}
            </button>
            <button onClick={close} style={{ padding: '11px 24px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: 12, maxWidth: 360 }}>
        <MagnifyingGlassIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input placeholder="상품명으로 찾기" value={query} onChange={e => setQuery(e.target.value)} style={{ ...lightInput, paddingLeft: 30 }} />
      </div>

      {listError && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{listError}</div>}

      {items === null && !listError ? (
        <div style={{ color: 'var(--text-tertiary)', padding: '40px 0', textAlign: 'center' }}>불러오는 중...</div>
      ) : shown.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-strong)', borderRadius: 12 }}>
          {items && items.length > 0 ? '찾는 상품이 없어요.' : '등록된 상품이 없어요. "+ 새 상품 등록"으로 먼저 올려 주세요.'}
        </div>
      ) : (
        <div className="admin-plist">
          {shown.map(it => {
            const filled = parseProductDescription(it.description).info.length
            const stockOpen = openStock?.id === it.id
            return (
              <div key={it.id} className="admin-prow-group">
              <div className="admin-prow no-status">
                <div className="admin-prow-thumb">{it.imageUrl ? <img src={it.imageUrl} alt="" /> : null}</div>
                <div className="admin-prow-main">
                  <div className="admin-prow-title">{it.name}</div>
                  <div className="admin-prow-meta">
                    <span style={{ color: filled === 0 ? 'var(--gold)' : undefined }}>
                      {filled === 0 ? '상품정보제공고시 비어 있음' : `상품정보제공고시 ${filled} / ${PRODUCT_INFO_FIELDS.length}항목`}
                    </span>
                    {' · '}
                    <span style={{ color: it.purchasedQty === 0 ? 'var(--gold)' : undefined }}>
                      {it.purchasedQty === 0 ? '입고 기록 없음' : `입고 ${it.purchasedQty}개 · 평균 원가 ${it.avgUnitCost.toLocaleString()}원`}
                    </span>
                  </div>
                </div>
                <div className="admin-prow-actions">
                  <button style={smallBtn()} onClick={() => setOpenStock({ id: it.id, adding: true })}>+ 입고</button>
                  <button style={smallBtn()} onClick={() => setOpenStock(stockOpen ? null : { id: it.id, adding: false })}>{stockOpen ? '입고 기록 닫기' : '입고 기록'}</button>
                  <Link href={`/admin/products?item=${it.id}`} style={smallBtn()}>게시하기</Link>
                  <button style={smallBtn()} onClick={() => openEdit(it)}>고치기</button>
                  <button style={smallBtn(true)} disabled={busyId === it.id} onClick={() => remove(it)}>{busyId === it.id ? '지우는 중...' : '삭제'}</button>
                </div>
              </div>
              {stockOpen && <PurchasePanel key={`${it.id}-${openStock?.adding}`} token={token} item={it} startAdding={openStock?.adding ?? false} onChanged={reload} onClose={() => setOpenStock(null)} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
