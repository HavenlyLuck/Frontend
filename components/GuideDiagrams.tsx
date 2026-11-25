'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  ArrowRightIcon,
  CreditCardIcon,
  CoinsIcon,
  LightningIcon,
  ProhibitIcon,
  TicketIcon,
  TruckIcon,
  TrophyIcon,
  UsersIcon,
} from '@phosphor-icons/react'
import PixelAvatar from '@/components/PixelAvatar'
import EmojiIcon from '@/components/EmojiIcon'
import type { AvatarConfig } from '@/lib/avatar/compose'
import { SHIPPING_FEE_TEXT, SHIP_WITHIN_BUSINESS_DAYS } from '@/lib/shipping'
import { STORAGE_KEEP_DAYS } from '@/lib/storageExpiry'

/*
 * 가이드 "한눈에 보기" 그림들 — 섹션마다 3~4칸 그림이 한 칸씩 차례로 움직이고 반복한다.
 * 장면은 한 박자(STEP_MS)씩 넘어가고, 각 칸은 자기 박자 구간에서만 움직인다(지금 움직이는 칸은 빨간 테두리).
 * 움직임 줄이기 설정이면 마지막 장면으로 멈춰 둔다.
 */

const STEP_MS = 700

// 박자를 밖에서 정해 줄 때 (인스타 릴스 영상 — reels/ 폴더의 Remotion이 프레임마다 박자를 넣는다). null이면 스스로 반복
export const DiagramStepContext = createContext<number | null>(null)

