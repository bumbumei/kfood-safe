import type { Restaurant } from "./types";

const SERVICES = {
  ko: "KorService2",
  en: "EngService2",
  zh: "ChsService2",
  ja: "JpnService2",
} as const;

export type KtoLang = keyof typeof SERVICES;

/** Restaurant contentTypeId differs per language service: 39 (Korean) vs 82 (foreign) */
const FOOD_TYPE: Record<KtoLang, string> = { ko: "39", en: "82", zh: "82", ja: "82" };

interface KtoItem {
  contentid: string;
  title: string;
  addr1?: string;
  addr2?: string;
  tel?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
  cat3?: string;
}

interface KtoBody {
  items?: { item?: KtoItem[] } | "";
  totalCount?: number;
}

function baseParams(): URLSearchParams {
  const key = process.env.KTO_KEY;
  if (!key) throw new Error("KTO_KEY environment variable is not set");
  return new URLSearchParams({
    serviceKey: key,
    MobileOS: "ETC",
    MobileApp: "KFoodSafe",
    _type: "json",
  });
}

async function callKto(
  lang: KtoLang,
  endpoint: string,
  params: Record<string, string>,
): Promise<{ items: KtoItem[]; totalCount: number }> {
  const qs = baseParams();
  for (const [k, v] of Object.entries(params)) qs.set(k, v);
  const url = `https://apis.data.go.kr/B551011/${SERVICES[lang]}/${endpoint}?${qs}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`KTO API ${endpoint} failed: HTTP ${res.status}`);
  const json = await res.json();
  const body: KtoBody = json?.response?.body ?? {};
  const items = typeof body.items === "object" ? (body.items?.item ?? []) : [];
  return { items, totalCount: body.totalCount ?? 0 };
}

function toRestaurant(item: KtoItem): Restaurant {
  return {
    id: `kto-${item.contentid}`,
    name: item.title,
    address: [item.addr1, item.addr2].filter(Boolean).join(" "),
    tel: item.tel || null,
    lat: item.mapy ? parseFloat(item.mapy) : null,
    lng: item.mapx ? parseFloat(item.mapx) : null,
    image: item.firstimage || item.firstimage2 || null,
    menu: null,
    hours: null,
    description: null,
    source: "kto",
  };
}

/** Area-based restaurant list (contentTypeId=39). areaCode 6 = Busan. */
export async function ktoRestaurants(opts: {
  lang?: KtoLang;
  areaCode?: string;
  cat3?: string;
  page?: number;
  rows?: number;
}): Promise<{ restaurants: Restaurant[]; totalCount: number }> {
  const lang = opts.lang ?? "en";
  const params: Record<string, string> = {
    areaCode: opts.areaCode ?? "6",
    contentTypeId: FOOD_TYPE[lang],
    arrange: "Q", // modified-date order, image entries first
    numOfRows: String(opts.rows ?? 20),
    pageNo: String(opts.page ?? 1),
  };
  if (opts.cat3 && lang === "ko") {
    params.cat1 = "A05";
    params.cat2 = "A0502";
    params.cat3 = opts.cat3;
  }
  const { items, totalCount } = await callKto(lang, "areaBasedList2", params);
  return { restaurants: items.map(toRestaurant), totalCount };
}

export interface KtoRestaurantDetail {
  firstmenu: string;
  treatmenu: string;
  opentime: string;
  restdate: string;
}

/** Menu & hours from detailIntro2 (firstmenu / treatmenu verified live) */
export async function ktoDetail(
  contentId: string,
  lang: KtoLang = "en",
): Promise<KtoRestaurantDetail> {
  const { items } = await callKto(lang, "detailIntro2", {
    contentId,
    contentTypeId: FOOD_TYPE[lang],
    numOfRows: "1",
    pageNo: "1",
  });
  const it = (items[0] ?? {}) as unknown as Record<string, string>;
  return {
    firstmenu: it.firstmenu ?? "",
    treatmenu: it.treatmenu ?? "",
    opentime: it.opentimefood ?? "",
    restdate: it.restdatefood ?? "",
  };
}

/** Keyword search across KTO tourism restaurants */
export async function ktoSearch(opts: {
  keyword: string;
  lang?: KtoLang;
  page?: number;
  rows?: number;
}): Promise<{ restaurants: Restaurant[]; totalCount: number }> {
  const lang = opts.lang ?? "en";
  const { items, totalCount } = await callKto(lang, "searchKeyword2", {
    keyword: opts.keyword,
    contentTypeId: FOOD_TYPE[lang],
    numOfRows: String(opts.rows ?? 20),
    pageNo: String(opts.page ?? 1),
  });
  return { restaurants: items.map(toRestaurant), totalCount };
}
