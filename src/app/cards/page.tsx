"use client";

import { useState } from "react";
import { ALLERGEN_LABELS } from "@/data/dishes";

type CardKey =
  | "halal"
  | "vegan"
  | "vegetarian"
  | "glutenFree"
  | keyof typeof ALLERGEN_LABELS;

interface CardDef {
  key: CardKey;
  emoji: string;
  labelEn: string;
  /** Korean sentence shown big, for restaurant staff */
  ko: string;
  /** Plain-English translation shown to the traveler */
  en: string;
}

const DIET_CARDS: CardDef[] = [
  {
    key: "halal",
    emoji: "🕌",
    labelEn: "Halal / Muslim",
    ko: "저는 무슬림입니다. 돼지고기와 술(요리술 포함)이 들어간 음식은 먹을 수 없습니다. 돼지고기 육수도 안 됩니다.",
    en: "I am Muslim. I cannot eat pork or alcohol (including cooking wine). Pork-based broth is also not okay.",
  },
  {
    key: "vegan",
    emoji: "🌱",
    labelEn: "Vegan",
    ko: "저는 비건(완전 채식)입니다. 고기, 생선, 해산물, 계란, 유제품, 젓갈, 멸치육수가 들어간 음식은 먹을 수 없습니다.",
    en: "I am vegan. I cannot eat meat, fish, seafood, eggs, dairy, jeotgal (fermented seafood), or anchovy broth.",
  },
  {
    key: "vegetarian",
    emoji: "🥬",
    labelEn: "Vegetarian",
    ko: "저는 채식주의자입니다. 고기와 생선, 해산물은 먹을 수 없습니다. 계란과 유제품은 괜찮습니다. 멸치육수나 고기육수도 안 됩니다.",
    en: "I am vegetarian. No meat, fish, or seafood. Eggs and dairy are fine. Anchovy or meat broth is also not okay.",
  },
  {
    key: "glutenFree",
    emoji: "🌾",
    labelEn: "Gluten-free",
    ko: "저는 밀가루(글루텐) 알레르기가 있습니다. 밀가루, 간장, 고추장, 된장이 들어간 음식은 먹으면 위험합니다.",
    en: "I have a gluten allergy. Food with wheat flour, soy sauce, gochujang, or doenjang is dangerous for me.",
  },
];

const ALLERGY_CARDS: CardDef[] = (
  ["peanut", "treenut", "shellfish", "fish", "egg", "dairy", "soy", "sesame"] as const
).map((k) => ({
  key: k,
  emoji: { peanut: "🥜", treenut: "🌰", shellfish: "🦐", fish: "🐟", egg: "🥚", dairy: "🥛", soy: "🫘", sesame: "✨" }[k],
  labelEn: ALLERGEN_LABELS[k].en,
  ko: `저는 ${ALLERGEN_LABELS[k].ko} 알레르기가 있습니다. 조금만 먹어도 위험할 수 있으니, 이 재료가 들어갔는지 꼭 확인해 주세요.`,
  en: `I have a ${ALLERGEN_LABELS[k].en.toLowerCase()} allergy. Even a small amount can be dangerous — please check if this ingredient is used.`,
}));

export default function CardsPage() {
  const [selected, setSelected] = useState<CardKey[]>([]);

  const toggle = (k: CardKey) =>
    setSelected((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );

  const activeCards = [...DIET_CARDS, ...ALLERGY_CARDS].filter((c) =>
    selected.includes(c.key),
  );

  return (
    <div>
      <div className="no-print">
        <h1 className="text-2xl font-bold">Allergy Communication Cards</h1>
        <p className="mt-1 text-sm text-stone-500">
          Select what applies to you, then show the Korean card to restaurant staff.
          Tip: use your browser&apos;s print function to save as PDF for offline use.
        </p>

        <h2 className="mt-6 text-sm font-semibold text-stone-400">DIETARY PROFILE</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIET_CARDS.map((c) => (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                selected.includes(c.key)
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
              }`}
            >
              {c.emoji} {c.labelEn}
            </button>
          ))}
        </div>

        <h2 className="mt-5 text-sm font-semibold text-stone-400">ALLERGIES</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {ALLERGY_CARDS.map((c) => (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                selected.includes(c.key)
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
              }`}
            >
              {c.emoji} {c.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {activeCards.length === 0 && (
          <div className="no-print rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center text-sm text-stone-400">
            Select your dietary needs above — your cards will appear here.
          </div>
        )}
        {activeCards.map((c) => (
          <div
            key={c.key}
            className="overflow-hidden rounded-2xl border-2 border-stone-900 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between bg-stone-900 px-5 py-2.5 text-white">
              <span className="text-sm font-bold tracking-wide">
                {c.emoji} {c.labelEn}
              </span>
              <span className="text-xs text-stone-400">K-Food Safe</span>
            </div>
            <div className="px-6 py-7">
              <p className="text-2xl font-bold leading-relaxed tracking-tight">
                {c.ko}
              </p>
              <p className="mt-4 border-t border-stone-200 pt-3 text-sm text-stone-500">
                {c.en}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activeCards.length > 0 && (
        <button
          onClick={() => window.print()}
          className="no-print mt-6 w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-700"
        >
          🖨️ Print / Save as PDF
        </button>
      )}
    </div>
  );
}
