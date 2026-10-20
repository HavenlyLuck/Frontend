'use client'

import {
  ArchiveIcon,
  CoinsIcon,
  GiftIcon,
  InfoIcon,
  LightningIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  SparkleIcon,
  StorefrontIcon,
  TicketIcon,
  WarningIcon,
} from '@phosphor-icons/react'

// 바로가기 — id는 다른 페이지의 "도움이 필요하다면?" 링크(/guide#응모 등)가 쓰므로 바꾸지 않는다
const SECTIONS = [
  { id: '포인트', label: '포인트', icon: CoinsIcon },
  { id: '응모', label: '응모', icon: TicketIcon },
  { id: '쿠지', label: '쿠지', icon: GiftIcon },
  { id: '상점', label: '상점', icon: StorefrontIcon },
  { id: '캐릭터', label: '캐릭터', icon: PaintBrushIcon },
  { id: '컨텐츠', label: '컨텐츠', icon: SparkleIcon },
  { id: '보관함', label: '보관함·배송', icon: ArchiveIcon },
] as const

function SectionTitle({ icon: Icon, title, summary }: { icon: React.ElementType; title: string; summary: string }) {
  return (
    <div className="guide-section-head">
      <h2 className="guide-section-title"><Icon size={24} weight="fill" color="var(--accent)" /> {title}</h2>
      <p className="guide-section-summary">{summary}</p>
    </div>
  )
}

