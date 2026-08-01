import { NextRequest, NextResponse } from "next/server";
import { ktoRestaurants, ktoSearch, type KtoLang } from "@/lib/kto";
import { busanFood, busanSafe } from "@/lib/busan";

/** Single-call page sizes that return each source's full dataset (verified live) */
const ALL_ROWS: Record<string, number> = {
  "busan-safe": 3200,
  "busan-food": 500,
  kto: 100,
};

/**
 * GET /api/restaurants
 *   ?source=kto|busan-food|busan-safe   (default kto)
 *   &lang=en|ko|zh|ja                   (kto: 4 langs / busan-food: en|ko)
 *   &q=keyword                          (kto only)
 *   &cat=A05020100                      (kto only, cat3 code)
 *   &page=1&rows=20
 *   &all=1                              (fetch the entire dataset in one page)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const source = sp.get("source") ?? "kto";
  const all = sp.get("all") === "1";
  const page = all ? 1 : Number(sp.get("page") ?? "1");
  const rows = all ? (ALL_ROWS[source] ?? 100) : Number(sp.get("rows") ?? "20");
  const lang = (sp.get("lang") ?? "en") as KtoLang;

  try {
    if (source === "busan-safe") {
      return NextResponse.json(await busanSafe({ page, rows }));
    }
    if (source === "busan-food") {
      return NextResponse.json(
        await busanFood({ lang: lang === "ko" ? "ko" : "en", page, rows }),
      );
    }
    const q = sp.get("q");
    if (q) {
      return NextResponse.json(await ktoSearch({ keyword: q, lang, page, rows }));
    }
    return NextResponse.json(
      await ktoRestaurants({ lang, cat3: sp.get("cat") ?? undefined, page, rows }),
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
