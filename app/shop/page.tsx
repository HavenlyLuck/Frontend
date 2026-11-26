"use client";

import { useEffect, useState } from "react";
import { CreditCardIcon, GrainsIcon, StorefrontIcon } from "@phosphor-icons/react";
import {
  getStoreProducts,
  STORE_CATEGORIES,
  type StoreCategory,
  type StorePayType,
  type StoreProductResponse,
} from "@/lib/api";
import { parseServerTime } from "@/lib/raffle";
import StoreProductCard from "@/components/StoreProductCard";
import AvatarShop from "@/components/AvatarShop";

// 인기순은 판매량·찜 수 같은 기준 값을 서버가 아직 안 줘서 뺐다 — TODO(백엔드): 상점 상품에 인기 기준 값이 생기면 다시 넣는다
const SORTS = ["최신순", "낮은 가격순", "높은 가격순"];

// 일반 상점: 카드 결제 상품, 쌀포인트 상점: 쌀포인트 상품
type StoreTab = "일반" | "쌀포인트";

const TAB_PAY_TYPE: Record<StoreTab, StorePayType> = {
  일반: "cash",
  쌀포인트: "ssal",
};
const TAB_ICON: Record<StoreTab, React.ReactNode> = {
  일반: <CreditCardIcon size={15} weight="fill" />,
  쌀포인트: <GrainsIcon size={15} weight="fill" />,
};

// 상점별 세부 탭 — 일반 상점의 "전체"는 분류가 없는 상품까지 모두 보여준다.
// 쌀포인트 상점은 "전체"를 두지 않는다 (상품 대부분이 아바타 아이템이라 "전체"가 비어 보였음).
// 피규어·굿즈 / 쿠폰 / 아바타 순서, 피규어·굿즈가 기본 탭
type SubTab = "all" | StoreCategory;
const SUB_TABS: Record<StoreTab, { id: SubTab; label: string }[]> = {
  일반: [{ id: "all", label: "전체" }, ...STORE_CATEGORIES.cash],
  쌀포인트: STORE_CATEGORIES.ssal,
};
const DEFAULT_SUB: Record<StoreTab, SubTab> = { 일반: "all", 쌀포인트: "goods" };

// 주소에 지금 탭을 남긴다 (/shop?tab=ssal&sub=goods) — 새로고침·뒤로 가기·링크 공유해도 같은 탭이 열린다.
// 아바타 탭 안의 분류(cat)·아이템(item)은 AvatarShop이 따로 관리하므로 아바타 탭일 때만 남겨 둔다
function writeShopUrl(tab: StoreTab, sub: SubTab) {
  const qs = new URLSearchParams(window.location.search);
  if (tab === "쌀포인트") qs.set("tab", "ssal");
  else qs.delete("tab");
  if (sub !== DEFAULT_SUB[tab]) qs.set("sub", sub);
  else qs.delete("sub");
  if (!(tab === "쌀포인트" && sub === "avatar")) {
    qs.delete("cat");
    qs.delete("item");
  }
  const s = qs.toString();
  window.history.replaceState(window.history.state, "", s ? `/shop?${s}` : "/shop");
}

export default function ShopPage() {
  const [sort, setSort] = useState("최신순");
  const [storeTab, setStoreTab] = useState<StoreTab>("일반");
  // /shop?tab=ssal(&sub=goods) 로 들어오면 그 탭을 연다 (쌀포인트 상품 구매 후 "계속 둘러보기", 캐릭터 꾸미기의 잠긴 아이템 등)
  const [urlRead, setUrlRead] = useState(false);
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const tab: StoreTab = qs.get("tab") === "ssal" ? "쌀포인트" : "일반";
    // 아바타 분류·아이템(cat·item)만 있는 주소(캐릭터 꾸미기의 "상점 둘러보기" 등)는 아바타 탭으로 연다
    const sub = qs.get("sub") ?? (tab === "쌀포인트" && (qs.has("cat") || qs.has("item")) ? "avatar" : null);
    setStoreTab(tab);
    setSubTab(SUB_TABS[tab].some((t) => t.id === sub) ? (sub as SubTab) : DEFAULT_SUB[tab]);
    setUrlRead(true);
  }, []);
  // 탭별로 결과를 캐싱해서, 이미 불러온 탭은 다시 눌러도 상품이 그대로 유지되고
  // storeTab이 바뀌는 렌더와 상품 데이터가 항상 같이 바뀌어 라벨이 섞이는 프레임도 생기지 않음
  const [cache, setCache] = useState<
    Partial<Record<StoreTab, StoreProductResponse[]>>
  >({});
  const [subTab, setSubTab] = useState<SubTab>("all");
  useEffect(() => {
    if (urlRead) writeShopUrl(storeTab, subTab);
  }, [urlRead, storeTab, subTab]);
  const isAvatarTab = storeTab === "쌀포인트" && subTab === "avatar";
  const tabProducts = cache[storeTab] ?? [];
  const loaded = cache[storeTab] !== undefined;
  const filtered =
    subTab === "all"
      ? tabProducts
      : tabProducts.filter((p) => p.category === subTab);
  // 정렬 — 같은 값이면 최신 상품이 앞에 오게 한다
  const newest = (a: StoreProductResponse, b: StoreProductResponse) =>
    parseServerTime(b.created_at) - parseServerTime(a.created_at) || b.store_product_id - a.store_product_id;
  const products = [...filtered].sort((a, b) =>
    sort === "낮은 가격순" ? a.price - b.price || newest(a, b)
    : sort === "높은 가격순" ? b.price - a.price || newest(a, b)
    : newest(a, b),
  );

  useEffect(() => {
    if (cache[storeTab] !== undefined) return;
    let cancelled = false;
    getStoreProducts(TAB_PAY_TYPE[storeTab])
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
              padding: "7px 12px",
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
            {(["일반", "쌀포인트"] as StoreTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStoreTab(tab);
                  setSubTab(DEFAULT_SUB[tab]);
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
                {tab}{" "}상점
              </button>
            ))}
          </div>

          <div className="chip-scroll" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
        {!urlRead ? null : isAvatarTab ? (
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