function useStep(total: number): number {
  const forced = useContext(DiagramStepContext)
  const [step, setStep] = useState(total - 1)
  useEffect(() => {
    if (forced != null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setStep(0)
    const id = window.setInterval(() => setStep((s) => (s + 1) % total), STEP_MS)
    return () => window.clearInterval(id)
  }, [total, forced])
  return forced != null ? Math.min(total - 1, Math.max(0, forced)) : step
}

function Row({ n, label, children }: { n: 3 | 4; label: string; children: ReactNode }) {
  return <div className={`gd-row n${n}`} role="img" aria-label={label}>{children}</div>
}

function Panel({ no, caption, active, children, stageClass = '' }: {
  no: number
  caption: ReactNode
  active: boolean
  children: ReactNode
  stageClass?: string
}) {
  return (
    <figure className={`gd-panel${active ? ' is-active' : ''}`}>
      <div className={`gd-stage ${stageClass}`}>{children}</div>
      <figcaption><b>{no}</b> {caption}</figcaption>
    </figure>
  )
}

// 구간 [from, to] 안이면 true
const within = (step: number, from: number, to: number) => step >= from && step <= to

const PEOPLE: AvatarConfig[] = [
  { v: 3, hair: 'short', hat: 'hat-cap' },
  { v: 3, hair: 'buns', top: 'top-cat-hoodie' },
  { v: 3, hair: 'buns', hairItem: 'hair-pink-buns' },
  { v: 3, hair: 'short', held: 'held-balloon' },
]
const ME: AvatarConfig = { v: 3, hair: 'buns', hairItem: 'hair-pink-buns' }
const FRIEND: AvatarConfig = { v: 3, hair: 'short', hat: 'hat-cap' }

function Person({ config, className = '', children }: { config: AvatarConfig; className?: string; children?: ReactNode }) {
  return (
    <div className={`gd-person ${className}`}>
      {children}
      <PixelAvatar config={config} size={44} />
    </div>
  )
}

// ── 응모 ──
// 0 빈 칸 · 1~4 한 사람씩 응모권 구매 · 5~8 칸이 차오름 · 9 매진 · 10 번개 · 11~13 결과
export function RaffleDiagram() {
  const step = useStep(14)
  const WINNER = 2
  const bought = within(step, 1, 13) ? Math.min(4, step) : 0
  const sold = step <= 4 ? 0 : Math.min(8, (step - 4) * 2)
  const STRIKE = 10
  const RESULT = 11
  return (
    <Row n={4} label="응모 진행 그림: 1,000원 응모권을 사고, 다 팔리면 마감, 산 응모권 수만큼 당첨 확률이 오르는 난수 추첨으로 한 명이 당첨, 낙첨은 쌀포인트">
      <Panel no={1} caption="1,000원 응모권을 사요" active={within(step, 1, 4)}>
        {PEOPLE.map((p, i) => (
          <Person key={i} config={p}>
            <span className={`gd-pop gd-ticket${i < bought ? ' on' : ''}`}><TicketIcon size={14} weight="fill" /></span>
          </Person>
        ))}
      </Panel>
      <Panel no={2} caption="다 팔리면 마감돼요" active={within(step, 5, 9)} stageClass="gd-col">
        <div className="gd-grid">
          {Array.from({ length: 8 }, (_, i) => <i key={i} className={i < sold ? 'on' : undefined} />)}
        </div>
        <div className={`gd-count${sold === 8 ? ' full' : ''}`}>{sold === 8 ? '매진!' : `${sold} / 8장`}</div>
      </Panel>
      <Panel no={3} caption="응모권 수만큼 확률이 오르는 난수 추첨" active={step === STRIKE} stageClass={step === STRIKE ? 'is-flash' : ''}>
        {PEOPLE.map((p, i) => (
          <Person key={i} config={p} className={i === WINNER && step >= STRIKE ? 'is-glow' : ''}>
            {i === WINNER && <span className={`gd-bolt${step === STRIKE ? ' on' : ''}`}><LightningIcon size={26} weight="fill" /></span>}
          </Person>
        ))}
      </Panel>
      <Panel no={4} caption="당첨은 상품, 낙첨은 1장당 1,000P" active={step >= RESULT}>
        {PEOPLE.map((p, i) => (
          <Person key={i} config={p} className={step < RESULT ? '' : i === WINNER ? 'is-glow' : 'is-dim'}>
            <span className={`gd-pop ${i === WINNER ? 'gd-chip gold' : 'gd-coin'}${step >= RESULT ? ' on' : ''}`}>
              {i === WINNER ? '당첨' : <CoinsIcon size={13} weight="fill" />}
            </span>
          </Person>
        ))}
      </Panel>
    </Row>
  )
}

// ── 쿠지 ──
// 0 빈 판 · 1~2 번호 두 개 고르기 · 3~4 카드 뒤집기 · 5 대기 · 6 마지막 한 장 · 7~8 라스트원상
const KUJI_TAKEN = [0, 2, 3, 5, 6, 7, 9, 10]
const KUJI_PICK = [4, 8]
const KUJI_LAST = 1
export function KujiDiagram() {
  const step = useStep(10)
  const picked = within(step, 1, 9) ? Math.min(2, step) : 0
  const flipped = step >= 3 ? Math.min(2, step - 2) : 0
  return (
    <Row n={3} label="쿠지 진행 그림: 번호를 고르면 결제와 동시에 등급이 정해지고, 마지막 한 장을 뽑으면 라스트원상">
      <Panel no={1} caption="쿠지판에서 번호를 골라요" active={within(step, 1, 2)} stageClass="gd-col">
        <div className="gd-board">
          {Array.from({ length: 12 }, (_, i) => {
            const pickIdx = KUJI_PICK.indexOf(i)
            const cls = KUJI_TAKEN.includes(i) ? 'taken' : pickIdx >= 0 && pickIdx < picked ? 'pick' : ''
            return <i key={i} className={cls}>{i + 1}</i>
          })}
        </div>
      </Panel>
      <Panel no={2} caption="결제하면 바로 등급 확정" active={within(step, 3, 5)}>
        {['B상', 'D상'].map((g, i) => (
          <div key={g} className={`gd-card${i < flipped ? ' flip' : ''}`}>
            <span className="back"><EmojiIcon name="box" /></span>
            <span className="front">{g}</span>
          </div>
        ))}
      </Panel>
      <Panel no={3} caption="마지막 한 장은 라스트원상" active={step >= 6} stageClass="gd-col">
        <div className="gd-board small">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} className={i === KUJI_LAST ? (step >= 7 ? 'pick' : step >= 6 ? 'last' : '') : 'taken'} />
          ))}
        </div>
        <span className={`gd-pop gd-chip gold static${step >= 7 ? ' on' : ''}`}><LightningIcon size={12} weight="fill" /> LAST ONE</span>
      </Panel>
    </Row>
  )
}

