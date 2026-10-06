"use client";

import { useEffect, useState } from "react";
import { CoinsIcon, GrainsIcon, StorefrontIcon } from "@phosphor-icons/react";
import {
  getStoreProducts,
  STORE_CATEGORIES,
  type StoreCategory,
  type StoreProductResponse,
} from "@/lib/api";
import StoreProductCard from "@/components/StoreProductCard";
import AvatarShop from "@/components/AvatarShop";

const SORTS = ["최신순", "낮은 가격순", "높은 가격순", "인기순"];

type StoreTab = "운포인트" | "쌀포인트";

const TAB_POINT_TYPE: Record<StoreTab, "woon" | "ssal"> = {
  운포인트: "woon",
  쌀포인트: "ssal",
};
const TAB_ICON: Record<StoreTab, React.ReactNode> = {
  운포인트: <CoinsIcon size={15} weight="fill" />,
  쌀포인트: <GrainsIcon size={15} weight="fill" />,
};

// 상점별 세부 탭 — "전체"는 분류가 없는 상품까지 모두 보여준다
type SubTab = "all" | StoreCategory;
const SUB_TABS: Record<StoreTab, { id: SubTab; label: string }[]> = {
  운포인트: [{ id: "all", label: "전체" }, ...STORE_CATEGORIES.woon],
  쌀포인트: [{ id: "all", label: "전체" }, ...STORE_CATEGORIES.ssal],
};

export default function ShopPage() {
  const [sort, setSort] = useState("최신순");
  const [storeTab, setStoreTab] = useState<StoreTab>("운포인트");
  // 탭별로 결과를 캐싱해서, 이미 불러온 탭은 다시 눌러도 상품이 그대로 유지되고
  // storeTab이 바뀌는 렌더와 상품 데이터가 항상 같이 바뀌어 라벨이 섞이는 프레임도 생기지 않음
  const [cache, setCache] = useState<
    Partial<Record<StoreTab, StoreProductResponse[]>>
  >({});
  const [subTab, setSubTab] = useState<SubTab>("all");
  const isAvatarTab = storeTab === "쌀포인트" && subTab === "avatar";
  const tabProducts = cache[storeTab] ?? [];
  const loaded = cache[storeTab] !== undefined;
  const products =
    subTab === "all"
      ? tabProducts
      : tabProducts.filter((p) => p.category === subTab);

  useEffect(() => {
    if (cache[storeTab] !== undefined) return;
    let cancelled = false;
    getStoreProducts(TAB_POINT_TYPE[storeTab])
      .then((data) => {
        if (!cancelled) setCache((prev) => ({ ...prev, [storeTab]: data }));
      })
      .catch(() => {
        if (!cancelled) setCache((prev) => ({ ...prev, [storeTab]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [storeTab, cache]);

  return (
    <div>
      <div className="home-container">
        {/* 상점 타이틀 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div className="section-title">
            <StorefrontIcon size={18} weight="fill" color="var(--accent)" />{" "}
            상점
          </div>
          <a
            href="/guide#상점"
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              textDecoration: "none",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "4px 12px",
              background: "var(--bg-subtle)",
            }}
          >
            도움이 필요하다면?
          </a>
        </div>

        {/* 상점 탭 + 정렬 버튼 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(["운포인트", "쌀포인트"] as StoreTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStoreTab(tab);
                  setSubTab("all");
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: 10,
                  border: `1px solid ${storeTab === tab ? "var(--accent-tint-border)" : "var(--border-strong)"}`,
                  background:
                    storeTab === tab ? "var(--accent-tint)" : "var(--surface)",
                  color:
                    storeTab === tab
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: storeTab === tab ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {TAB_ICON[tab]}{" "}
                {tab === "운포인트" ? "운포인트 상점" : "쌀포인트 상점"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1px solid ${sort === s ? "var(--accent-tint-border)" : "var(--border-strong)"}`,
                  background:
                    sort === s ? "var(--accent-tint)" : "var(--surface)",
                  color: sort === s ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: sort === s ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 상점별 세부 탭 */}
        <div className="shop-subtabs" role="tablist" aria-label={`${storeTab} 상점 분류`}>
          {SUB_TABS[storeTab].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={subTab === t.id}
              className={`shop-subtab${subTab === t.id ? " active" : ""}`}
              onClick={() => setSubTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 아바타 탭은 일반 상품 목록 대신 내 캐릭터에 입어보는 화면 */}
        {isAvatarTab ? (
          <AvatarShop />
        ) : (
          <>
            {loaded && tabProducts.length > 0 && products.length === 0 && (
              <div className="coming-soon-box large">
                <div className="emoji">{TAB_ICON[storeTab]}</div>
                <div className="title">상품 준비중</div>
                <div className="desc">
                  {SUB_TABS[storeTab].find((t) => t.id === subTab)?.label} 상품을
                  준비하고 있어요. 조금만 기다려주세요!
                </div>
              </div>
            )}

            {loaded && tabProducts.length === 0 && (
              <div className="coming-soon-box large">
                <div className="emoji">{TAB_ICON[storeTab]}</div>
                <div className="title">상품 준비중</div>
                <div className="desc">
                  {storeTab} 상점 상품을 준비하고 있어요. 조금만 기다려주세요!
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div className="product-grid-home">
                {products.map((p) => (
                  <StoreProductCard key={p.store_product_id} product={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
