import { NextRequest, NextResponse } from "next/server";
import { ktoDetail, type KtoLang } from "@/lib/kto";

/**
 * GET /api/restaurants/detail?id=<kto contentid>&lang=en|ko|zh|ja
 * Returns menu & hours from KTO detailIntro2 for a single restaurant.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const lang = (sp.get("lang") ?? "en") as KtoLang;
  try {
    return NextResponse.json(await ktoDetail(id, lang));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