// ── 포인트 (쌀포인트) ──
// 0 · 1~3 낙첨 보상이 쌓임 · 4~5 쌀포인트 상점에서 씀 · 6~7 일반 상점 할인 · 8~9 현금 불가
export function PointDiagram() {
  const step = useStep(11)
  const coins = within(step, 1, 10) ? Math.min(3, step) : 0
  return (
    <Row n={4} label="쌀포인트 그림: 낙첨되면 쌀포인트를 받고, 쌀포인트 상점에서 쓰거나 일반 상점 상품을 할인받고, 현금으로는 바꿀 수 없어요">
      <Panel no={1} caption="낙첨되면 쌀포인트가 쌓여요" active={within(step, 1, 3)}>
        <Person config={ME} />
        <div className="gd-stack">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`gd-pop gd-chip${i < coins ? ' on' : ''}`}>+1,000P</span>
          ))}
        </div>
      </Panel>
      <Panel no={2} caption="쌀포인트 상점에서 써요" active={within(step, 4, 5)}>
        <span className="gd-icon"><EmojiIcon name="rice" /></span>
        <ArrowRightIcon size={18} className={`gd-arrow${step >= 4 ? ' on' : ''}`} />
        <Person config={step >= 5 ? { ...ME, hat: 'hat-crown' } : ME}>
          <span className={`gd-pop gd-chip${step >= 5 ? ' on' : ''}`}>-3,500P</span>
        </Person>
      </Panel>
      <Panel no={3} caption="일반 상점 상품도 할인받아요" active={within(step, 6, 7)} stageClass="gd-col">
        <StorePriceTag discounted={step >= 7} />
      </Panel>
      <Panel no={4} caption="현금으로는 못 바꿔요" active={step >= 8}>
        <span className="gd-icon"><EmojiIcon name="rice" /></span>
        <ArrowRightIcon size={18} className="gd-arrow on" />
        <span className={`gd-won${step >= 9 ? ' no' : ''}`}>
          ₩<ProhibitIcon size={34} weight="bold" className="gd-no" />
        </span>
      </Panel>
    </Row>
  )
}

// 일반 상점 가격표 — 쌀포인트로 일부를 깎는 모습 (할인 비율은 상품마다 달라서 숫자는 예시)
function StorePriceTag({ discounted }: { discounted: boolean }) {
  return (
    <>
      <span className="gd-icon"><EmojiIcon name="store" /></span>
      <span className={`gd-price${discounted ? ' cut' : ''}`}>
        <s>30,000원</s>
        <b>{discounted ? '27,000원' : '30,000원'}</b>
      </span>
      <span className={`gd-pop gd-chip static${discounted ? ' on' : ''}`}>쌀포인트 -3,000P</span>
    </>
  )
}

// ── 상점 ──
// 0 · 1~2 일반 상점은 카드로 · 3~4 쌀포인트로 할인 · 5~7 쌀포인트 상점
export function StoreDiagram() {
  const step = useStep(9)
  return (
    <Row n={3} label="상점 그림: 일반 상점은 카드로 사고, 쌀포인트로 할인받을 수 있고, 쌀포인트 상점은 쌀포인트로만 사요">
      <Panel no={1} caption="일반 상점은 카드로 바로 사요" active={within(step, 1, 2)}>
        <span className="gd-icon big"><EmojiIcon name="store" /></span>
        <ArrowRightIcon size={18} className={`gd-arrow${step >= 1 ? ' on' : ''}`} />
        <span className={`gd-pop gd-chip static${step >= 2 ? ' on' : ''}`}><CreditCardIcon size={13} weight="fill" /> 카드 결제</span>
      </Panel>
      <Panel no={2} caption="쌀포인트로 할인받아요" active={within(step, 3, 4)} stageClass="gd-col">
        <StorePriceTag discounted={step >= 4} />
      </Panel>
      <Panel no={3} caption="쌀포인트 상점은 쌀포인트로만" active={step >= 5}>
        <span className="gd-icon"><EmojiIcon name="rice" /></span>
        <ArrowRightIcon size={18} className={`gd-arrow${step >= 5 ? ' on' : ''}`} />
        <Person config={step >= 6 ? { ...ME, hat: 'hat-crown' } : ME}>
          <span className={`gd-pop gd-chip${step >= 6 ? ' on' : ''}`}>쿠폰·굿즈·아바타</span>
        </Person>
      </Panel>
    </Row>
  )
}

