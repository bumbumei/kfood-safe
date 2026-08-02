import { NextResponse } from "next/server";
import { ktoAttractions } from "@/lib/kto";

/** GET /api/attractions — Busan tourist attractions from KTO TourAPI (English) */
export async function GET() {
  try {
    return NextResponse.json({ attractions: await ktoAttractions("en") });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
