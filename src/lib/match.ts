import { DISHES } from "@/data/dishes";
import type { Dish, DietKey, SafetyLevel } from "./types";

/**
 * Matches restaurant text (name + representative menu, Korean or romanized)
 * against the dish DB, then rates a restaurant for a given dietary profile
 * based on the SAFEST dish it serves ("is there anything here I can eat?").
 */

/** Hand-tuned terms for dishes whose names are too short/ambiguous to match raw */
const TERM_OVERRIDES: Record<string, { ko?: string[]; latin?: string[] }> = {
  hoe: { ko: ["횟집", "물회", "생선회", "모둠회", "활어회", "회정식"], latin: ["sashimi", "mulhoe"] },
  kimchi: { latin: ["kimchi"] }, // "gimchi" romanization rarely used on menus
  "korean-fried-chicken": { ko: ["치킨", "통닭", "후라이드"], latin: ["chicken", "tongdak"] },
  galbi: { ko: ["갈비", "갈비살", "왕갈비"], latin: ["galbi", "kalbi"] },
  "dwaeji-gukbap": { ko: ["돼지국밥", "국밥"], latin: ["gukbap"] },
  eomuk: { ko: ["어묵", "오뎅"], latin: ["eomuk", "odeng", "fishcake", "fish cake"] },
};

interface DishTerms {
  dish: Dish;
  ko: string[];
  latin: string[];
}

function compactLatin(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

const DISH_TERMS: DishTerms[] = DISHES.map((dish) => {
  const override = TERM_OVERRIDES[dish.id];
  const ko =
    override?.ko ??
    dish.nameKo
      .split("/")
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
  const latin = override?.latin ?? [compactLatin(dish.romanized)].filter((t) => t.length >= 4);
  return { dish, ko, latin };
});

/** Find dishes plausibly served by a restaurant, from its name + menu text */
export function matchDishes(text: string): Dish[] {
  if (!text) return [];
  const compact = compactLatin(text);
  const matched: Dish[] = [];
  for (const { dish, ko, latin } of DISH_TERMS) {
    const hitKo = ko.some((t) => text.includes(t));
    const hitLatin = !hitKo && latin.some((t) => compact.includes(t));
    if (hitKo || hitLatin) matched.push(dish);
  }
  return matched;
}

const LEVEL_RANK: Record<SafetyLevel, number> = { safe: 0, caution: 1, avoid: 2 };

export interface DietRating {
  /** Best available option at this restaurant, or null when nothing matched */
  level: SafetyLevel | null;
  /** Matched dishes, safest first, capped for UI */
  dishes: Dish[];
}

/** Rate a restaurant for a diet by its safest matched dish */
export function rateForDiet(text: string, diet: DietKey): DietRating {
  const dishes = matchDishes(text).sort(
    (a, b) => LEVEL_RANK[a.diet[diet]] - LEVEL_RANK[b.diet[diet]],
  );
  return { level: dishes.length ? dishes[0].diet[diet] : null, dishes: dishes.slice(0, 3) };
}

/** Sort key: safe(0) < caution(1) < unknown(2) < avoid(3) */
export function dietSortKey(rating: DietRating): number {
  if (rating.level === null) return 2;
  return rating.level === "avoid" ? 3 : LEVEL_RANK[rating.level];
}
