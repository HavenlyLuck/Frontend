"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getStoreProduct,
  getStoreProducts,
  purchaseStoreProduct,
  type StoreFundingStatus,
  type StoreProductResponse,
} from "@/lib/api";
import { notifyStorageUpdated } from "@/lib/storage";
import { notifyPointsUpdated } from "@/hooks/useMyPoints";
import { payWithCard, paymentFailureMessage, PaymentWindowError } from "@/lib/payment";
import { isWished, toggleWishlist } from "@/lib/wishlist";
import { getValidSession, loginPath } from "@/lib/auth";
import StoreProductCard, {
  STORE_LABEL,
  PayTypeIcon,
  formatStorePrice,
} from "@/components/StoreProductCard";
import RefundNotice from "@/components/RefundNotice";
import StoreFundingCard from "@/components/StoreFundingCard";
import { ConfettiIcon, WarningIcon } from "@phosphor-icons/react";

// 상점 상품 상세 — 관련 상품 섹션 때문에 목록을 받아 id로 찾는다.
export default function ShopProductPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = Number(params.id);
  const router = useRouter();
  const [products, setProducts] = useState<StoreProductResponse[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // 품절 상품도 상세는 보여 준다 (관련 상품에서는 품절을 뺀다)
    getStoreProducts(undefined, true)
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 결제 상점 상품의 응모 전환 모금 현황 — 다른 사람이 응모권을 사면 올라가므로 주기적으로 다시 불러온다
  const [funding, setFunding] = useState<StoreFundingStatus | null>(null);
  const loadDetail = () =>
    getValidSession()
      .then((session) => getStoreProduct(productId, session?.token))
      .then((detail) => {
        setFunding(detail.funding ?? null);
        setProducts(
          (prev) =>
            prev?.map((p) =>
              p.store_product_id === productId ? { ...p, stock: detail.stock } : p,
            ) ?? prev,
        );
      })
      .catch(() => {});
  useEffect(() => {
    loadDetail();
    const timer = setInterval(loadDetail, 30_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const product = products?.find((p) => p.store_product_id === productId);
  const wishId = `shop-${productId}`;
  const [isLiked, setIsLiked] = useState(() => isWished(wishId));
  const [qty, setQty] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  // 구매 팝업 안에서 보여줄 결과 — 실패 문구, 또는 완료 카드(산 개수·금액)
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseDone, setPurchaseDone] = useState<{ quantity: number; amount: number } | null>(null);
  if (failed || (products && !product)) {
    return (
      <div className="container">
        <div className="coming-soon-box large" style={{ marginTop: 40 }}>
          <div className="title">
            {failed ? "상품을 불러오지 못했어요" : "찾을 수 없는 상품이에요"}
          </div>
          <div className="desc">
            {failed
              ? "잠시 후 다시 시도해주세요."
              : "판매가 끝났거나 삭제된 상품일 수 있어요."}
          </div>
          <Link
            href="/shop"
            className="hero-cta"
            style={{ marginTop: 20, display: "inline-block" }}
          >
            상점으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!product)
    return <div className="container" style={{ minHeight: "60vh" }} />;

  const label = STORE_LABEL[product.pay_type];
  const isCash = product.pay_type === "cash";
  const soldOut = product.stock === 0;
  const related = (products ?? [])
    .filter(
      (p) =>
        p.store_product_id !== product.store_product_id &&
        p.pay_type === product.pay_type &&
        p.stock > 0,
    )
    .slice(0, 4);

  const changeQty = (delta: number) =>
    setQty((prev) => Math.min(product.stock, Math.max(1, prev + delta)));

  const confirmPurchase = async () => {
    if (purchasing) return;
    const session = await getValidSession();
    if (!session) {
      router.replace(loginPath());
      return;
    }
    setPurchasing(true);
    setPurchaseError(null);
    try {
      // 일반 상점은 카드 결제 후 서버가 지급, 쌀포인트 상점은 쌀포인트 차감
      let res;
      if (isCash) {
        const paid = await payWithCard(session.token, {
          order_type: "store_purchase",
          target_id: product.store_product_id,
          quantity: qty,
        });
        if (paid.status !== "paid" || !paid.store_purchase) {
          setPurchaseError(paid.status === "conflict" ? "구매할 수 없습니다." : paymentFailureMessage(paid));
          return;
        }
        res = paid.store_purchase;
      } else {
        res = await purchaseStoreProduct(session.token, product.store_product_id, qty);
      }
      setProducts(
        (prev) =>
          prev?.map((p) =>
            p.store_product_id === product.store_product_id
              ? { ...p, stock: res.remaining_stock }
              : p,
          ) ?? prev,
      );
      setPurchaseDone({ quantity: res.quantity, amount: res.amount_spent });
      // 재고가 바뀌면 응모 전환 가능 여부도 바뀐다
      loadDetail();
      setQty(1);
      notifyPointsUpdated();
      notifyStorageUpdated();
    } catch (err) {
      setPurchaseError(
        err instanceof ApiError || err instanceof PaymentWindowError
          ? err.message
          : "구매 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setPurchasing(false);
    }
  };

  const openPurchaseModal = () => {
    setPurchaseError(null);
    setPurchaseDone(null);
    setModalOpen(true);
  };
  const closePurchaseModal = () => {
    if (purchasing) return;
    setModalOpen(false);
  };

  return (
    <div>
      <div className="container">
        <div className="breadcrumb">
          <span>
            <Link href="/">홈</Link>
          </span>
          <span>
            <Link href="/shop">상점</Link>
          </span>
          <span>{label} 상점</span>
        </div>

        <div className="product-layout">
          <div className="image-area">
            <div className="main-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.product_name} />
              ) : (
                <div className="image-placeholder">
                  <PayTypeIcon type={product.pay_type} size={64} />
                </div>
              )}
            </div>
          </div>

          <div className="info-panel">
            <div className="status-row">
              <span
                className="badge on-sale"
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <PayTypeIcon type={product.pay_type} size={12} /> {label}{" "}
                상점
              </span>
              {soldOut && (
                <span
                  className="badge"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  품절
                </span>
              )}
            </div>

            <div className="product-title">{product.product_name}</div>
            <div className="price">
              {formatStorePrice(product.pay_type, product.price)}
            </div>
            {/* 품절이거나 마지막 1개일 때만 알린다 */}
            {(soldOut || product.stock === 1) && (
              <div className="price-sub">
                {soldOut ? "현재 품절된 상품입니다" : "재고 1개 남음"}
              </div>
            )}

            {product.description && (
              <>
                <div className="divider" />
                <div className="description">{product.description}</div>
              </>
            )}

            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 10,
                }}
              >
                구매 수량
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    border: "1px solid var(--border-strong)",
                    borderRadius: 10,
                    padding: "8px 16px",
                  }}
                >
                  <button
                    onClick={() => changeQty(-1)}
                    disabled={soldOut}
                    style={{
                      width: 28,
                      height: 28,
                      border: "none",
                      background: "none",
                      fontSize: 18,
                      cursor: soldOut ? "default" : "pointer",
                      color: "var(--text-secondary)",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      minWidth: 20,
                      textAlign: "center",
                      color: "var(--text)",
                    }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => changeQty(1)}
                    disabled={soldOut}
                    style={{
                      width: 28,
                      height: 28,
                      border: "none",
                      background: "none",
                      fontSize: 18,
                      cursor: soldOut ? "default" : "pointer",
                      color: "var(--text-secondary)",
                    }}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                  최대 {product.stock}개까지 구매 가능
                </span>
              </div>
              <div
                style={{ marginTop: 12, fontSize: 14, color: "var(--text)" }}
              >
                총 결제 금액{" "}
                <strong>
                  {formatStorePrice(product.pay_type, product.price * qty)}
                </strong>
              </div>
            </div>

            <div className="cta-row" style={{ marginTop: 24 }}>
              <button
                className="btn-raffle"
                disabled={soldOut}
                onClick={openPurchaseModal}
              >
                {soldOut ? "품절" : "구매하기"}
              </button>
              <button
                className={`btn-wish ${isLiked ? "liked" : ""}`}
                aria-label={isLiked ? "찜 해제" : "찜하기"}
                onClick={() =>
                  setIsLiked(
                    toggleWishlist({
                      id: wishId,
                      href: `/shop/${product.store_product_id}`,
                      title: product.product_name,
                      image: product.image_url,
                      subtitle: formatStorePrice(product.pay_type, product.price),
                    }),
                  )
                }
              >
                <span className="heart">{isLiked ? "❤️" : "🤍"}</span>
              </button>
            </div>

            {isCash && funding && (
              <StoreFundingCard product={product} funding={funding} onChanged={loadDetail} />
            )}

            <RefundNotice kind={isCash ? "shop-cash" : "shop-point"} />
          </div>
        </div>

        {related.length > 0 && (
          <div className="more-section">
            <div className="section-header">
              <div className="section-title">함께 보면 좋은 상품</div>
            </div>
            <div className="product-grid-home">
              {related.map((p) => (
                <StoreProductCard key={p.store_product_id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 구매 팝업 — 확인 → (결제) → 완료 카드까지 같은 배경 위에서 이어진다. 결제 중에는 닫히지 않는다 */}
      <div
        className={`modal-overlay ${modalOpen ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closePurchaseModal();
        }}
      >
        {purchaseDone ? (
          <div className="modal success-modal" role="dialog" aria-modal="true" aria-label="구매 완료" style={{ margin: "0 16px" }}>
            <div className="modal-icon celebrate">
              <ConfettiIcon size={28} weight="fill" color="var(--gold)" />
            </div>
            <div className="modal-title">구매가 완료되었습니다!</div>
            <div className="modal-sub">
              {product.product_name} · {purchaseDone.quantity}개
              <br />
              <strong style={{ color: "var(--text)" }}>
                {formatStorePrice(product.pay_type, purchaseDone.amount)}
              </strong>
              {isCash ? " 결제 완료" : " 차감"}
              <br />
              구매한 상품은 보관함에서 확인할 수 있어요.
            </div>
            <div className="modal-btn-row">
              <button className="btn-cancel" onClick={closePurchaseModal}>
                계속 둘러보기
              </button>
              <button className="btn-confirm" onClick={() => router.push("/mypage/storage")}>
                보관함으로 가기
              </button>
            </div>
          </div>
        ) : (
          <div className="modal" role="dialog" aria-modal="true" aria-label="구매 확인" style={{ margin: "0 16px" }}>
            <div className="modal-icon">
              <span style={{ display: "flex", color: "var(--accent)" }}>
                <PayTypeIcon type={product.pay_type} size={28} />
              </span>
            </div>
            <div className="modal-title">구매 확인</div>
            <div className="modal-sub">
              {product.product_name}
              <br />
              {isCash ? "카드로 결제합니다." : "쌀포인트가 차감됩니다."}
            </div>

            <div className="ticket-count">
              <div className="ticket-label">구매 수량</div>
              <div className="ticket-selector">
                <button className="ticket-btn" onClick={() => changeQty(-1)} disabled={purchasing || qty <= 1} aria-label="수량 줄이기">
                  −
                </button>
                <div className="ticket-num">{qty}</div>
                <button className="ticket-btn" onClick={() => changeQty(1)} disabled={purchasing || qty >= product.stock} aria-label="수량 늘리기">
                  +
                </button>
              </div>
              <div className="ticket-info">
                <span>남은 수량 {product.stock.toLocaleString()}개</span>
                <span className="total">
                  총 {formatStorePrice(product.pay_type, product.price * qty)}
                </span>
              </div>
            </div>

            <div className="modal-notice">
              <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                {isCash
                  ? "배송 전에는 마이페이지 보관함에서 바로 취소할 수 있어요. 받은 날부터 7일 안에는 반품을 요청할 수 있지만, 상자나 포장을 개봉해 상품 가치가 떨어지면 반품이 어려워요."
                  : "쌀포인트로 교환한 상품은 교환 후 취소할 수 없어요. 받은 상품이 파손·불량이면 교환해 드려요."}{" "}
                <a href="/refund#상점" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                  취소·환불 정책
                </a>
              </span>
            </div>

            {purchaseError && (
              <div className="modal-notice" role="alert">
                <WarningIcon size={13} weight="fill" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span style={{ whiteSpace: "pre-line" }}>{purchaseError}</span>
              </div>
            )}

            <div className="modal-btn-row">
              <button className="btn-cancel" onClick={closePurchaseModal} disabled={purchasing}>
                취소
              </button>
              <button className="btn-confirm" onClick={confirmPurchase} disabled={purchasing}>
                <PayTypeIcon type={product.pay_type} size={15} />{" "}
                {purchasing ? "처리 중..." : isCash ? "결제하기" : "구매하기"}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
