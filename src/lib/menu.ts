import { bestDishMatch } from "./match";
import type { Dish } from "./types";

/**
 * Turns raw menu strings from the APIs into analyzable items.
 * Sources: Busan Tasty RPRSNTV_MENU ("Mul Milmyeon ₩9,000 Bibim Milmyeon ₩9,000"),
 * KTO treatmenu ("참활복 / 까치복 / 밀복 등"), firstmenu.
 */

export interface MenuItemAnalysis {
  /** Display name as it appeared on the source (prices stripped) */
  name: string;
  /** Best ingredient-DB match, or null when we have no data for it */
  dish: Dish | null;
}

// ₩ U+20A9 and fullwidth ￦ U+FFE6 both appear in the source data
const PRICE_RE = /[₩￦]\s?[\d,]+|[\d,]+\s*원|krw\s*[\d,]+/gi;

export function parseMenuItems(raw: string): string[] {
  if (!raw) return [];
  return raw
    .replace(PRICE_RE, " ") // strip prices BEFORE splitting — "₩10,000" contains a comma
    .split(/[/,|·\n;]+/)
    .map((s) =>
      s
        .replace(/\s*등\s*$/, "") // trailing "etc."
        .replace(/\s{2,}/g, " ")
        .trim(),
    )
    .filter((s) => s.length >= 2 && !/^[\d\s.]+$/.test(s))
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .slice(0, 14);
}

export function analyzeMenu(raw: string): MenuItemAnalysis[] {
  return parseMenuItems(raw).map((name) => ({ name, dish: bestDishMatch(name) }));
}
