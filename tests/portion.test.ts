import { describe, expect, it } from "vitest";
import { gramsFor, GRAMS_PER_OZ, multiplyNutrients, scaleNutrients } from "@/lib/macros/portion";
import { perUnitFrom100g, toDraftItem, type Draft } from "@/app/(app)/log/draft";

const chicken = { kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0 }; // per 100 g

describe("portions", () => {
  it("scales per-100 g nutrients to a portion", () => {
    expect(scaleNutrients(chicken, 150)).toEqual({ kcal: 248, protein_g: 46.5, carbs_g: 0, fat_g: 5.4, fiber_g: 0 });
  });
  it("converts ounces and servings to grams", () => {
    const food = { per100g: chicken, serving: { grams: 284, label: "1 breast" } };
    expect(gramsFor(food, 4, "oz")).toBeCloseTo(4 * GRAMS_PER_OZ, 6);
    expect(gramsFor(food, 2, "serving")).toBe(568);
    expect(gramsFor(food, 120, "g")).toBe(120);
  });
  it("multiplies a fixed serving", () => {
    expect(multiplyNutrients({ kcal: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5, fiber_g: 0 }, 1.5))
      .toEqual({ kcal: 180, protein_g: 36, carbs_g: 4.5, fat_g: 2.3, fiber_g: 0 });
  });
  it("draft items keep quantity edits consistent with the original portion", () => {
    // 6 oz of chicken entered as oz, then changed to 8 oz.
    const d: Draft = { key: "k", name: "Chicken", unit: "oz", quantity: 6, perUnit: perUnitFrom100g(chicken, GRAMS_PER_OZ), origin: "usda", usdaFdcId: 1 };
    expect(toDraftItem({ ...d, quantity: 8 }).protein_g).toBeCloseTo(scaleNutrients(chicken, 8 * GRAMS_PER_OZ).protein_g, 1);
  });
});
