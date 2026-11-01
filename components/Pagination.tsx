'use client'

// 마이페이지 목록 페이지 버튼 (‹ 1 2 3 ›) — 한 페이지뿐이면 아무것도 안 그린다. 모양은 관리자 목록과 같다(.admin-pagination)
export default function Pagination({ page, pageCount, onChange, label }: {
  page: number
  pageCount: number
  onChange: (page: number) => void
  label: string
}) {
  if (pageCount <= 1) return null
  return (
    <div className="admin-pagination" role="navigation" aria-label={label} style={{ marginTop: 16 }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="이전 페이지">‹</button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          className={n === page ? 'active' : ''}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="다음 페이지">›</button>
    </div>
  )
}
