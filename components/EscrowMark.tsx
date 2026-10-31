"use client";

import { useRef } from "react";

// IBK기업은행 안심이체(에스크로) 구매안전서비스 인증마크.
// 은행이 준 HTML 소스(form POST로 팝업 열기)를 그대로 옮긴 것 — 가맹점 키는 은행 발급값.
const AUTHMARK_KEY = "c179413b9938203cb881fd94c4691ae3";
const AUTHMARK_URL = "https://kiup.ibk.co.kr/uib/jsp/guest/esc/esc25/getAuthMark.jsp";
const AUTHMARK_IMG = "https://kiup.ibk.co.kr/IBK/uib/ecb/img/KO/esc/sub/imgIbkMark.gif";

export default function EscrowMark() {
  const formRef = useRef<HTMLFormElement>(null);

  function openAuthMark() {
    const form = formRef.current;
    if (!form) return;
    window.open("", "AUTHMARK_POPUP", "height=900, width=630, status=yes, toolbar=no, menubar=no, location=no");
    form.submit();
  }

  return (
    <div className="footer-escrow">
      <form ref={formRef} method="POST" action={AUTHMARK_URL} target="AUTHMARK_POPUP" style={{ display: "none" }}>
        <input type="hidden" name="authmarkinfo" value={AUTHMARK_KEY} readOnly />
      </form>
      <button type="button" onClick={openAuthMark} className="footer-escrow-mark" aria-label="IBK기업은행 구매안전서비스 가입 사실 확인">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AUTHMARK_IMG} alt="IBK 안심이체 서비스 인증마크" width={70} height={70} />
      </button>
      <p>
        고객님은 안전거래를 위해 현금 등으로 결제 시 저희 쇼핑몰에서 가입한 IBK기업은행의 구매안전서비스(에스크로)를
        이용하실 수 있습니다. 마크를 누르면 가입 사실을 확인할 수 있습니다.
      </p>
    </div>
  );
}
