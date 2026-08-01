"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import KakaoMap from "@/components/KakaoMap";
import MenuSafety from "@/components/MenuSafety";
import { DIET_LABELS, DISHES } from "@/data/dishes";
import { dietSortKey, rateForDiet, textMatchesDish } from "@/lib/match";
import type { DietKey, Restaurant, SafetyLevel } from "@/lib/types";

type Source = "kto" | "busan-food" | "busan-safe";
type View = "list" | "map";

const SOURCES: { key: Source; label: string; desc: string }[] = [
  {
    key: "kto",
    label: "KTO Tourism",
    desc: "Korea Tourism Organization curated restaurants (English)",
  },
  {
    key: "busan-food",
    label: "Busan Tasty",
    desc: "Busan city's official restaurant guide with menus & photos",
  },
  {
    key: "busan-safe",
    label: "Certified Safe",
    desc: "3,101 hygiene-certified restaurants from Busan city data",
  },
];

const PAGE_SIZE = 12;

const LEVEL_BADGE: Record<SafetyLevel, { style: string; label: string }> = {
  safe: { style: "bg-emerald-100 text-emerald-800", label: "🟢 Safe pick" },
  caution: { style: "bg-amber-100 text-amber-800", label: "🟡 Ask first" },
  avoid: { style: "bg-red-100 text-red-700", label: "🔴 Not suitable" },
};

