"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getStoreProducts,
  purchaseStoreProduct,
  type StoreProductResponse,
} from "@/lib/api";
import { notifyStorageUpdated } from "@/lib/storage";
import { notifyPointsUpdated } from "@/hooks/useMyPoints";
import { payWithCard, paymentFailureMessage, PaymentWindowError } from "@/lib/payment";
import { isWished, toggleWishlist } from "@/lib/wishlist";
import { getValidSession } from "@/lib/auth";
import StoreProductCard, {
  STORE_LABEL,
  PayTypeIcon,
  formatStorePrice,
} from "@/components/StoreProductCard";
import RefundNotice from "@/components/RefundNotice";

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
    getStoreProducts()
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

  const product = products?.find((p) => p.store_product_id === productId);
  const wishId = `shop-${productId}`;
  const [isLiked, setIsLiked] = useState(() => isWished(wishId));
  const [qty, setQty] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  };

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
        p.pay_type === product.pay_type,
    )
    .slice(0, 4);

  const changeQty = (delta: number) =>
    setQty((prev) => Math.min(product.stock, Math.max(1, prev + delta)));

  const confirmPurchase = async () => {
    if (purchasing) return;
    const session = await getValidSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setPurchasing(true);
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
          showToast(paid.status === "conflict" ? "구매할 수 없습니다." : paymentFailureMessage(paid));
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
      setQty(1);
      notifyPointsUpdated();
      notifyStorageUpdated();
      showToast("🎉 구매가 완료되었습니다! 보관함에서 확인해주세요!");
    } catch (err) {
      showToast(
        err instanceof ApiError || err instanceof PaymentWindowError
          ? err.message
          : "구매 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setPurchasing(false);
      setModalOpen(false);
    }
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
            <div className="price-sub">
              {soldOut
                ? "현재 품절된 상품입니다"
                : `재고 ${product.stock}개 남음`}
            </div>

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
                onClick={() => setModalOpen(true)}
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

      <div
        className={`modal-overlay ${modalOpen ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div className="modal">
          <div className="modal-icon">{isCash ? "💳" : "🌾"}</div>
          <div className="modal-title">구매 확인</div>
          <div className="modal-sub">
            {product.product_name}
            <br />
            {qty}개 · 총{" "}
            <strong style={{ color: "var(--text)" }}>
              {formatStorePrice(product.pay_type, product.price * qty)}
            </strong>
            {isCash ? "을 카드로 결제합니다." : "가 차감됩니다."}
          </div>

          <div className="modal-notice">
            {isCash
              ? "배송 전에는 마이페이지 보관함에서 바로 취소할 수 있어요. 받은 날부터 7일 안에는 반품을 요청할 수 있지만, 상자나 포장을 개봉해 상품 가치가 떨어지면 반품이 어려워요."
              : "쌀포인트로 교환한 상품은 교환 후 취소할 수 없어요. 받은 상품이 파손·불량이면 교환해 드려요."}{" "}
            <a href="/refund#상점" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
              취소·환불 정책
            </a>
          </div>

          <div className="modal-btn-row">
            <button className="btn-cancel" onClick={() => setModalOpen(false)}>
              취소
            </button>
            <button
              className="btn-confirm"
              onClick={confirmPurchase}
              disabled={purchasing}
            >
              {purchasing ? "처리 중..." : isCash ? "결제하기" : "구매하기"}
            </button>
          </div>
        </div>
      </div>

      <div className={`toast ${toast ? "show" : ""}`}>{toast || " "}</div>
    </div>
  );
}
