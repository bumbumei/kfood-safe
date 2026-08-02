"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ALLERGEN_LABELS, DIET_LABELS } from "@/data/dishes";
import { bestDishMatch } from "@/lib/match";
import type { DietKey, Dish, SafetyLevel } from "@/lib/types";

type Stage = "idle" | "working" | "done" | "error";

interface ScanRow {
  text: string;
  dish: Dish | null;
}

const LEVEL_ICON: Record<SafetyLevel, string> = { safe: "🟢", caution: "🟡", avoid: "🔴" };
const LEVEL_TEXT: Record<SafetyLevel, string> = {
  safe: "Generally safe",
  caution: "Ask first",
  avoid: "Usually not suitable",
};
const LEVEL_STYLE: Record<SafetyLevel, string> = {
  safe: "bg-emerald-100 text-emerald-800",
  caution: "bg-amber-100 text-amber-800",
  avoid: "bg-red-100 text-red-700",
};

const PRICE_RE = /[₩￦]\s?[\d,]+|[\d,]+\s*원|krw\s*[\d,]+|[\d,]{4,}/gi;

/** Downscale + grayscale/contrast boost — helps Tesseract a lot */
async function preprocess(source: Blob): Promise<HTMLCanvasElement> {
  const img = await createImageBitmap(source);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const im = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = Math.max(0, Math.min(255, (gray - 128) * 1.25 + 132));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(im, 0, 0);
  return canvas;
}

/** Built-in demo menu board so anyone can try OCR without a photo */
function drawSampleMenu(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 760;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 900, 760);
  ctx.fillStyle = "#111111";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText("오늘의 메뉴", 300, 90);
  ctx.font = "44px sans-serif";
  const items = [
    "삼겹살  12,000",
    "김치찌개  8,000",
    "된장찌개  8,000",
    "돌솥비빔밥  9,000",
    "해물파전  10,000",
    "콩국수  9,000",
    "물냉면  8,000",
    "공기밥  1,000",
  ];
  items.forEach((t, i) => ctx.fillText(t, 120, 180 + i * 70));
  return canvas;
}

function parseRows(raw: string): ScanRow[] {
  return raw
    .split(/\n+/)
    .map((l) => l.replace(PRICE_RE, " ").replace(/[^\p{Script=Hangul}a-zA-Z\s]/gu, " ").replace(/\s{2,}/g, " ").trim())
    .filter((l) => l.length >= 2)
    .filter((l, i, arr) => arr.indexOf(l) === i)
    .slice(0, 20)
    .map((text) => ({ text, dish: bestDishMatch(text) }));
}

export default function ScanPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [diet, setDiet] = useState<DietKey | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runOcr(canvas: HTMLCanvasElement) {
    setStage("working");
    setProgress(0);
    setRows([]);
    setPreview(canvas.toDataURL("image/jpeg", 0.85));
    try {
      setStatusMsg("Loading OCR model (first run downloads ~15 MB)…");
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(["kor", "eng"], 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setStatusMsg("Reading the menu…");
            setProgress(m.progress);
          }
        },
      });
      const { data } = await worker.recognize(canvas);
      await worker.terminate();
      const parsed = parseRows(data.text);
      setRows(parsed);
      setStage("done");
    } catch (e) {
      console.error(e);
      setStatusMsg(e instanceof Error ? e.message : "OCR failed");
      setStage("error");
    }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    runOcr(await preprocess(f));
  }

  const matched = rows.filter((r) => r.dish);
  const unknown = rows.filter((r) => !r.dish);

  return (
    <div>
      <h1 className="text-2xl font-bold">Scan a Menu</h1>
      <p className="mt-1 text-sm text-stone-500">
        Photograph a Korean menu board — we read it on your phone (nothing is uploaded)
        and flag each dish against your diet.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={stage === "working"}
          className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-8 text-center transition hover:border-emerald-500 disabled:opacity-50"
        >
          <p className="text-3xl">📷</p>
          <p className="mt-2 font-semibold">Take / upload a photo</p>
          <p className="mt-1 text-xs text-stone-400">Menu boards & printed menus work best</p>
        </button>
        <button
          onClick={() => runOcr(drawSampleMenu())}
          disabled={stage === "working"}
          className="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center transition hover:bg-stone-100 disabled:opacity-50"
        >
          <p className="text-3xl">🧪</p>
          <p className="mt-2 font-semibold">Try a sample menu</p>
          <p className="mt-1 text-xs text-stone-400">See how it works without a photo</p>
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {stage === "working" && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
          <p className="text-sm font-medium">{statusMsg}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {stage === "error" && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Could not read the image: {statusMsg}. Try a sharper, well-lit photo.
        </p>
      )}

      {preview && stage !== "working" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="scanned menu"
          className="mt-6 max-h-64 rounded-2xl border border-stone-200 object-contain"
        />
      )}

      {stage === "done" && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-stone-400">
            RECOGNIZED DISHES {diet ? `· ${DIET_LABELS[diet].toUpperCase()}` : ""} (
            {matched.length})
          </h2>
          {matched.length === 0 && (
            <p className="mt-3 rounded-xl bg-stone-50 p-4 text-sm text-stone-500">
              No known dishes recognized. Try a closer, straighter shot — or search the{" "}
              <Link href="/dishes" className="text-emerald-600 underline">
                Dish Guide
              </Link>{" "}
              manually.
            </p>
          )}
          <ul className="mt-2 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-5">
            {matched.map((r, i) => (
              <li key={i} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.text}</p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {r.dish!.nameKo} · {r.dish!.nameEn}
                    </p>
                  </div>
                  {diet ? (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${LEVEL_STYLE[r.dish!.diet[diet]]}`}
                    >
                      {LEVEL_ICON[r.dish!.diet[diet]]} {LEVEL_TEXT[r.dish!.diet[diet]]}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs">
                      {(Object.keys(DIET_LABELS) as DietKey[]).map((k) => (
                        <span key={k} title={`${DIET_LABELS[k]}: ${LEVEL_TEXT[r.dish!.diet[k]]}`}>
                          {LEVEL_ICON[r.dish!.diet[k]]}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                {r.dish!.allergens.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.dish!.allergens.map((a) => (
                      <span
                        key={a}
                        className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500"
                      >
                        {ALLERGEN_LABELS[a]?.en ?? a}
                      </span>
                    ))}
                  </div>
                )}
                {r.dish!.hiddenRisks.length > 0 && (
                  <p className="mt-1.5 text-[11px] leading-snug text-stone-400">
                    ⚠️ {r.dish!.hiddenRisks[0]}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {unknown.length > 0 && (
            <details className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-500">
              <summary className="cursor-pointer font-medium">
                Unrecognized lines ({unknown.length})
              </summary>
              <p className="mt-2 text-xs">
                {unknown.map((r) => r.text).join(" · ")}
              </p>
            </details>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-stone-400">
            On-device OCR — accuracy depends on photo quality and handwriting. Treat
            results as a first pass and confirm with staff using the{" "}
            <Link href="/cards" className="underline">
              Allergy Cards
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
