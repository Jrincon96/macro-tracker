import { describe, expect, it } from "vitest";
import { normalizeFood } from "@/lib/usda";

const nutrient = (nutrientId: number, value: number, unitName = "G") => ({ nutrientId, value, unitName });

describe("normalizeFood", () => {
  it("maps a generic SR Legacy food (per 100 g, no serving)", () => {
    const f = normalizeFood({
      fdcId: 171477, description: "Chicken, broilers or fryers, breast, meat only, cooked, roasted", dataType: "SR Legacy",
      foodNutrients: [nutrient(1008, 165, "KCAL"), nutrient(1003, 31.02), nutrient(1004, 3.57), nutrient(1005, 0), nutrient(1079, 0)],
    });
    expect(f).toMatchObject({ kind: "generic", brand: null, serving: null, per100g: { kcal: 165, protein_g: 31.02, fat_g: 3.57 } });
  });

  it("maps a branded food with a gram serving and tidies SHOUTY names", () => {
    const f = normalizeFood({
      fdcId: 1, description: "GREEK YOGURT, PLAIN", dataType: "Branded", brandOwner: "ACME DAIRY",
      servingSize: 170, servingSizeUnit: "g", householdServingFullText: "1 CONTAINER",
      foodNutrients: [nutrient(1008, 59, "KCAL"), nutrient(1003, 10.3), nutrient(1004, 0.4), nutrient(1005, 3.6)],
    });
    expect(f?.name).toBe("Greek Yogurt, Plain");
    expect(f?.brand).toBe("Acme Dairy");
    expect(f?.serving).toEqual({ grams: 170, label: "1 container (170 g)" });
  });

  it("falls back to Atwater energy, then to macros, when 1008 is missing", () => {
    expect(normalizeFood({ fdcId: 2, description: "x", dataType: "Foundation",
      foodNutrients: [nutrient(2047, 120, "KCAL"), nutrient(1003, 10)] })?.per100g.kcal).toBe(120);
    expect(normalizeFood({ fdcId: 3, description: "x", dataType: "Foundation",
      foodNutrients: [nutrient(1003, 10), nutrient(1005, 10), nutrient(1004, 10)] })?.per100g.kcal).toBe(170);
  });

  it("ignores kJ energy values and drops foods with no nutrition", () => {
    expect(normalizeFood({ fdcId: 4, description: "x", dataType: "Foundation",
      foodNutrients: [nutrient(1008, 500, "kJ"), nutrient(1003, 5)] })?.per100g.kcal).toBe(20);
    expect(normalizeFood({ fdcId: 5, description: "water", dataType: "Foundation", foodNutrients: [] })).toBeNull();
  });
});

import { rankGeneric, type FoodResult } from "@/lib/usda";

const food = (name: string): FoodResult => ({
  fdcId: Math.random(), name, brand: null, kind: "generic", serving: null,
  per100g: { kcal: 1, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
});

describe("rankGeneric", () => {
  it("puts plain whole foods ahead of processed variants", () => {
    const ranked = rankGeneric("banana", [food("Bananas, dehydrated, or banana powder"), food("Bananas, raw")]);
    expect(ranked[0].name).toBe("Bananas, raw");
  });
  it("keeps processed foods when the query asks for them", () => {
    const ranked = rankGeneric("dried mango", [food("Mango, raw"), food("Mango, dried, sweetened")]);
    expect(ranked[0].name).toBe("Mango, dried, sweetened");
  });
});
