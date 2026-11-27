import "server-only";
import type { Nutrients } from "@/lib/macros/portion";

/** USDA FoodData Central: https://fdc.nal.usda.gov/api-guide */
const BASE = "https://api.nal.usda.gov/fdc/v1";

export type FoodResult = {
  fdcId: number;
  name: string;
  brand: string | null;
  kind: "generic" | "branded";
  per100g: Nutrients;
  serving: { grams: number; label: string } | null;
};

// FDC nutrient ids
const ENERGY_KCAL = 1008;
const ENERGY_ATWATER_GENERAL = 2047;
const ENERGY_ATWATER_SPECIFIC = 2048;
const PROTEIN = 1003;
const FAT = 1004;
const CARBS = 1005;
const FIBER = 1079;

type FdcNutrient = { nutrientId?: number; value?: number; unitName?: string };
type FdcFood = {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: FdcNutrient[];
};

function apiKey() {
  // DEMO_KEY works for development but is heavily rate-limited.
  return process.env.USDA_API_KEY?.trim() || "DEMO_KEY";
}

/** Title-case SHOUTY branded descriptions. */
function tidy(s: string) {
  return s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s;
}

export function normalizeFood(f: FdcFood): FoodResult | null {
  const byId = new Map<number, number>();
  for (const n of f.foodNutrients ?? []) {
    if (n.nutrientId != null && typeof n.value === "number" && n.unitName?.toUpperCase() !== "KJ") {
      byId.set(n.nutrientId, n.value);
    }
  }
  const protein_g = byId.get(PROTEIN) ?? 0;
  const fat_g = byId.get(FAT) ?? 0;
  const carbs_g = byId.get(CARBS) ?? 0;
  const kcal =
    byId.get(ENERGY_KCAL) ??
    byId.get(ENERGY_ATWATER_SPECIFIC) ??
    byId.get(ENERGY_ATWATER_GENERAL) ??
    protein_g * 4 + carbs_g * 4 + fat_g * 9;
  if (!kcal && !protein_g && !fat_g && !carbs_g) return null;

  const branded = f.dataType === "Branded";
  const unit = f.servingSizeUnit?.toLowerCase();
  const serving =
    branded && f.servingSize && (unit === "g" || unit === "grm" || unit === "ml" || unit === "mlt")
      ? {
          grams: f.servingSize,
          label: f.householdServingFullText
            ? `${tidy(f.householdServingFullText).toLowerCase()} (${Math.round(f.servingSize)} ${unit?.startsWith("m") ? "ml" : "g"})`
            : `${Math.round(f.servingSize)} ${unit?.startsWith("m") ? "ml" : "g"}`,
        }
      : null;

  return {
    fdcId: f.fdcId,
    name: tidy(f.description),
    brand: branded ? tidy(f.brandName || f.brandOwner || "") || null : null,
    kind: branded ? "branded" : "generic",
    per100g: { kcal: Math.round(kcal), protein_g, carbs_g, fat_g, fiber_g: byId.get(FIBER) ?? 0 },
    serving,
  };
}

async function search(query: string, dataType: string, pageSize: number): Promise<FoodResult[]> {
  const url = new URL(`${BASE}/foods/search`);
  url.searchParams.set("api_key", apiKey());
  url.searchParams.set("query", query);
  url.searchParams.set("dataType", dataType);
  url.searchParams.set("pageSize", String(pageSize));
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (res.status === 429) throw new UsdaRateLimitError();
  if (!res.ok) throw new Error(`USDA search failed: ${res.status}`);
  const body = (await res.json()) as { foods?: FdcFood[] };
  return (body.foods ?? []).map(normalizeFood).filter((f): f is FoodResult => f !== null);
}

export class UsdaRateLimitError extends Error {
  constructor() {
    super("USDA rate limit reached");
  }
}

const PROCESSED = /\b(dehydrated|powder|dried|breaded|lunchmeat|canned|frozen|babyfood|baby food|imitation|fried|batter)\b/i;

/**
 * Re-rank generic results so plain whole foods come first: all query words present,
 * name starting with the query, no "processed" words, then shorter names.
 */
export function rankGeneric(query: string, foods: FoodResult[]): FoodResult[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const queryProcessed = PROCESSED.test(query);
  const score = (f: FoodResult) => {
    const name = f.name.toLowerCase();
    let s = 0;
    s += words.filter((w) => name.includes(w.replace(/s$/, ""))).length * 10;
    if (name.startsWith(words[0]?.replace(/s$/, "") ?? "")) s += 5;
    if (!queryProcessed && PROCESSED.test(name)) s -= 8;
    if (/\braw\b/.test(name)) s += 2;
    s -= name.length / 40;
    return s;
  };
  return foods
    .map((f, i) => ({ f, i, s: score(f) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map(({ f }) => f);
}

/** Generic foods first (more useful for whole foods), then branded products. */
export async function searchFoods(query: string): Promise<FoodResult[]> {
  const [generic, branded] = await Promise.all([
    search(query, "Foundation,SR Legacy", 15),
    search(query, "Branded", 12),
  ]);
  return [...rankGeneric(query, generic).slice(0, 12), ...branded];
}