function Steps({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <ol className="guide-steps">
      {items.map((s, i) => (
        <li key={s.title} className="guide-step">
          <span className="guide-step-no">{i + 1}</span>
          <div>
            <div className="guide-step-title">{s.title}</div>
            <div className="guide-step-desc">{s.desc}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Rules({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="guide-rules">
      {items.map((r, i) => <li key={i}>{r}</li>)}
    </ul>
  )
}

function Callout({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: React.ReactNode }) {
  const Icon = tone === 'warn' ? WarningIcon : InfoIcon
  return (
    <div className={`guide-callout is-${tone}`}>
      <Icon size={16} weight="fill" />
      <div>{children}</div>
    </div>
  )
}

export default function GuidePage() {
  return (
    <div className="home-container guide" style={{ maxWidth: 860 }}>
      {/* 소개 */}
      <div className="guide-hero">
        <div className="guide-hero-title">천 원으로 만나는 행운, <span>천운</span></div>
        <p>
          비싼 가격 때문에 쿠지나 피규어를 망설이셨다면, 1,000원부터 부담 없이 도전해 보세요.
          하루에 예상치 못한 행운과 행복을 전해드리는 것, 그리고 다양한 상품으로 모두의 일상을 행운으로 채우는 것이 천운의 목표예요.
        </p>
      </div>

      {/* 바로가기 */}
      {/* 전역 nav 스타일(상단 메뉴용)을 피하려고 div + role 사용 */}
      <div className="guide-toc" role="navigation" aria-label="가이드 바로가기">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#${id}`} className="guide-toc-chip"><Icon size={14} weight="fill" /> {label}</a>
        ))}
      </div>

      {/* 포인트 */}
      <section id="포인트" className="guide-section">
        <SectionTitle icon={CoinsIcon} title="포인트" summary="응모권 · 쿠지 · 일반 상점은 카드로 바로 결제해요. 포인트는 보상으로 받는 쌀포인트와 쌀 응모권이 있어요." />
        <div className="guide-table-wrap">
          <table className="guide-table">
            <thead>
              <tr><th></th><th>🌾 쌀포인트</th><th>🎫 쌀 응모권</th></tr>
            </thead>
            <tbody>
              <tr><th>얻는 방법</th><td>응모 낙첨 시 지급</td><td>대회·이벤트 보상</td></tr>
              <tr><th>쓰는 곳</th><td>쌀포인트 상점, 캐릭터 아이템</td><td>응모 (1장 = 응모권 1장)</td></tr>
              <tr><th>현금으로 돌려받기</th><td className="is-no">불가</td><td className="is-no">불가</td></tr>
              <tr><th>낙첨 시 쌀포인트</th><td>-</td><td className="is-no">지급 안 됨</td></tr>
            </tbody>
          </table>
        </div>
        <Callout>쌀 응모권은 보상으로 무료로 드리는 응모권이라, 낙첨돼도 쌀포인트가 지급되지 않아요. 돈으로는 살 수 없어요.</Callout>
      </section>

      {/* 응모 */}
      <section id="응모" className="guide-section">
        <SectionTitle icon={TicketIcon} title="응모" summary="응모권이 모두 팔리면 자동으로 추첨하는, 천운의 메인 시스템이에요." />
        <Steps items={[
          { title: '응모권 구매', desc: '1장 1,000원, 카드로 결제해요. 한 상품에 여러 장 살 수 있어요.' },
          { title: '응모권 매진', desc: '상품마다 정해진 장수가 모두 팔리면 응모가 마감돼요.' },
          { title: '1분 뒤 자동 추첨', desc: 'drand(여러 기관이 함께 만드는 공개 난수)로 공정하게 추첨해요.' },
          { title: '결과 확인', desc: '마이페이지 › 응모 내역의 "당첨결과 확인하기"에서 번개 추첨 연출과 함께 확인해요.' },
        ]} />
        <Rules items={[
          <>당첨 확률 = <b>내 응모권 수 ÷ 전체 응모권 수</b></>,
          <>당첨되면 상품은 <b>보관함</b>으로 들어가요.</>,
          <>낙첨되면 <b>산 응모권 1장당 1,000 쌀포인트</b>를 드려요.</>,
          <>원하는 응모는 응모권을 더 사거나 친구에게 알려서 마감 전에 빨리 채울 수 있어요.</>,
          <>사라진 응모는 나중에 로테이션으로 다시 열릴 수 있어요.</>,
        ]} />
        <Callout tone="warn">
          <b>당첨되면 상품만 드려요.</b> 여러 장을 샀더라도 나머지 장수에 대한 쌀포인트는 지급되지 않아요.
          <div className="guide-example">예) 15장 구매 → 당첨: 상품만 / 낙첨: 15,000 쌀포인트</div>
        </Callout>
        <Callout tone="warn">
          <b>응모마다 제한 시간이 있어요.</b> 시간 안에 응모권이 다 팔리지 않으면 응모가 취소되고, 응모권 결제는 카드로 자동 환불돼요.
        </Callout>
      </section>

      {/* 쿠지 */}
      <section id="쿠지" className="guide-section">
        <SectionTitle icon={GiftIcon} title="쿠지" summary="이치방쿠지처럼 번호를 골라 뽑으면, 그 자리에서 바로 결과가 나와요." />
        <Steps items={[
          { title: '뽑을 개수 정하기', desc: '쿠지 상세에서 몇 장 뽑을지 정하고 "뽑기 시작"을 눌러요.' },
          { title: '번호 고르기', desc: '쿠지판에서 원하는 번호를 골라요. 이미 뽑힌 번호는 회색으로 잠겨 있어요.' },
          { title: '결과 확인', desc: '카드를 하나씩 뒤집어 등급을 확인해요. "모두 열기"로 한 번에 볼 수도 있어요.' },
        ]} />
        <Rules items={[
          <>응모와 달리 매진을 기다리지 않아요. <b>뽑는 즉시 등급이 확정</b>돼요.</>,
          <>상위상(A상·B상 등) 남은 수량은 쿠지판에서 실시간으로 확인할 수 있어요.</>,
          <>고르는 사이 다른 분이 같은 번호를 먼저 뽑으면, 그 번호만 풀리고 다시 고를 수 있어요. 이미 결제했다면 결제는 자동으로 취소돼요.</>,
          <>상위상이 모두 나가고 라스트원상만 남은 쿠지판은 조기 마감되거나 특별 이벤트가 열릴 수 있어요.</>,
        ]} />
        <Callout>
          <b><LightningIcon size={14} weight="fill" /> 라스트원상</b> — 쿠지판의 <b>마지막 1장을 뽑은 분</b>께 추가로 드리는 특별한 상이에요. 상위상이 다 나가도 끝까지 노려볼 이유가 돼요.
        </Callout>
      </section>

      {/* 상점 */}
      <section id="상점" className="guide-section">
        <SectionTitle icon={StorefrontIcon} title="상점" summary="피규어와 굿즈를 바로 살 수 있어요. 결제 방식에 따라 상점이 나뉘어요." />
        <div className="guide-cards">
          <div className="guide-card">
            <div className="guide-card-title">💳 일반 상점</div>
            <Rules items={[
              '피규어 · 굿즈 · 카드',
              '카드로 바로 결제해요.',
            ]} />
          </div>
          <div className="guide-card">
            <div className="guide-card-title">🌾 쌀포인트 상점</div>
            <Rules items={[
              '쿠폰 · 굿즈 · 아바타',
              '쌀포인트만으로 살 수 있어요.',
              '아바타 탭에서는 아이템을 내 캐릭터에 입어보고 살 수 있어요.',
            ]} />
          </div>
        </div>
      </section>

      {/* 캐릭터 */}
      <section id="캐릭터" className="guide-section">
        <SectionTitle icon={PaintBrushIcon} title="캐릭터" summary="나만의 픽셀 캐릭터를 꾸며서 추첨과 대회에 등장시켜 보세요." />
        <Rules items={[
          <>마이페이지 › <b>캐릭터 꾸미기</b>에서 머리, 옷, 피부색을 자유롭게 바꿀 수 있어요 (무료).</>,
          <>무기·모자·망토·스킨 같은 특별 아이템은 <b>쌀포인트 상점 › 아바타</b>에서 살 수 있어요.</>,
          <>꾸민 캐릭터는 응모 <b>번개 추첨 화면</b>, 쿠지 뽑기 화면, 아바타 대회에 그대로 나와요.</>,
          <>"추첨영상 미리보기"로 추첨 화면에서 어떻게 보일지 미리 확인할 수 있어요.</>,
        ]} />
      </section>

      {/* 컨텐츠 */}
      <section id="컨텐츠" className="guide-section">
        <SectionTitle icon={SparkleIcon} title="컨텐츠" summary="일시적인 이벤트나 각종 컨텐츠를 즐길 수 있어요." />
        <div className="guide-card">
          <div className="guide-card-title">👑 아바타 자랑 대회 (매주)</div>
          <Rules items={[
            '매주 월요일 0시에 시작해 일요일 자정에 순위가 확정돼요.',
            '참가는 무료예요. 지금 저장된 내 캐릭터로 참가해요.',
            '한 계정당 하루 1표, 내 캐릭터에는 투표할 수 없어요.',
            '1·2·3등에게 수상자 전용 왕관과 쌀 응모권을 드려요.',
          ]} />
        </div>
      </section>

      {/* 보관함 · 배송 */}
      <section id="보관함" className="guide-section">
        <SectionTitle icon={ArchiveIcon} title="보관함 · 배송" summary="당첨되거나 구매한 상품은 모두 보관함에 모여요." />
        <Steps items={[
          { title: '보관함에 담김', desc: '응모 당첨, 쿠지 결과, 상점 구매 상품이 마이페이지 › 보관함에 들어가요.' },
          { title: '배송 신청', desc: '보관함에서 받을 상품을 골라 배송지를 정하고 배송을 신청해요.' },
        ]} />
      </section>

      <div className="guide-footer">
        <MegaphoneIcon size={16} weight="fill" /> 이벤트와 변경 사항은 <a href="/notice">공지사항</a>에서, 궁금한 점은 <a href="/review">후기/문의</a>에서 확인해 주세요.
      </div>
    </div>
  )
}
