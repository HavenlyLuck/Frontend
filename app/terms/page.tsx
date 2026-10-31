import type { Metadata } from "next";
import Link from "next/link";
import { BIZ_INFO, PolicyDoc, PolicySection } from "@/components/PolicyDoc";

export const metadata: Metadata = { title: "이용약관 - 천운" };

// 공정거래위원회 전자상거래 표준약관을 바탕으로 응모·쿠지·쌀포인트 조항을 더한 초안.
// TODO: 정식 오픈 전 법률 자문을 받은 변호사 검토 받기.
export default function TermsPage() {
  return (
    <PolicyDoc title="이용약관" current="/terms" effectiveDate="2026년 11월 1일">
      <PolicySection title="제1조 (목적)">
        <p>
          이 약관은 {BIZ_INFO.name}(이하 &quot;회사&quot;)가 운영하는 온라인 서비스 &quot;천운&quot;(이하 &quot;서비스&quot;)에서 제공하는
          응모, 쿠지, 상점 등 전자상거래 관련 서비스를 이용할 때 회사와 회원의 권리·의무 및 책임 사항을 정하는 것을 목적으로 합니다.
        </p>
      </PolicySection>

      <PolicySection title="제2조 (정의)">
        <ol className="policy-list">
          <li>&quot;회원&quot;이란 이 약관에 동의하고 회원가입을 하여 서비스를 이용하는 자를 말합니다.</li>
          <li>&quot;응모&quot;란 상품마다 정해진 수의 응모권(1장 1,000원)을 판매하고, 응모권이 모두 판매되면 추첨으로 당첨자 1명에게 상품을 제공하는 판매 방식을 말합니다.</li>
          <li>&quot;쿠지&quot;란 정해진 가격을 결제하고 뽑기를 통해 미리 공개된 상품 구성 중 하나를 받는 판매 방식을 말합니다.</li>
          <li>&quot;쌀포인트&quot;란 응모 낙첨 등 회사가 정한 경우에 회원에게 지급되며, 쌀포인트 상점에서 상품 교환에 쓸 수 있는 포인트를 말합니다.</li>
          <li>&quot;쌀 응모권&quot;이란 이벤트·컨텐츠 보상으로 지급되는 무료 응모권을 말합니다.</li>
        </ol>
      </PolicySection>

      <PolicySection title="제3조 (약관의 게시와 변경)">
        <ol className="policy-list">
          <li>회사는 이 약관과 상호, 대표자, 주소, 연락처, 사업자등록번호 등을 서비스 화면에 게시합니다.</li>
          <li>회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행일 7일 전(회원에게 불리한 변경은 30일 전)부터 공지합니다.</li>
        </ol>
      </PolicySection>

      <PolicySection title="제4조 (회원가입과 탈퇴)">
        <ol className="policy-list">
          <li>회원가입은 이용자가 약관과 개인정보 수집·이용에 동의하고 회사가 정한 정보를 입력해 신청하면 성립합니다.</li>
          <li>회원은 1인 1계정을 원칙으로 하며, 타인의 정보를 도용하거나 여러 계정을 만들어 응모·이벤트에 참여할 수 없습니다.</li>
          <li>회원은 언제든지 탈퇴를 요청할 수 있습니다. 탈퇴 시 남은 쌀포인트와 쌀 응모권은 소멸하며, 진행 중인 응모·배송은 처리를 마친 뒤 탈퇴됩니다.</li>
        </ol>
      </PolicySection>

      <PolicySection title="제5조 (응모)">
        <ol className="policy-list">
          <li>상품별 응모권 수는 상품 판매가를 1,000원으로 나눈 수이며, 회원은 한 상품에 여러 장을 구매할 수 있습니다.</li>
          <li>응모권이 모두 판매되면 추첨을 진행합니다. 당첨 확률은 구매한 응모권 수에 비례하며, 추첨은 공개 난수(drand)를 이용해 결과를 검증할 수 있게 진행합니다.</li>
          <li>상품마다 정해진 제한 시간 안에 응모권이 모두 판매되지 않으면 응모는 자동으로 취소되고 결제 금액 전액이 환불됩니다.</li>
          <li>당첨자에게는 상품을 제공하며, 당첨자가 구매한 나머지 응모권에 대해서는 쌀포인트를 지급하지 않습니다.</li>
          <li>낙첨자에게는 구매한 응모권 1장당 1,000 쌀포인트를 지급합니다.</li>
          <li>응모권의 취소·환불 기준은 <Link href="/refund#응모">취소·환불 정책</Link>을 따릅니다.</li>
        </ol>
      </PolicySection>

      <PolicySection title="제6조 (쿠지)">
        <ol className="policy-list">
          <li>회사는 쿠지 상품별 전체 수량과 등급별 구성을 미리 공개합니다.</li>
          <li>쿠지는 결제와 동시에 결과가 정해지며, 취소·환불 기준은 <Link href="/refund#쿠지">취소·환불 정책</Link>을 따릅니다.</li>
        </ol>
      </PolicySection>

      <PolicySection title="제7조 (쌀포인트와 쌀 응모권)">
        <ol className="policy-list">
          <li>쌀포인트는 1포인트 단위로 쌀포인트 상점에서 사용할 수 있으며, 1포인트는 1원의 가치로 상품 가격에 적용됩니다.</li>
          <li>쌀포인트와 쌀 응모권은 현금으로 바꾸거나 환불할 수 없으며, 다른 회원에게 양도할 수 없습니다.</li>
          <li>쌀포인트 상점의 일부 상품은 수량이 한정될 수 있으며, 품절 상품은 순차적으로 다시 입고됩니다.</li>
          <li>쌀포인트의 유효기간은 지급 화면에 표시하며, 별도 표시가 없으면 소멸하지 않습니다.</li>
          <li>부정한 방법으로 얻은 쌀포인트와 쌀 응모권은 회수할 수 있습니다.</li>
        </ol>
      </PolicySection>

      <PolicySection title="제8조 (결제)">
        <p>
          응모권, 쿠지, 상점 상품은 신용·체크카드 등 회사가 제공하는 결제수단으로 결제할 수 있습니다.
          결제는 전자결제대행사를 통해 처리되며, 회사는 카드번호 등 결제정보를 직접 저장하지 않습니다.
        </p>
      </PolicySection>

      <PolicySection title="제9조 (배송)">
        <ol className="policy-list">
          <li>당첨·쿠지·구매 상품은 마이페이지 보관함에 담기며, 회원이 배송을 신청하면 등록한 배송지로 발송합니다.</li>
          <li>배송지를 잘못 입력해 생긴 손해는 회원이 부담합니다.</li>
        </ol>
      </PolicySection>

      <PolicySection title="제10조 (청약철회 등)">
        <p>
          청약철회(취소·반품)와 교환·환불은 「전자상거래 등에서의 소비자보호에 관한 법률」과{" "}
          <Link href="/refund">취소·환불 정책</Link>을 따릅니다.
        </p>
      </PolicySection>

      <PolicySection title="제11조 (회원의 의무)">
        <p>회원은 다음 행위를 해서는 안 됩니다.</p>
        <ul className="policy-list">
          <li>타인의 정보 도용, 여러 계정 생성 등으로 응모·이벤트에 부정하게 참여하는 행위</li>
          <li>쌀포인트, 쌀 응모권, 당첨 권리를 현금이나 다른 대가를 받고 거래하는 행위</li>
          <li>서비스 운영을 방해하거나 시스템을 부정하게 이용하는 행위</li>
        </ul>
        <p>위 행위가 확인되면 회사는 서비스 이용을 제한하고 부정하게 얻은 혜택을 회수할 수 있습니다.</p>
      </PolicySection>

      <PolicySection title="제12조 (회사의 책임 제한)">
        <p>
          회사는 천재지변, 결제대행사·통신사 장애 등 회사가 통제할 수 없는 사유로 서비스를 제공하지 못한 경우 책임을 지지 않습니다.
          다만 이로 인해 응모가 완료되지 못하면 결제 금액을 환불합니다.
        </p>
      </PolicySection>

      <PolicySection title="제13조 (분쟁 해결과 관할)">
        <ol className="policy-list">
          <li>회원의 불만과 분쟁은 아래 고객센터에서 우선 처리하며, 해결되지 않으면 소비자분쟁조정위원회 등에 조정을 신청할 수 있습니다.</li>
          <li>회사와 회원 사이의 소송은 민사소송법에 따른 관할 법원에 제기합니다.</li>
        </ol>
        <p>고객센터: 전화 {BIZ_INFO.phone} · 이메일 {BIZ_INFO.email}</p>
      </PolicySection>
    </PolicyDoc>
  );
}
