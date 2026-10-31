import Link from "next/link";
import { InfoIcon } from "@phosphor-icons/react";

// 상품 상세의 구매 버튼 아래에 늘 보이는 취소·환불 요약. 자세한 기준은 /refund
type Kind = "raffle" | "kuji" | "shop-cash" | "shop-point";

const LINES: Record<Kind, { anchor: string; items: React.ReactNode[] }> = {
  raffle: {
    anchor: "응모",
    items: [
      <>매진 전에는 <b>마이페이지 › 응모 내역</b>에서 취소하고 전액 환불받을 수 있어요.</>,
      <>시간 안에 다 팔리지 않으면 응모가 취소되고 <b>자동으로 전액 환불</b>돼요.</>,
      <><b>매진되어 추첨이 시작되면 취소·환불할 수 없어요.</b> 낙첨된 응모권은 1장당 1,000 쌀포인트로 돌려드려요.</>,
      <>당첨 상품이 파손·불량이면 교환해 드려요. 택배 상자 개봉 영상을 찍어 두시면 빠르게 처리돼요.</>,
    ],
  },
  kuji: {
    anchor: "쿠지",
    items: [
      <><b>결제와 동시에 결과가 정해져서 결제 후에는 취소·환불할 수 없어요.</b></>,
      <>받은 상품이 파손·불량이면 교환해 드려요. 택배 상자 개봉 영상을 찍어 두시면 빠르게 처리돼요.</>,
    ],
  },
  "shop-cash": {
    anchor: "상점",
    items: [
      <>배송 전에는 <b>마이페이지 › 보관함</b>에서 바로 취소할 수 있어요.</>,
      <>받은 날부터 7일 안에 반품을 요청할 수 있어요. 단, 상자나 포장을 개봉해 상품 가치가 떨어지면 반품이 어려워요.</>,
      <>파손·불량은 받은 날부터 3개월 안에 교환해 드려요. 택배 상자 개봉 영상을 찍어 두시면 빠르게 처리돼요.</>,
    ],
  },
  "shop-point": {
    anchor: "상점",
    items: [
      <><b>쌀포인트로 교환한 상품은 교환 후 취소할 수 없어요.</b></>,
      <>받은 상품이 파손·불량이면 교환해 드려요. 택배 상자 개봉 영상을 찍어 두시면 빠르게 처리돼요.</>,
    ],
  },
};

export default function RefundNotice({ kind, style }: { kind: Kind; style?: React.CSSProperties }) {
  const { anchor, items } = LINES[kind];
  return (
    <div className="refund-notice" style={style}>
      <div className="refund-notice-head">
        <InfoIcon size={14} weight="fill" /> 취소·환불 안내
        <Link href={`/refund#${anchor}`} className="refund-notice-link">
          자세히 보기
        </Link>
      </div>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
