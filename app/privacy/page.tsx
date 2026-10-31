import type { Metadata } from "next";
import { BIZ_INFO, PolicyDoc, PolicySection } from "@/components/PolicyDoc";

export const metadata: Metadata = { title: "개인정보처리방침 - 천운" };

// 임시 처리방침. AI 솔루션(캐치시큐 처리방침 관리)으로 만든 정식 처리방침이 나오면 그 내용(또는 전용 URL)으로 교체할 것.
// 수집 항목은 현재 회원가입·배송지 화면 기준. 본인인증을 다시 켜면 항목 추가 필요.
export default function PrivacyPage() {
  return (
    <PolicyDoc
      title="개인정보처리방침"
      current="/privacy"
      effectiveDate="2026년 11월 1일"
      intro={<p>{BIZ_INFO.name}(이하 &quot;회사&quot;)는 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고, 관련 고충을 신속하게 처리하기 위해 다음과 같이 처리방침을 둡니다.</p>}
    >
      <PolicySection title="1. 수집하는 개인정보와 이용 목적">
        <table className="policy-table">
          <thead>
            <tr><th>구분</th><th>수집 항목</th><th>이용 목적</th></tr>
          </thead>
          <tbody>
            <tr><td>회원가입</td><td>아이디, 비밀번호, 닉네임, 이메일, 휴대폰 번호</td><td>회원 식별, 1인 1계정 확인, 공지·고객 응대</td></tr>
            <tr><td>배송</td><td>수령인 이름, 연락처, 우편번호, 주소</td><td>당첨·구매 상품 배송</td></tr>
            <tr><td>결제</td><td>결제 승인번호, 결제 금액·일시 (카드번호는 결제대행사가 처리하며 회사는 저장하지 않음)</td><td>결제, 취소·환불 처리</td></tr>
            <tr><td>서비스 이용 시 자동 수집</td><td>접속 기록, 쿠키, 기기·브라우저 정보</td><td>부정 이용 방지, 서비스 개선, 이용 통계</td></tr>
          </tbody>
        </table>
      </PolicySection>

      <PolicySection title="2. 보유 기간">
        <p>회원 탈퇴 시 지체 없이 파기합니다. 다만 관련 법령에 따라 아래 정보는 정해진 기간 동안 보관합니다.</p>
        <ul className="policy-list">
          <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
          <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
          <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
          <li>접속 기록: 3개월 (통신비밀보호법)</li>
        </ul>
      </PolicySection>

      <PolicySection title="3. 처리 위탁과 제3자 제공">
        <p>회사는 서비스 제공을 위해 아래 업무를 위탁합니다. 이 밖에 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.</p>
        <ul className="policy-list">
          <li>결제 처리: 포트원 및 전자결제대행사</li>
          <li>상품 배송: 택배사</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. 파기 방법">
        <p>전자 파일은 복구할 수 없는 방법으로 삭제하고, 종이 문서는 분쇄하거나 소각합니다.</p>
      </PolicySection>

      <PolicySection title="5. 이용자의 권리">
        <p>이용자는 언제든지 자신의 개인정보를 조회·수정·삭제하거나 처리 정지를 요청할 수 있으며, 아래 연락처로 요청하시면 지체 없이 처리합니다.</p>
      </PolicySection>

      <PolicySection title="6. 개인정보 보호책임자">
        <ul className="policy-list">
          <li>성명 {BIZ_INFO.owner} (대표)</li>
          <li>전화 {BIZ_INFO.phone}</li>
          <li>이메일 {BIZ_INFO.email}</li>
        </ul>
        <p>개인정보 침해 신고·상담은 개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회(1833-6972)에도 문의할 수 있습니다.</p>
      </PolicySection>
    </PolicyDoc>
  );
}
