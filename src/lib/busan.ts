import type { Restaurant } from "./types";

const BASE = "https://apis.data.go.kr/6260000";

function key(): string {
  const k = process.env.KTO_KEY;
  if (!k) throw new Error("KTO_KEY environment variable is not set");
  return k;
}

/* ---------- 부산맛집정보 (FoodService) ---------- */

interface BusanFoodItem {
  UC_SEQ: number;
  MAIN_TITLE: string;
  GUGUN_NM: string;
  LAT: number;
  LNG: number;
  TITLE: string;
  ADDR1: string;
  ADDR2?: string;
  CNTCT_TEL?: string;
  USAGE_DAY_WEEK_AND_TIME?: string;
  RPRSNTV_MENU?: string;
  MAIN_IMG_NORMAL?: string;
  MAIN_IMG_THUMB?: string;
  ITEMCNTNTS?: string;
}

export async function busanFood(opts: {
  lang?: "ko" | "en";
  page?: number;
  rows?: number;
}): Promise<{ restaurants: Restaurant[]; totalCount: number }> {
  const op = opts.lang === "ko" ? "getFoodKr" : "getFoodEn";
  const qs = new URLSearchParams({
    serviceKey: key(),
    pageNo: String(opts.page ?? 1),
    numOfRows: String(opts.rows ?? 20),
    resultType: "json",
  });
  const res = await fetch(`${BASE}/FoodService/${op}?${qs}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Busan FoodService failed: HTTP ${res.status}`);
  const json = await res.json();
  const root = json?.[op] ?? {};
  const items: BusanFoodItem[] = root.item ?? [];
  return {
    restaurants: items.map((it) => ({
      id: `busan-food-${it.UC_SEQ}`,
      name: it.TITLE || it.MAIN_TITLE,
      address: [it.ADDR1, it.ADDR2].filter(Boolean).join(" "),
      tel: it.CNTCT_TEL || null,
      lat: it.LAT ?? null,
      lng: it.LNG ?? null,
      image: it.MAIN_IMG_THUMB || it.MAIN_IMG_NORMAL || null,
      menu: it.RPRSNTV_MENU || null,
      hours: it.USAGE_DAY_WEEK_AND_TIME || null,
      description: it.ITEMCNTNTS?.trim() || null,
      source: "busan-food",
    })),
    totalCount: root.totalCount ?? 0,
  };
}

/* ---------- 부산 안심식당 (BusanSafeRestaurantService) ---------- */

interface BusanSafeItem {
  biz_nm: string;
  addrs: string;
  biz_tel: string | null;
  geom: string; // "POINT(lng lat)"
}

function parseGeom(geom: string): { lat: number | null; lng: number | null } {
  const m = /POINT\(([\d.]+)\s+([\d.]+)\)/.exec(geom ?? "");
  return m ? { lng: parseFloat(m[1]), lat: parseFloat(m[2]) } : { lat: null, lng: null };
}

export async function busanSafe(opts: {
  page?: number;
  rows?: number;
}): Promise<{ restaurants: Restaurant[]; totalCount: number }> {
  const qs = new URLSearchParams({
    serviceKey: key(),
    pageNo: String(opts.page ?? 1),
    numOfRows: String(opts.rows ?? 20),
    resultType: "json",
  });
  const res = await fetch(`${BASE}/BusanSafeRestaurantService/getSafeRestaurantList?${qs}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`BusanSafeRestaurantService failed: HTTP ${res.status}`);
  const json = await res.json();
  const body = json?.response?.body ?? {};
  const items: BusanSafeItem[] = body.items?.item ?? [];
  return {
    restaurants: items.map((it, i) => {
      const { lat, lng } = parseGeom(it.geom);
      return {
        id: `busan-safe-${(Number(body.pageNo) || 1) * 1000 + i}`,
        name: it.biz_nm,
        address: it.addrs,
        tel: it.biz_tel || null,
        lat,
        lng,
        image: null,
        menu: null,
        hours: null,
        description: null,
        source: "busan-safe" as const,
      };
    }),
    totalCount: Number(body.totalCount) || 0,
  };
}
