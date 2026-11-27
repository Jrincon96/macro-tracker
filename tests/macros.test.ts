import { describe, expect, it } from "vitest";
import {
  ageOn, bmr, GOALS, kcalFromMacros, KCAL_FLOOR, remaining, sumMacros, targetsFor, tdee,
  type BodyStats,
} from "@/lib/macros";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/macros/units";

// 30-year-old man, 5'10" (177.8 cm), 180 lb (81.65 kg), moderately active.
const man: BodyStats = { sex: "male", age: 30, heightCm: 177.8, weightKg: lbToKg(180), activity: "moderate" };

describe("bmr / tdee", () => {
  it("matches Mifflin-St Jeor for men", () => {
    // 10*81.65 + 6.25*177.8 - 5*30 + 5 = 1782.7
    expect(bmr(man)).toBeCloseTo(1782.7, 0);
  });
  it("subtracts 161 for women instead of adding 5", () => {
    expect(bmr({ ...man, sex: "female" })).toBeCloseTo(bmr(man) - 166, 5);
  });
  it("multiplies by the activity factor", () => {
    expect(tdee(man)).toBeCloseTo(bmr(man) * 1.55, 5);
  });
});

describe("targetsFor", () => {
  it("orders calories cut < fat_loss < maintain < lean_bulk < muscle_gain", () => {
    const kcals = GOALS.map((g) => targetsFor(man, g).kcal);
    expect([...kcals].sort((a, b) => a - b)).toEqual(kcals);
  });

  it("gives a 25% deficit on a cut, rounded to 10 kcal", () => {
    const t = targetsFor(man, "cut");
    expect(t.kcal % 10).toBe(0);
    expect(t.kcal).toBeCloseTo(tdee(man) * 0.75, -1);
  });

  it("sets protein to ~1 g/lb on a cut", () => {
    expect(targetsFor(man, "cut").protein_g).toBe(Math.round(lbToKg(180) * 2.2));
  });

  it("makes macro calories add up to the target (within rounding)", () => {
    for (const g of GOALS) {
      const t = targetsFor(man, g);
      expect(Math.abs(kcalFromMacros(t) - t.kcal)).toBeLessThanOrEqual(10);
    }
  });

  it("never goes below the calorie floor", () => {
    const tiny: BodyStats = { sex: "female", age: 60, heightCm: 150, weightKg: 45, activity: "sedentary" };
    expect(targetsFor(tiny, "cut").kcal).toBe(KCAL_FLOOR.female);
  });

  it("keeps fat at or above the minimum and carbs non-negative", () => {
    const heavy: BodyStats = { sex: "male", age: 40, heightCm: 170, weightKg: 140, activity: "sedentary" };
    const t = targetsFor(heavy, "cut");
    expect(t.fat_g).toBeGreaterThanOrEqual(Math.round(140 * 0.6));
    expect(t.carbs_g).toBeGreaterThanOrEqual(0);
  });
});

describe("remaining / sumMacros", () => {
  it("subtracts eaten from target", () => {
    const eaten = sumMacros([
      { kcal: 300, protein_g: 30, carbs_g: 20, fat_g: 10 },
      { kcal: 500, protein_g: 40, carbs_g: 50, fat_g: 15 },
    ]);
    expect(remaining({ kcal: 2000, protein_g: 180, carbs_g: 200, fat_g: 60 }, eaten)).toEqual({
      kcal: 1200, protein_g: 110, carbs_g: 130, fat_g: 35,
    });
  });
});

describe("ageOn", () => {
  it("counts whole years, accounting for birthdays not yet reached", () => {
    expect(ageOn("1996-06-15", new Date(2026, 5, 14))).toBe(29);
    expect(ageOn("1996-06-15", new Date(2026, 5, 15))).toBe(30);
  });
});

describe("units", () => {
  it("round-trips pounds and kilograms", () => {
    expect(kgToLb(lbToKg(180))).toBeCloseTo(180, 6);
  });
  it("converts feet/inches to cm and back", () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 1);
    expect(cmToFtIn(177.8)).toEqual({ ft: 5, in: 10 });
  });
});