export default function RestaurantsPage() {
  const [source, setSource] = useState<Source>("busan-food");
  const [view, setView] = useState<View>("list");
  const [diet, setDiet] = useState<DietKey | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [dishFilter, setDishFilter] = useState<string | null>(null);
  // Full-dataset cache per source so toggling diet/map doesn't refetch
  const allCache = useRef<Partial<Record<Source, Restaurant[]>>>({});

  // Deep link from the Dish Guide: /restaurants?dish=<id>
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("dish");
    if (p && DISHES.some((d) => d.id === p)) setDishFilter(p);
  }, []);

  const filterDish = dishFilter ? DISHES.find((d) => d.id === dishFilter) : null;

  // Map view, diet matching, and dish filtering all need the whole dataset
  const allMode = view === "map" || diet !== null || dishFilter !== null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (allMode) {
          const cached = allCache.current[source];
          if (cached) {
            setData(cached);
            setTotal(cached.length);
            return;
          }
          const res = await fetch(`/api/restaurants?source=${source}&all=1`);
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
          if (cancelled) return;
          const restaurants: Restaurant[] = json.restaurants ?? [];
          allCache.current[source] = restaurants;
          setData(restaurants);
          setTotal(restaurants.length);
        } else {
          const params = new URLSearchParams({
            source,
            page: String(page),
            rows: String(PAGE_SIZE),
          });
          if (source === "kto" && q.trim()) params.set("q", q.trim());
          const res = await fetch(`/api/restaurants?${params}`);
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
          if (cancelled) return;
          setData(json.restaurants ?? []);
          setTotal(json.totalCount ?? 0);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, page, allMode]);

  /** Dish-filtered, then rated + sorted rows (diet mode); plain rows otherwise */
  const rated = useMemo(() => {
    const base = dishFilter
      ? data.filter((r) => textMatchesDish(`${r.name} ${r.menu ?? ""}`, dishFilter))
      : data;
    if (!diet) return base.map((r) => ({ r, rating: null }));
    return base
      .map((r) => ({ r, rating: rateForDiet(`${r.name} ${r.menu ?? ""}`, diet) }))
      .sort((a, b) => dietSortKey(a.rating!) - dietSortKey(b.rating!));
  }, [data, diet, dishFilter]);

  const matchedCount = useMemo(
    () => (diet ? rated.filter((x) => x.rating?.level !== null).length : 0),
    [rated, diet],
  );

  const totalPages = allMode
    ? Math.max(1, Math.ceil(rated.length / PAGE_SIZE))
    : Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visible = allMode ? rated.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : rated;
  const mapData = useMemo(() => rated.map((x) => x.r), [rated]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Busan Restaurants</h1>
          <p className="mt-1 text-sm text-stone-500">
            Live data from Korea Tourism Organization and Busan Metropolitan City open
            APIs.
          </p>
        </div>
        <div className="flex shrink-0 rounded-xl border border-stone-300 bg-white p-1 text-sm font-medium">
          {(["list", "map"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setPage(1);
              }}
              className={`rounded-lg px-4 py-1.5 capitalize transition ${
                view === v ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              {v === "list" ? "☰ List" : "🗺️ Map"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setSource(s.key);
              setPage(1);
            }}
            className={`rounded-xl border p-3 text-left transition ${
              source === s.key
                ? "border-emerald-600 bg-emerald-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <p className="text-sm font-semibold">{s.label}</p>
            <p className="mt-0.5 text-xs text-stone-500">{s.desc}</p>
          </button>
        ))}
      </div>

      {filterDish && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm">
          <span>
            🍽️ Showing places serving{" "}
            <strong>
              {filterDish.nameKo} · {filterDish.nameEn.split(" (")[0]}
            </strong>
          </span>
          <button
            onClick={() => {
              setDishFilter(null);
              setPage(1);
              window.history.replaceState(null, "", "/restaurants");
            }}
            className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-xs text-stone-500 shadow-sm hover:text-stone-800"
          >
            ✕ Clear
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          My diet:
        </span>
        {(Object.keys(DIET_LABELS) as DietKey[]).map((k) => (
          <button
            key={k}
            onClick={() => {
              setDiet(diet === k ? null : k);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              diet === k
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
            }`}
          >
            {DIET_LABELS[k]}
          </button>
        ))}
        {diet && (
          <span className="text-xs text-stone-500">
            — sorted by safest menu match ({matchedCount.toLocaleString()} matched)
          </span>
        )}
      </div>

      {source === "kto" && !allMode && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setData([]);
            // re-trigger paginated effect via state churn
            setTotal(0);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search KTO data (e.g. seafood, temple food)…"
            className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
          <button className="rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-700">
            Search
          </button>
        </form>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
        <span>
          {loading
            ? "Loading…"
            : `${(allMode ? rated.length : total).toLocaleString()} restaurants${
                view === "map" ? " on map" : ""
              }`}
        </span>
        {view === "list" && (
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-stone-300 px-3 py-1 disabled:opacity-40"
            >
              ←
            </button>
            <span>
              {page} / {totalPages.toLocaleString()}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-stone-300 px-3 py-1 disabled:opacity-40"
            >
              →
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Could not load data: {error}
        </p>
      )}

      {view === "map" && (
        <div className="mt-4">
          <KakaoMap restaurants={mapData} />
          {diet && (
            <p className="mt-2 text-xs text-stone-400">
              Tip: switch to List view to see per-restaurant {DIET_LABELS[diet]} ratings.
            </p>
          )}
        </div>
      )}

      <div className={view === "map" ? "hidden" : "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
        {visible.map(({ r, rating }) => (
          <div
            key={r.id}
            onClick={() => setSelected(r)}
            className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.image}
                alt={r.name}
                className="h-36 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-36 w-full items-center justify-center bg-stone-100 text-3xl">
                🍽️
              </div>
            )}
            <div className="p-4">
              <h2 className="line-clamp-1 font-semibold" title={r.name}>
                {r.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs text-stone-500">{r.address}</p>
              {r.menu && (
                <p className="mt-2 line-clamp-1 text-xs text-emerald-700">🍴 {r.menu}</p>
              )}
              {r.tel && <p className="mt-1 text-xs text-stone-400">☎ {r.tel}</p>}

              {rating && rating.level !== null && (
                <div className="mt-2 space-y-1">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_BADGE[rating.level].style}`}
                  >
                    {LEVEL_BADGE[rating.level].label}
                    {rating.dishes[0] ? ` · ${rating.dishes[0].nameEn.split(" (")[0]}` : ""}
                  </span>
                  {rating.dishes.length > 1 && (
                    <p className="text-[11px] text-stone-400">
                      Also serves: {rating.dishes.slice(1).map((d) => d.nameKo).join(", ")}
                    </p>
                  )}
                </div>
              )}

              {r.source === "busan-safe" && (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  ✓ City-certified safe restaurant
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && rated.length === 0 && (
        <p className="mt-12 text-center text-sm text-stone-400">No results.</p>
      )}

      {selected && (
        <MenuSafety restaurant={selected} diet={diet} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