// ── 쌀 응모권 ──
// 0 · 1~2 친구 추천으로 둘 다 받음 · 3~5 결제 대신 응모 · 6~8 낙첨 보상 없음
export function SsalTicketDiagram() {
  const step = useStep(10)
  return (
    <Row n={3} label="쌀 응모권 그림: 친구 추천·이벤트로 받고, 결제 대신 응모에 1장씩 쓰고, 낙첨돼도 쌀포인트는 없어요">
      <Panel no={1} caption="친구 추천·이벤트로 받아요" active={within(step, 1, 2)}>
        <Person config={FRIEND}>
          <span className={`gd-pop gd-icon-pop${step >= 1 ? ' on' : ''}`}><EmojiIcon name="ssal-ticket" /></span>
        </Person>
        <UsersIcon size={18} className="gd-arrow on" />
        <Person config={ME}>
          <span className={`gd-pop gd-icon-pop${step >= 2 ? ' on' : ''}`}><EmojiIcon name="ssal-ticket" /></span>
        </Person>
      </Panel>
      <Panel no={2} caption="결제 대신 응모권 1장으로 응모" active={within(step, 3, 5)} stageClass="gd-col">
        <div className="gd-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className={i < 5 ? 'on' : i === 5 && step >= 4 ? 'on ssal' : undefined} />
          ))}
        </div>
        <div className="gd-count">{step >= 4 ? '쌀 응모권 1장 = 응모권 1장' : '응모 상품'}</div>
      </Panel>
      <Panel no={3} caption="낙첨돼도 쌀포인트는 없어요" active={step >= 6}>
        <Person config={ME} className={step >= 6 ? 'is-dim' : ''}>
          <span className={`gd-pop gd-coin no${step >= 7 ? ' on' : ''}`}><CoinsIcon size={13} weight="fill" /><ProhibitIcon size={22} className="gd-no" /></span>
        </Person>
      </Panel>
    </Row>
  )
}

// ── 상점 · 응모 전환 ──
// 0 · 1~2 응모권이 모임 · 3~5 응모 상품으로 바뀜 · 6~8 못 모이면 환불
export function FundingDiagram() {
  const step = useStep(10)
  const got = within(step, 1, 9) ? Math.min(2, step) : 0
  return (
    <Row n={3} label="응모 전환 그림: 상점 상품에 응모권이 정해진 장수만큼 모이면 상품이 응모에 올라가고, 기간 안에 못 모이면 전액 환불">
      <Panel no={1} caption="상점 상품에 응모권을 모아요" active={within(step, 1, 2)} stageClass="gd-col">
        <span className="gd-icon big"><EmojiIcon name="store" /></span>
        <div className="gd-meter"><i style={{ width: `${(got / 2) * 100}%` }} /></div>
        <div className={`gd-count${got === 2 ? ' full' : ''}`}>{got} / 2장 모임</div>
      </Panel>
      <Panel no={2} caption="다 모이면 상품이 응모에 올라가요" active={within(step, 3, 5)}>
        <span className="gd-icon big"><EmojiIcon name="store" /></span>
        <ArrowRightIcon size={18} className={`gd-arrow${step >= 3 ? ' on' : ''}`} />
        <span className={`gd-icon big gd-swap${step >= 4 ? ' on' : ''}`}><EmojiIcon name="raffle-placeholder" /></span>
      </Panel>
      <Panel no={3} caption="기간 안에 못 모이면 전액 환불" active={step >= 6}>
        <span className="gd-icon big"><EmojiIcon name="timer" /></span>
        <ArrowRightIcon size={18} className={`gd-arrow${step >= 6 ? ' on' : ''}`} />
        <span className={`gd-pop gd-chip static${step >= 7 ? ' on' : ''}`}>카드 환불</span>
      </Panel>
    </Row>
  )
}

