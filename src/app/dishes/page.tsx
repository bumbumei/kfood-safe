"use client";

import { useMemo, useState } from "react";
import { DISHES, DIET_LABELS, ALLERGEN_LABELS } from "@/data/dishes";
import type { DietKey, SafetyLevel } from "@/lib/types";

const LEVEL_STYLE: Record<SafetyLevel, string> = {
  safe: "bg-emerald-100 text-emerald-800 border-emerald-300",
  caution: "bg-amber-100 text-amber-800 border-amber-300",
  avoid: "bg-red-100 text-red-800 border-red-300",
};

const LEVEL_ICON: Record<SafetyLevel, string> = {
  safe: "🟢",
  caution: "🟡",
  avoid: "🔴",
};

const LEVEL_TEXT: Record<SafetyLevel, string> = {
  safe: "Generally safe",
  caution: "Ask first",
  avoid: "Usually not suitable",
};

export default function DishesPage() {
  const [diet, setDiet] = useState<DietKey | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = DISHES;
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.nameEn.toLowerCase().includes(needle) ||
          d.nameKo.includes(needle) ||
          d.romanized.toLowerCase().includes(needle),
      );
    }
    if (diet) {
      const order: SafetyLevel[] = ["safe", "caution", "avoid"];
      list = [...list].sort(
        (a, b) => order.indexOf(a.diet[diet]) - order.indexOf(b.diet[diet]),
      );
    }
    return list;
  }, [diet, q]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Korean Dish Guide</h1>
      <p className="mt-1 text-sm text-stone-500">
        What&apos;s actually in {DISHES.length} common Korean dishes — including the
        ingredients menus never mention.
      </p>

      <div className="no-print sticky top-14 z-10 -mx-4 mt-4 space-y-3 bg-[--background] px-4 py-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: bibimbap, 김치, tteokbokki…"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
        />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DIET_LABELS) as DietKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setDiet(diet === k ? null : k)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                diet === k
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
              }`}
            >
              {DIET_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {filtered.map((d) => {
          const level = diet ? d.diet[diet] : null;
          return (
            <div
              key={d.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">
                    {d.nameKo}{" "}
                    <span className="font-normal text-stone-500">· {d.nameEn}</span>
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">{d.description}</p>
                </div>
                {level && (
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${LEVEL_STYLE[level]}`}
                  >
                    {LEVEL_ICON[level]} {LEVEL_TEXT[level]}
                  </span>
                )}
              </div>

              {d.allergens.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.allergens.map((a) => (
                    <span
                      key={a}
                      className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
                    >
                      {ALLERGEN_LABELS[a]?.en ?? a}
                    </span>
                  ))}
                </div>
              )}

              {d.hiddenRisks.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-dashed border-stone-200 pt-3 text-xs text-stone-500">
                  {d.hiddenRisks.map((r) => (
                    <li key={r}>⚠️ {r}</li>
                  ))}
                </ul>
              )}

              {!diet && (
                <div className="mt-3 flex gap-2 text-xs">
                  {(Object.keys(DIET_LABELS) as DietKey[]).map((k) => (
                    <span key={k} title={DIET_LABELS[k]}>
                      {LEVEL_ICON[d.diet[k]]}{" "}
                      <span className="text-stone-400">{DIET_LABELS[k]}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-sm text-stone-400">
          No dishes match &ldquo;{q}&rdquo; — try the English or romanized name.
        </p>
      )}
    </div>
  );
}
