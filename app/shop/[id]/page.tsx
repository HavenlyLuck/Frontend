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
import { isWished, toggleWishlist } from "@/lib/wishlist";
import { getValidSession } from "@/lib/auth";
import StoreProductCard, {
  POINT_LABEL,
  PointTypeIcon,
} from "@/components/StoreProductCard";

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

  const label = POINT_LABEL[product.point_type];
  const soldOut = product.stock === 0;
  const related = (products ?? [])
    .filter(
      (p) =>
        p.store_product_id !== product.store_product_id &&
        p.point_type === product.point_type,
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
      const res = await purchaseStoreProduct(
        session.token,
        product.store_product_id,
        qty,
      );
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
        err instanceof ApiError
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
                  <PointTypeIcon type={product.point_type} size={64} />
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
                <PointTypeIcon type={product.point_type} size={12} /> {label}{" "}
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
              {product.price.toLocaleString()} {label}
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
                  {(product.price * qty).toLocaleString()} {label}
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
                      subtitle: `${product.price.toLocaleString()} ${label}`,
                    }),
                  )
                }
              >
                <span className="heart">{isLiked ? "❤️" : "🤍"}</span>
              </button>
            </div>
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
          <div className="modal-icon">🎰</div>
          <div className="modal-title">구매 확인</div>
          <div className="modal-sub">
            {product.product_name}
            <br />
            {qty}개 · 총{" "}
            <strong style={{ color: "var(--text)" }}>
              {(product.price * qty).toLocaleString()} {label}
            </strong>{" "}
            가 차감됩니다.
          </div>

          <div className="modal-notice">
            구매 확정 후에는 취소 및 환불이 불가합니다.
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
              {purchasing ? "처리 중..." : "구매하기 🎰"}
            </button>
          </div>
        </div>
      </div>

      <div className={`toast ${toast ? "show" : ""}`}>{toast || " "}</div>
    </div>
  );
}
