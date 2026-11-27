import { GRAMS_PER_OZ, multiplyNutrients, type Nutrients } from "@/lib/macros/portion";
import type { DraftItem } from "./actions";

/** A food in the meal being built. Nutrients are stored per 1 unit so quantity can change freely. */
export type Draft = {
  key: string;
  name: string;
  unit: string;
  quantity: number;
  perUnit: Nutrients;
  origin: "usda" | "saved" | "manual";
  usdaFdcId?: number;
  savedFoodId?: string;
};

export const newKey = () => Math.random().toString(36).slice(2);

export const draftNutrients = (d: Draft) => multiplyNutrients(d.perUnit, d.quantity);

export function toDraftItem(d: Draft): DraftItem {
  const n = draftNutrients(d);
  return {
    name: d.name,
    quantity: d.quantity,
    unit: d.unit,
    ...n,
    usda_fdc_id: d.usdaFdcId ?? null,
    saved_food_id: d.savedFoodId ?? null,
  };
}

/** Per-1-unit nutrients from a per-100 g basis. */
export function perUnitFrom100g(per100g: Nutrients, gramsPerUnit: number): Nutrients {
  const f = gramsPerUnit / 100;
  return {
    kcal: per100g.kcal * f,
    protein_g: per100g.protein_g * f,
    carbs_g: per100g.carbs_g * f,
    fat_g: per100g.fat_g * f,
    fiber_g: per100g.fiber_g * f,
  };
}

export const OZ = GRAMS_PER_OZ;

export function defaultMealType(hour: number): "breakfast" | "lunch" | "dinner" | "snack" {
  if (hour >= 4 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 17 && hour < 22) return "dinner";
  return "snack";
}

export const fmt = (n: number) => (Math.abs(n) >= 10 ? Math.round(n) : Math.round(n * 10) / 10);
