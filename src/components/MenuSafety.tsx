"use client";

import { useEffect, useState } from "react";
import { ALLERGEN_LABELS, DIET_LABELS } from "@/data/dishes";
import { analyzeMenu, type MenuItemAnalysis } from "@/lib/menu";
import type { DietKey, Restaurant, SafetyLevel } from "@/lib/types";

const LEVEL_ICON: Record<SafetyLevel, string> = { safe: "🟢", caution: "🟡", avoid: "🔴" };
const LEVEL_TEXT: Record<SafetyLevel, string> = {
  safe: "Generally safe",
  caution: "Ask first",
  avoid: "Usually not suitable",
};
const LEVEL_STYLE: Record<SafetyLevel, string> = {
  safe: "bg-emerald-100 text-emerald-800",
  caution: "bg-amber-100 text-amber-800",
  avoid: "bg-red-100 text-red-700",
};

interface KtoDetailPayload {
  firstmenu?: string;
  treatmenu?: string;
  opentime?: string;
  restdate?: string;
  error?: string;
}

export default function MenuSafety({
  restaurant,
  diet,
  onClose,
}: {
  restaurant: Restaurant;
  diet: DietKey | null;
  onClose: () => void;
}) {
  const isKto = restaurant.source === "kto";
  const [ktoMenu, setKtoMenu] = useState<KtoDetailPayload | null>(null);
  const [loading, setLoading] = useState(isKto);

  useEffect(() => {
    if (!isKto) return;
    const contentId = restaurant.id.replace(/^kto-/, "");
    fetch(`/api/restaurants/detail?id=${contentId}&lang=en`)
      .then((r) => r.json())
      .then(setKtoMenu)
      .catch(() => setKtoMenu(null))
      .finally(() => setLoading(false));
  }, [isKto, restaurant.id]);

  const menuText = [restaurant.menu, ktoMenu?.firstmenu, ktoMenu?.treatmenu]
    .filter(Boolean)
    .join(" / ");
  const items: MenuItemAnalysis[] = analyzeMenu(menuText);
  // When there's no menu data at all, fall back to reading the restaurant name
  const nameItems: MenuItemAnalysis[] =
    items.length === 0 ? analyzeMenu(restaurant.name).filter((i) => i.dish) : [];
  const hours = ktoMenu?.opentime || restaurant.hours;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <h2 className="font-bold leading-tight">{restaurant.name}</h2>
            <p className="mt-0.5 text-xs text-stone-500">{restaurant.address}</p>
            {hours && <p className="mt-0.5 text-xs text-stone-400">🕐 {hours}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-100 px-2.5 py-1 text-sm text-stone-500 hover:bg-stone-200"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-stone-400">
            MENU SAFETY {diet ? `· ${DIET_LABELS[diet].toUpperCase()}` : ""}
          </h3>

          {loading && <p className="mt-3 text-sm text-stone-400">Loading menu…</p>}

          {!loading && items.length === 0 && nameItems.length === 0 && (
            <p className="mt-3 rounded-xl bg-stone-50 p-4 text-sm text-stone-500">
              No menu data is published for this restaurant. Check the menu board on
              site — the dish guide (Dish Guide tab) covers 53 common Korean dishes,
              and photo OCR analysis is coming soon.
            </p>
          )}

          {!loading && items.length === 0 && nameItems.length > 0 && (
            <p className="mt-3 text-xs text-stone-400">
              No published menu — inferred from the restaurant name:
            </p>
          )}

          <ul className="mt-2 divide-y divide-stone-100">
            {[...items, ...nameItems].map((it, idx) => (
              <li key={`${it.name}-${idx}`} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{it.name}</p>
                    {it.dish ? (
                      <p className="mt-0.5 text-xs text-stone-500">
                        {it.dish.nameKo} · {it.dish.nameEn}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-stone-400">
                        No ingredient data — ask staff or check the Dish Guide
                      </p>
                    )}
                  </div>
                  {it.dish &&
                    (diet ? (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${LEVEL_STYLE[it.dish.diet[diet]]}`}
                      >
                        {LEVEL_ICON[it.dish.diet[diet]]} {LEVEL_TEXT[it.dish.diet[diet]]}
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs">
                        {(Object.keys(DIET_LABELS) as DietKey[]).map((k) => (
                          <span key={k} title={`${DIET_LABELS[k]}: ${LEVEL_TEXT[it.dish!.diet[k]]}`}>
                            {LEVEL_ICON[it.dish!.diet[k]]}
                          </span>
                        ))}
                      </span>
                    ))}
                </div>

                {it.dish && it.dish.allergens.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {it.dish.allergens.map((a) => (
                      <span
                        key={a}
                        className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500"
                      >
                        {ALLERGEN_LABELS[a]?.en ?? a}
                      </span>
                    ))}
                  </div>
                )}

                {it.dish && it.dish.hiddenRisks.length > 0 && (
                  <p className="mt-1.5 text-[11px] leading-snug text-stone-400">
                    ⚠️ {it.dish.hiddenRisks[0]}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {!diet && items.some((i) => i.dish) && (
            <p className="mt-2 text-[11px] text-stone-400">
              Dots: {(Object.keys(DIET_LABELS) as DietKey[]).map((k) => DIET_LABELS[k]).join(" · ")}
            </p>
          )}

          <p className="mt-4 border-t border-dashed border-stone-200 pt-3 text-[11px] leading-relaxed text-stone-400">
            Based on the representative menu published by Korea Tourism Organization /
            Busan Metropolitan City — not the full menu board. Recipes vary by kitchen;
            always confirm with staff (the Allergy Cards tab can help).
          </p>
        </div>
      </div>
    </div>
  );
}
