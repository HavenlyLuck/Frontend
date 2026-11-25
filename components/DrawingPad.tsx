'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowCounterClockwiseIcon, EraserIcon, PencilSimpleIcon, TrashIcon, XIcon } from '@phosphor-icons/react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

/*
 * 그림판 — 팝업으로 열리는 정사각형 캔버스. 마우스 · 손가락 · 펜 모두 된다 (pointer 이벤트).
 * 다 그리면 PNG로 넘긴다. 다시 열면 이어서 그릴 수 있게 지난 그림(initial)을 깔고 시작한다.
 */

const SIZE = 800   // 캔버스 실제 크기(px) — 화면에는 맞춰 줄여서 보인다
const BG = '#ffffff'
const COLORS = [
  '#1f1f24', '#ffffff', '#8a8f9c', '#e5484d', '#f76b15', '#ffc53d', '#46a758',
  '#12a594', '#3e63dd', '#8e4ec6', '#e93d82', '#a18072', '#f5d0b0',
]
const WIDTHS = [
  { label: '가늘게', px: 5 },
  { label: '보통', px: 12 },
  { label: '굵게', px: 26 },
]
const MAX_UNDO = 30

export default function DrawingPad({ open, title = '그림판', initial, onCancel, onDone }: {
  open: boolean
  title?: string                      // 머리 제목 (예: "모자 그리기")
  initial: string | null              // 이어 그릴 지난 그림 (data URL)
  onCancel: () => void
  onDone: (png: Blob, dataUrl: string) => void
}) {
  useBodyScrollLock(open)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState(COLORS[0])
  const [width, setWidth] = useState(WIDTHS[1].px)
  const [eraser, setEraser] = useState(false)
  const [undoCount, setUndoCount] = useState(0)
  const [blank, setBlank] = useState(true)
  const undoStack = useRef<ImageData[]>([])
  const drawing = useRef<{ x: number; y: number } | null>(null)

  const ctx = () => canvasRef.current?.getContext('2d') ?? null

  // 열 때마다 흰 바탕을 깔고, 지난 그림이 있으면 그 위에 그린다
  useEffect(() => {
    if (!open) return
    const c = ctx()
    if (!c) return
    c.fillStyle = BG
    c.fillRect(0, 0, SIZE, SIZE)
    undoStack.current = []
    setUndoCount(0)
    setBlank(!initial)
    if (initial) {
      const img = new Image()
      img.onload = () => c.drawImage(img, 0, 0, SIZE, SIZE)
      img.src = initial
    }
  }, [open, initial])

  const pushUndo = () => {
    const c = ctx()
    if (!c) return
    undoStack.current.push(c.getImageData(0, 0, SIZE, SIZE))
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift()
    setUndoCount(undoStack.current.length)
  }

  const undo = useCallback(() => {
    const c = ctx()
    const last = undoStack.current.pop()
    if (!c || !last) return
    c.putImageData(last, 0, 0)
    setUndoCount(undoStack.current.length)
  }, [])

  // Ctrl/⌘ + Z 로 되돌리기
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, undo])

  // 화면 좌표 → 캔버스 좌표
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * SIZE, y: ((e.clientY - rect.top) / rect.height) * SIZE }
  }

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const c = ctx()
    if (!c) return
    c.strokeStyle = eraser ? BG : color
    c.lineWidth = eraser ? width * 2 : width
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.beginPath()
    c.moveTo(from.x, from.y)
    c.lineTo(to.x, to.y)
    c.stroke()
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    pushUndo()
    const p = point(e)
    drawing.current = p
    stroke(p, p)   // 콕 찍어도 점이 남게
    if (!eraser) setBlank(false)
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    // 빠르게 그을 때 끊기지 않게 사이 점들까지 이어 그린다
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    const points = events.length > 0
      ? events.map(ev => {
        const rect = e.currentTarget.getBoundingClientRect()
        return { x: ((ev.clientX - rect.left) / rect.width) * SIZE, y: ((ev.clientY - rect.top) / rect.height) * SIZE }
      })
      : [point(e)]
    for (const p of points) {
      stroke(drawing.current, p)
      drawing.current = p
    }
  }

  const onUp = () => { drawing.current = null }

  const clearAll = () => {
    if (blank && undoCount === 0) return
    if (!confirm('그림을 모두 지울까요?')) return
    pushUndo()
    const c = ctx()
    if (!c) return
    c.fillStyle = BG
    c.fillRect(0, 0, SIZE, SIZE)
    setBlank(true)
  }

  const done = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => {
      if (blob) onDone(blob, canvas.toDataURL('image/png'))
    }, 'image/png')
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`}>
      {open && (
        <div className="modal drawing-pad" role="dialog" aria-modal="true" aria-label={title}>
          <div className="drawing-pad-head">
            <span className="drawing-pad-title">{title}</span>
            <button type="button" className="drawing-pad-icon" aria-label="닫기" onClick={onCancel}><XIcon size={18} /></button>
          </div>

          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className={`drawing-pad-canvas${eraser ? ' is-eraser' : ''}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={onUp}
          />

          <div className="drawing-pad-tools">
            <div className="drawing-pad-row">
              <button type="button" className={`drawing-pad-tool${!eraser ? ' active' : ''}`} onClick={() => setEraser(false)}>
                <PencilSimpleIcon size={16} weight="bold" /> 펜
              </button>
              <button type="button" className={`drawing-pad-tool${eraser ? ' active' : ''}`} onClick={() => setEraser(true)}>
                <EraserIcon size={16} weight="bold" /> 지우개
              </button>
              <span className="drawing-pad-sep" />
              {WIDTHS.map(w => (
                <button
                  key={w.px}
                  type="button"
                  className={`drawing-pad-width${width === w.px ? ' active' : ''}`}
                  aria-label={w.label}
                  title={w.label}
                  onClick={() => setWidth(w.px)}
                >
                  <span style={{ width: Math.max(4, w.px / 2), height: Math.max(4, w.px / 2) }} />
                </button>
              ))}
              <span className="drawing-pad-sep" />
              <button type="button" className="drawing-pad-icon" aria-label="되돌리기" title="되돌리기 (Ctrl+Z)" onClick={undo} disabled={undoCount === 0}>
                <ArrowCounterClockwiseIcon size={17} />
              </button>
              <button type="button" className="drawing-pad-icon" aria-label="모두 지우기" title="모두 지우기" onClick={clearAll}>
                <TrashIcon size={17} />
              </button>
            </div>
            <div className="drawing-pad-row drawing-pad-colors">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`drawing-pad-color${!eraser && color === c ? ' active' : ''}`}
                  style={{ background: c }}
                  aria-label={`색 ${c}`}
                  onClick={() => { setColor(c); setEraser(false) }}
                />
              ))}
            </div>
          </div>

          <div className="modal-btn-row">
            <button type="button" className="btn-cancel" onClick={onCancel}>취소</button>
            <button type="button" className="btn-confirm" onClick={done} disabled={blank}>다 그렸어요</button>
          </div>
        </div>
      )}
    </div>
  )
}
