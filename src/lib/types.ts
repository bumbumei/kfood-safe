export type SafetyLevel = "safe" | "caution" | "avoid";

export type DietKey = "vegan" | "vegetarian" | "halal" | "glutenFree";

export type Allergen =
  | "gluten"
  | "soy"
  | "peanut"
  | "treenut"
  | "shellfish"
  | "fish"
  | "egg"
  | "dairy"
  | "sesame"
  | "pork"
  | "alcohol";

export interface Dish {
  id: string;
  nameKo: string;
  nameEn: string;
  romanized: string;
  description: string;
  ingredients: string[];
  allergens: Allergen[];
  /** Risks a foreign visitor would not guess from the dish name */
  hiddenRisks: string[];
  diet: Record<DietKey, SafetyLevel>;
}

/** Normalized restaurant shape shared by every data source */
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  tel: string | null;
  lat: number | null;
  lng: number | null;
  image: string | null;
  menu: string | null;
  hours: string | null;
  description: string | null;
  source: "kto" | "busan-food" | "busan-safe";
}
