import { NextRequest, NextResponse } from "next/server";
import { ktoRestaurants, ktoSearch, type KtoLang } from "@/lib/kto";
import { busanFood, busanSafe } from "@/lib/busan";

/**
 * GET /api/restaurants
 *   ?source=kto|busan-food|busan-safe   (default kto)
 *   &lang=en|ko|zh|ja                   (kto: 4 langs / busan-food: en|ko)
 *   &q=keyword                          (kto only)
 *   &cat=A05020100                      (kto only, cat3 code)
 *   &page=1&rows=20
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const source = sp.get("source") ?? "kto";
  const page = Number(sp.get("page") ?? "1");
  const rows = Number(sp.get("rows") ?? "20");
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
