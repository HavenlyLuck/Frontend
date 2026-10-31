import type { Metadata } from "next";
import { BIZ_INFO, PolicyDoc, PolicySection } from "@/components/PolicyDoc";

export const metadata: Metadata = { title: "취소·환불 정책 - 천운" };

export default function RefundPage() {
  return (
    <PolicyDoc
      title="취소·환불 정책"
      current="/refund"
      effectiveDate="2026년 11월 1일"
      intro={
        <p>
          천운은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 청약철회(취소·반품)를 보장합니다.
          다만 응모와 쿠지는 결과가 정해지는 순간 서비스 제공이 끝나기 때문에, 아래처럼 시점에 따라 취소 기준이 다릅니다.
          이 내용은 결제 전 화면에도 함께 안내합니다.
        </p>
      }
    >
      <PolicySection id="응모" title="1. 응모권">
        <table className="policy-table">
          <thead>
            <tr><th>시점</th><th>취소·환불</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>응모권 판매 중 (매진 전)</td>
              <td>마이페이지 응모 내역의 [응모 취소]로 취소할 수 있으며, 결제 금액 전액을 카드 결제 취소로 환불해 드립니다. 화면에서 취소가 안 되면 고객센터로 요청해 주세요.</td>
            </tr>
            <tr>
              <td>제한 시간 안에 매진되지 않은 경우</td>
              <td>응모가 자동으로 취소되고, 결제 금액 전액이 카드로 자동 환불됩니다.</td>
            </tr>
            <tr>
              <td>매진되어 추첨이 시작된 뒤</td>
              <td>취소·환불할 수 없습니다. 추첨이 시작되면 결과가 정해지는 서비스 제공이 개시된 것으로 봅니다(전자상거래법 제17조 제2항).</td>
            </tr>
          </tbody>
        </table>
        <ul className="policy-list">
          <li>낙첨된 응모권은 1장당 1,000 쌀포인트로 지급됩니다. 쌀포인트는 현금으로 환불되지 않습니다.</li>
          <li>당첨 상품은 아래 「4. 상품 파손·하자·오배송」 기준에 따라 교환해 드립니다. 당첨 상품은 단순 변심으로 반품할 수 없습니다.</li>
        </ul>
      </PolicySection>

      <PolicySection id="쿠지" title="2. 쿠지">
        <ul className="policy-list">
          <li>쿠지는 결제와 동시에 뽑기 결과가 정해지므로, 결제 후에는 취소·환불할 수 없습니다(전자상거래법 제17조 제2항).</li>
          <li>결제 오류로 뽑기 결과가 나오지 않은 경우에는 결제를 취소해 드립니다.</li>
          <li>받은 상품은 「4. 상품 파손·하자·오배송」 기준에 따라 교환해 드립니다.</li>
        </ul>
      </PolicySection>

      <PolicySection id="상점" title="3. 상점 상품">
        <ul className="policy-list">
          <li><b>배송 전:</b> 마이페이지 보관함에서 바로 취소할 수 있으며, 결제 금액 전액을 환불해 드립니다.</li>
          <li><b>받은 뒤:</b> 상품을 받은 날부터 7일 안에 반품(청약철회)을 요청할 수 있습니다.</li>
          <li>단순 변심 반품의 왕복 배송비는 고객님이 부담합니다.</li>
          <li>
            다음의 경우에는 반품이 제한됩니다(전자상거래법 제17조 제2항).
            <ul>
              <li>피규어·굿즈의 상자나 블리스터(투명 포장)를 개봉하거나 제품을 사용해 상품 가치가 크게 떨어진 경우</li>
              <li>고객님의 책임으로 상품이 훼손된 경우</li>
              <li>시간이 지나 다시 판매하기 어려울 만큼 상품 가치가 떨어진 경우</li>
            </ul>
          </li>
          <li>쌀포인트로 교환한 상품은 교환 후 취소·반품할 수 없습니다. 파손·하자·오배송은 「4. 상품 파손·하자·오배송」 기준에 따라 교환해 드립니다.</li>
        </ul>
      </PolicySection>

      <PolicySection id="하자" title="4. 상품 파손·하자·오배송">
        <ul className="policy-list">
          <li>
            받은 상품이 파손·불량이거나 주문과 다른 경우, 응모·쿠지·상점 상품 모두 <b>상품을 받은 날부터 3개월 안</b>,
            또는 그 사실을 안 날부터 30일 안에 교환·환불을 요청할 수 있습니다. 이때 배송비는 천운이 부담합니다.
          </li>
          <li>
            <b>개봉 영상 촬영을 부탁드려요.</b> 송장이 붙은 택배 상자를 여는 장면부터 상품 상태를 확인하는 장면까지 끊지 않고 촬영한 영상을
            함께 보내주시면 가장 빠르게 처리할 수 있습니다. 영상이 없으면 사진이나 추가 자료를 요청드릴 수 있고, 확인에 시간이 더 걸릴 수 있습니다.
          </li>
          <li>교환할 상품이 품절된 경우에는 결제 금액(응모권·쿠지는 해당 결제 금액)을 환불해 드립니다.</li>
        </ul>
      </PolicySection>

      <PolicySection title="5. 환불 시기와 방법">
        <ul className="policy-list">
          <li>카드 결제는 결제 취소로 환불되며, 실제 카드 반영 시점은 카드사에 따라 3~7영업일이 걸릴 수 있습니다.</li>
          <li>반품 상품은 천운에 도착한 날부터 3영업일 안에 환불 절차를 진행합니다.</li>
          <li>쌀포인트와 쌀 응모권은 현금으로 바꾸거나 환불할 수 없습니다.</li>
        </ul>
      </PolicySection>

      <PolicySection title="6. 문의">
        <p>
          취소·반품·교환은 아래로 문의해 주세요. 주문 정보와 사유(파손·하자는 영상 또는 사진)를 함께 보내주시면 빠르게 도와드릴게요.
        </p>
        <ul className="policy-list">
          <li>전화 {BIZ_INFO.phone}</li>
          <li>이메일 {BIZ_INFO.email}</li>
        </ul>
      </PolicySection>
    </PolicyDoc>
  );
}
