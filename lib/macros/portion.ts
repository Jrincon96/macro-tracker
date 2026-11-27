import type { Macros } from "./index";

export type Nutrients = Macros & { fiber_g: number };

export const GRAMS_PER_OZ = 28.349523125;

export type PortionUnit = "g" | "oz" | "serving";

/** A food's nutrition per 100 g, plus an optional labelled serving (branded foods). */
export type FoodBasis = {
  per100g: Nutrients;
  serving?: { grams: number; label: string } | null;
};

export function gramsFor(food: FoodBasis, quantity: number, unit: PortionUnit): number {
  if (unit === "g") return quantity;
  if (unit === "oz") return quantity * GRAMS_PER_OZ;
  return quantity * (food.serving?.grams ?? 100);
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Nutrients for a portion of a per-100 g food. */
export function scaleNutrients(per100g: Nutrients, grams: number): Nutrients {
  const f = grams / 100;
  return {
    kcal: Math.round(per100g.kcal * f),
    protein_g: r1(per100g.protein_g * f),
    carbs_g: r1(per100g.carbs_g * f),
    fat_g: r1(per100g.fat_g * f),
    fiber_g: r1(per100g.fiber_g * f),
  };
}

/** Nutrients for `quantity` of a fixed serving (saved foods). */
export function multiplyNutrients(n: Nutrients, quantity: number): Nutrients {
  return {
    kcal: Math.round(n.kcal * quantity),
    protein_g: r1(n.protein_g * quantity),
    carbs_g: r1(n.carbs_g * quantity),
    fat_g: r1(n.fat_g * quantity),
    fiber_g: r1(n.fiber_g * quantity),
  };
}
