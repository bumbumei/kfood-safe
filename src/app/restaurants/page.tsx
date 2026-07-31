"use client";

import { useCallback, useEffect, useState } from "react";
import KakaoMap from "@/components/KakaoMap";
import type { Restaurant } from "@/lib/types";

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

const LIST_ROWS = 12;
const MAP_ROWS = 200; // markers are cheap — show a wide net on the map

export default function RestaurantsPage() {
  const [source, setSource] = useState<Source>("busan-food");
  const [view, setView] = useState<View>("list");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (src: Source, keyword: string, pageNo: number, mode: View) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          source: src,
          page: String(pageNo),
          rows: String(mode === "map" ? MAP_ROWS : LIST_ROWS),
        });
        if (src === "kto" && keyword.trim()) params.set("q", keyword.trim());
        const res = await fetch(`/api/restaurants?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setData(json.restaurants ?? []);
        setTotal(json.totalCount ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(source, q, page, view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, page, view]);

  const totalPages = Math.max(1, Math.ceil(total / (view === "map" ? MAP_ROWS : LIST_ROWS)));

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

      {source === "kto" && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            load("kto", q, 1, view);
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
        <span>{loading ? "Loading…" : `${total.toLocaleString()} restaurants`}</span>
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
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Could not load data: {error}
        </p>
      )}

      {view === "map" && (
        <div className="mt-4">
          <KakaoMap restaurants={data} />
        </div>
      )}

      <div className={view === "map" ? "hidden" : "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
        {data.map((r) => (
          <div
            key={r.id}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
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
                <p className="mt-2 line-clamp-1 text-xs text-emerald-700">
                  🍴 {r.menu}
                </p>
              )}
              {r.tel && <p className="mt-1 text-xs text-stone-400">☎ {r.tel}</p>}
              {r.source === "busan-safe" && (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  ✓ City-certified safe restaurant
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && data.length === 0 && (
        <p className="mt-12 text-center text-sm text-stone-400">No results.</p>
      )}
    </div>
  );
}
