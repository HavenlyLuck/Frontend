const sentenceStyle: React.CSSProperties = {
  display: 'block',
}

const box = (bg: string): React.CSSProperties => ({
  background: bg,
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 20,
  fontSize: 16,
  color: '#454545',
  lineHeight: 2,
})

export default function GuidePage() {
  return (
    <div>
      <div className="home-container" style={{ maxWidth: 800 }}>

        <div style={box('#F2F2F2')}>
          <span style={sentenceStyle}>천원으로 행운을 '천운' 입니다.</span>
          <span style={sentenceStyle}>저희는 응모 시스템을 통해 비싼 가격때문에 기존 쿠지나 피규어 구입에 망설이시는 분들의 짐을 덜어드리고, 부담없이 가벼운 가격으로 하루에 예상치 못한 행운과 행복을 가져다 드리고 싶습니다.</span>
          <span style={sentenceStyle}>나아가 다양한 분야의 상품들 또한 도입하여 모든 사람들의 일상에 행운이 가득한 삶을 만드는 것이 목표입니다.</span>
        </div>

        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#181818', marginBottom: 16 }}>
            <span className="emoji">🎰</span> 포인트
          </h2>
          <div style={box('#F2F2F2')}>
            <span style={sentenceStyle}>저희는 크게 🎰 운포인트와 🌾 쌀포인트로 나뉘어져 있습니다.</span>
            <span style={sentenceStyle}>🎰 운포인트는 현금을 충전하면 얻는 포인트로, 일반적으로 플랫폼 내의 응모 시스템, 쿠지, 상점 내 피규어를 사는데에 사용됩니다.</span>
            <span style={{ ...sentenceStyle, fontWeight: 700, color: '#6BA5F2' }}>언제든 남은 🎰 운포인트는 현금으로 다시 변환하실 수 있습니다.</span>
          </div>
          <div style={box('#F2F2F2')}>
            <span style={sentenceStyle}>🌾 쌀포인트는 응모 시스템을 이용하셨을 때, 낙첨일 경우 받을 수 있는 포인트입니다.</span>
            <span style={sentenceStyle}>🌾 쌀포인트로는 상점 내 🎰 운포인트 상점에서 피규어 구입 시, 일정 금액을 🌾 쌀포인트로 소모하여 할인된 가격에 구매하실 수 있습니다.</span>
            <span style={sentenceStyle}>또한 상점 내에 🌾 쌀포인트 상점이 구비되어 있어, 🌾 쌀포인트만으로도 구매하실 수 있는 상품들이 마련되어 있습니다.</span>
            <span style={{ ...sentenceStyle, fontWeight: 700, color: '#6BA5F2' }}>다만 🌾 쌀포인트는 현금으로 변환하실 수 없습니다.</span>
          </div>
        </section>

        <section id="응모" style={{ marginBottom: 56, scrollMarginTop: 140 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#181818', marginBottom: 16 }}>
            <span className="emoji">🎟</span> 응모
          </h2>
          <div style={box('#F2F2F2')}>
            <span style={sentenceStyle}>저희의 주된 시스템인 응모 시스템입니다.</span>
            <span style={sentenceStyle}>응모권은 기본 1,000 🎰 운포인트로 구매할 수 있으며, 인 당 여러 장 구매 가능합니다.</span>
            <span style={sentenceStyle}>상품 당 필수로 채워져야 하는 응모권 개수가 있으며, 응모권이 모두 구매되면 해당 응모가 시작됩니다.</span>
            <span style={sentenceStyle}>당첨 확률은 (구매하신 응모권 개수 / 상품의 전체 응모권 개수)이고, 추첨은 핀볼 시스템을 통해 공정하게 진행됩니다.</span>
            <span style={sentenceStyle}>당첨자는 당첨된 상품을 보관함에서 확인하실 수 있습니다.</span>
            <span style={sentenceStyle}>낙첨자에게는 (구매하신 응모권 개수 × 1,000) 🌾 쌀포인트가 지급됩니다.</span>
            <span style={{ ...sentenceStyle, fontWeight: 700, color: '#6BA5F2' }}>다만, 1인이 한 응모에서 여러 장의 응모권을 구매한 경우에 당첨 시 나머지 응모권에 대한 🌾 쌀포인트는 지급되지 않습니다.</span>
            <span style={sentenceStyle}>ex) 응모권 15장을 사서 당첨된 경우에 14,000 🌾 쌀포인트와 응모 피규어 지급이 아닌 응모 피규어만 지급됩니다. 낙첨 시에는 15장을 구매했으므로 15,000 🌾 쌀포인트가 정상 지급됩니다.</span>
            <span style={{ ...sentenceStyle, fontWeight: 700, color: '#6BA5F2' }}>각각의 응모들은 제한 시간이 정해져 있으며, 해당 시간 내에 조건이 만족되지 않아 진행되지 않으면 자동으로 사라집니다.</span>
            <span style={sentenceStyle}>이때 구매하신 응모권들은 자동으로 🎰 운포인트로 환급됩니다.</span>
            <span style={sentenceStyle}>응모권을 구입하시거나 친구에게 알리기를 통해 원하는 응모가 닫히기 전에 빠르게 진행시키실 수 있습니다.</span>
            <span style={sentenceStyle}>사라진 응모들은 추후 로테이션을 통해 다시 나타날 수 있습니다.</span>
          </div>
        </section>

        <section id="쿠지" style={{ marginBottom: 56, scrollMarginTop: 140 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#181818', marginBottom: 16 }}>
            <span className="emoji">🎁</span> 쿠지
          </h2>
          <div style={box('#F2F2F2')}>
            <span style={sentenceStyle}>기존 쿠지와 같은 방식으로, 상위상 매물 현황을 쿠지판을 통해 실시간으로 확인하실 수 있습니다.</span>
            <span style={sentenceStyle}>상위상이 모두 소진되어 라스트 원 상만 남은 쿠지판은 시간에 따라서 조기 마감되거나 특별 이벤트가 진행될 수 있습니다.</span>
          </div>
        </section>

        <section id="상점" style={{ marginBottom: 56, scrollMarginTop: 140 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#181818', marginBottom: 16 }}>
            <span className="emoji">🏪</span> 상점
          </h2>
          <div style={box('#F2F2F2')}>
            <span style={sentenceStyle}>일반 피규어와 굿즈 등 상품을 판매하는 상점입니다.</span>
            <span style={sentenceStyle}>상점은 🎰 운포인트로 살 수 있는 상점과 🌾 쌀포인트 상점이 나뉘어져 있습니다.</span>
            <span style={sentenceStyle}>🎰 운포인트 상점에 있는 상품들은 일부를 제외하고, 원한다면 직접 응모를 열어서 여러 사람들과 행운을 겨뤄볼 수도 있습니다.</span>
            <span style={{ ...sentenceStyle, fontWeight: 700, color: '#6BA5F2' }}>이때 만든 응모 또한, 일정 시간 동안 성사되지 않는다면 자동으로 사라집니다.</span>
          </div>
        </section>

      </div>
    </div>
  )
}