// ── 보관함 · 배송 ──
// 0 · 1~3 상품이 보관함에 모임 · 4~5 배송 신청(묶음 1번 결제) · 6~8 발송 · 9~10 30일 지나면 쌀포인트
export function StorageDiagram() {
  const step = useStep(12)
  const inBox = within(step, 1, 11) ? Math.min(3, step) : 0
  return (
    <Row n={4} label={`보관함 그림: 상품이 보관함에 모이고, ${STORAGE_KEEP_DAYS}일 안에 배송 신청하면 묶어서 발송, 안 하면 쌀포인트로 바뀌어요`}>
      <Panel no={1} caption="받은 상품은 보관함으로" active={within(step, 1, 3)} stageClass="gd-col">
        <div className="gd-items">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`gd-drop${i < inBox ? ' in' : ''}`}><EmojiIcon name="box" /></span>
          ))}
        </div>
        <span className="gd-count">보관함 {inBox}개</span>
      </Panel>
      <Panel no={2} caption={`${STORAGE_KEEP_DAYS}일 안에 배송 신청`} active={within(step, 4, 5)} stageClass="gd-col">
        <span className={`gd-chip static on${step >= 5 ? ' gold' : ''}`}>{step >= 5 ? `묶음 3개 · ${SHIPPING_FEE_TEXT} 한 번` : '배송 신청'}</span>
        <span className="gd-count">D-{step >= 4 ? 12 : STORAGE_KEEP_DAYS}</span>
      </Panel>
      <Panel no={3} caption={`영업일 ${SHIP_WITHIN_BUSINESS_DAYS}일 안에 발송`} active={within(step, 6, 8)}>
        <span className={`gd-truck${step >= 6 ? ' go' : ''}`}><TruckIcon size={34} weight="fill" /></span>
      </Panel>
      <Panel no={4} caption={`신청 안 하면 ${STORAGE_KEEP_DAYS}일 뒤 쌀포인트로`} active={step >= 9}>
        <span className="gd-icon"><EmojiIcon name="box" /></span>
        <ArrowRightIcon size={18} className={`gd-arrow${step >= 9 ? ' on' : ''}`} />
        <span className={`gd-icon gd-swap${step >= 10 ? ' on' : ''}`}><EmojiIcon name="rice" /></span>
      </Panel>
    </Row>
  )
}

// ── 아바타 ──
// 0 · 1~2 꾸미기 · 3~4 쌀포인트 아이템 · 5~6 추첨·쿠지 화면에 등장 · 7~9 컨텐츠·이벤트 보상
const LOOKS: AvatarConfig[] = [
  { v: 3, hair: 'short' },
  { v: 3, hair: 'buns', top: 'top-cat-hoodie' },
  { v: 3, hair: 'short', hat: 'hat-cap', held: 'held-balloon' },
]
const SHELF: AvatarConfig[] = [
  { v: 3, hair: 'short', hat: 'hat-cap' },
  { v: 3, hair: 'buns', top: 'top-cat-hoodie' },
  { v: 3, hair: 'short', held: 'held-balloon' },
]
export function AvatarDiagram() {
  const step = useStep(11)
  const look = step >= 1 && step <= 2 ? LOOKS[step] : LOOKS[0]
  const dressed: AvatarConfig = { v: 3, hair: 'buns', hairItem: 'hair-pink-buns', hat: 'hat-crown', top: 'top-wizard-robe' }
  return (
    <Row n={4} label="아바타 그림: 무료로 꾸미고, 쌀포인트로 아이템을 사고, 추첨·쿠지 화면에 내 아바타가 나오고, 컨텐츠·이벤트로 쌀 응모권이나 상품을 받아요">
      <Panel no={1} caption="나만의 아바타를 꾸며보세요!" active={within(step, 1, 2)}>
        <Person config={look} />
      </Panel>
      <Panel no={2} caption="쌀포인트로 특별 아이템을 사요" active={within(step, 3, 4)}>
        <Person config={step >= 4 ? dressed : LOOKS[0]}>
          <span className={`gd-pop gd-chip${step >= 4 ? ' on' : ''}`}>-3,500P</span>
        </Person>
      </Panel>
      <Panel no={3} caption="추첨·쿠지 화면에 내 아바타가 나와요" active={within(step, 5, 6)}>
        <Person config={SHELF[0]} className={step >= 5 ? 'is-dim' : ''} />
        <Person config={dressed} className={step >= 5 ? 'is-glow' : ''}>
          <span className={`gd-pop gd-chip gold${step >= 6 ? ' on' : ''}`}>나</span>
        </Person>
        <Person config={SHELF[1]} className={step >= 5 ? 'is-dim' : ''} />
      </Panel>
      <Panel no={4} caption="컨텐츠·이벤트로 응모권·상품을 받아요" active={step >= 7}>
        <Person config={dressed}>
          <span className={`gd-pop gd-trophy${step >= 7 ? ' on' : ''}`}><TrophyIcon size={18} weight="fill" /></span>
        </Person>
        <div className="gd-stack">
          <span className={`gd-pop gd-icon-pop${step >= 8 ? ' on' : ''}`}><EmojiIcon name="ssal-ticket" /></span>
          <span className={`gd-pop gd-icon-pop${step >= 9 ? ' on' : ''}`}><EmojiIcon name="box" /></span>
        </div>
      </Panel>
    </Row>
  )
}
