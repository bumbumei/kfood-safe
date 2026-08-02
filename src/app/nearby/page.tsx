"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import KakaoMap from "@/components/KakaoMap";
import MenuSafety from "@/components/MenuSafety";
import { ATTRACTIONS, type Attraction } from "@/data/attractions";
import { ALLERGEN_LABELS, DIET_LABELS } from "@/data/dishes";
import { distanceMeters, formatDistance } from "@/lib/geo";
import { dietSortKey, rateForProfile } from "@/lib/match";
import type { Allergen, DietKey, Restaurant, SafetyLevel } from "@/lib/types";

const RADII = [500, 1000, 2000] as const;

const LEVEL_BADGE: Record<SafetyLevel, { style: string; label: string }> = {
  safe: { style: "bg-emerald-100 text-emerald-800", label: "🟢 Safe pick" },
  caution: { style: "bg-amber-100 text-amber-800", label: "🟡 Ask first" },
  avoid: { style: "bg-red-100 text-red-700", label: "🔴 Not suitable" },
};

const ALLERGY_KEYS: Allergen[] = [
  "peanut",
  "treenut",
  "shellfish",
  "fish",
  "egg",
  "dairy",
  "soy",
  "gluten",
  "sesame",
  "pork",
  "alcohol",
];

export default function NearbyPage() {
  const [spot, setSpot] = useState<Attraction | null>(null);
  const [radius, setRadius] = useState<number>(1000);
  const [diet, setDiet] = useState<DietKey | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [hideUnsuitable, setHideUnsuitable] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const loaded = useRef(false);

  // Load & merge both Busan datasets once (cached server-side too)
  useEffect(() => {
    if (!spot || loaded.current) return;
    loaded.current = true;
    setLoading(true);
    Promise.all([
      fetch("/api/restaurants?source=busan-food&all=1").then((r) => r.json()),
      fetch("/api/restaurants?source=busan-safe&all=1").then((r) => r.json()),
    ])
      .then(([food, safe]) => {
        const foodList: Restaurant[] = food.restaurants ?? [];
        const safeList: Restaurant[] = safe.restaurants ?? [];
        // Dedupe: drop certified-safe rows whose Korean name already appears in Busan Tasty
        const foodNames = new Set(
          foodList.flatMap((r) => {
            const m = /\(([^)]+)\)/.exec(r.name);
            return m ? [m[1].trim()] : [];
          }),
        );
        const merged = [
          ...foodList,
          ...safeList.filter((r) => !foodNames.has(r.name.trim())),
        ];
        setData(merged);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [spot]);

  const results = useMemo(() => {
    if (!spot) return [];
    return data
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        r,
        dist: distanceMeters(spot.lat, spot.lng, r.lat!, r.lng!),
        rating: rateForProfile(`${r.name} ${r.menu ?? ""}`, diet, allergens),
      }))
      .filter((x) => x.dist <= radius)
      .filter((x) => !hideUnsuitable || x.rating.level !== "avoid")
      .sort((a, b) => {
        const k = dietSortKey(a.rating) - dietSortKey(b.rating);
        return k !== 0 ? k : a.dist - b.dist;
      });
  }, [data, spot, radius, diet, allergens, hideUnsuitable]);

  const excluded = useMemo(() => {
    if (!spot || !hideUnsuitable) return 0;
    return data.filter(
      (r) =>
        r.lat != null &&
        r.lng != null &&
        distanceMeters(spot.lat, spot.lng, r.lat, r.lng) <= radius &&
        rateForProfile(`${r.name} ${r.menu ?? ""}`, diet, allergens).level === "avoid",
    ).length;
  }, [data, spot, radius, diet, allergens, hideUnsuitable]);

  const toggleAllergen = (a: Allergen) =>
    setAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  return (
    <div>
      <h1 className="text-2xl font-bold">Eat Near the Sights</h1>
      <p className="mt-1 text-sm text-stone-500">
        Pick a Busan attraction and your dietary profile — we&apos;ll find nearby
        restaurants and drop the ones that don&apos;t fit.
      </p>

      <h2 className="mt-5 text-xs font-semibold uppercase tracking-wide text-stone-400">
        Where are you going?
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {ATTRACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => setSpot(spot?.id === a.id ? null : a)}
            className={`rounded-xl border p-3 text-left transition ${
              spot?.id === a.id
                ? "border-emerald-600 bg-emerald-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <p className="text-xl">{a.emoji}</p>
            <p className="mt-1 text-sm font-semibold leading-tight">{a.nameEn}</p>
            <p className="text-xs text-stone-400">{a.nameKo}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Within:
        </span>
        {RADII.map((r) => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              radius === r
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
            }`}
          >
            {formatDistance(r)}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          My diet:
        </span>
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

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          My allergies:
        </span>
        {ALLERGY_KEYS.map((a) => (
          <button
            key={a}
            onClick={() => toggleAllergen(a)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              allergens.includes(a)
                ? "border-red-500 bg-red-500 text-white"
                : "border-stone-300 bg-white text-stone-500 hover:border-stone-400"
            }`}
          >
            {ALLERGEN_LABELS[a].en}
          </button>
        ))}
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={hideUnsuitable}
          onChange={(e) => setHideUnsuitable(e.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
        Hide restaurants that don&apos;t fit my profile
      </label>

      {!spot && (
        <p className="mt-8 rounded-2xl border-2 border-dashed border-stone-200 p-10 text-center text-sm text-stone-400">
          Pick an attraction above to see nearby safe places to eat.
        </p>
      )}

      {spot && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {loading
                ? "Loading restaurants…"
                : `${results.length} places within ${formatDistance(radius)} of ${spot.nameEn}`}
              {!loading && excluded > 0 && (
                <span className="text-stone-400"> · {excluded} hidden as unsuitable</span>
              )}
            </p>
            <div className="flex shrink-0 rounded-xl border border-stone-300 bg-white p-1 text-sm font-medium">
              {(["list", "map"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-lg px-3 py-1 capitalize transition ${
                    view === v ? "bg-stone-900 text-white" : "text-stone-500"
                  }`}
                >
                  {v === "list" ? "☰" : "🗺️"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
          )}

          {view === "map" && (
            <div className="mt-3">
              <KakaoMap restaurants={results.map((x) => x.r)} />
            </div>
          )}

          {view === "list" && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.slice(0, 60).map(({ r, dist, rating }) => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt={r.name} className="h-32 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-16 w-full items-center justify-center bg-stone-100 text-2xl">
                      🍽️
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 font-semibold" title={r.name}>
                        {r.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                        📍 {formatDistance(dist)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-stone-500">{r.address}</p>
                    {r.menu && (
                      <p className="mt-1.5 line-clamp-1 text-xs text-emerald-700">🍴 {r.menu}</p>
                    )}
                    {rating.level !== null && (
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_BADGE[rating.level].style}`}
                      >
                        {LEVEL_BADGE[rating.level].label}
                        {rating.dishes[0] ? ` · ${rating.dishes[0].nameEn.split(" (")[0]}` : ""}
                      </span>
                    )}
                    {r.source === "busan-safe" && (
                      <span className="mt-2 ml-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        ✓ Certified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <p className="mt-8 text-center text-sm text-stone-400">
              Nothing within {formatDistance(radius)} — try a larger radius or fewer filters.
            </p>
          )}
        </>
      )}

      {selected && (
        <MenuSafety restaurant={selected} diet={diet} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
