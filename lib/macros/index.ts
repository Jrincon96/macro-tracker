/**
 * Macro math: BMR → TDEE → goal-adjusted calories → protein/fat/carb split.
 * Pure functions, shared by the client (live preview) and the server (saving).
 * All inputs are metric; convert at the edges with ./units.
 */

export const GOALS = ["cut", "fat_loss", "maintain", "lean_bulk", "muscle_gain"] as const;
export type Goal = (typeof GOALS)[number];

export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export type Sex = "male" | "female";

export type Macros = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };

export type BodyStats = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
};

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Light (exercise 1–3 days/week)",
  moderate: "Moderate (exercise 3–5 days/week)",
  active: "Active (hard exercise 6–7 days/week)",
  very_active: "Very active (physical job + training)",
};

type GoalRule = {
  label: string;
  description: string;
  /** Calorie change vs. TDEE, e.g. -0.25 = 25% deficit. */
  kcalAdjust: number;
  /** Protein in grams per kg of bodyweight. */
  proteinPerKg: number;
  /** Share of calories from fat. */
  fatShare: number;
};

export const GOAL_RULES: Record<Goal, GoalRule> = {
  cut: {
    label: "Cut",
    description: "Aggressive fat loss (−25%), high protein to keep muscle",
    kcalAdjust: -0.25,
    proteinPerKg: 2.2, // ~1.0 g/lb
    fatShare: 0.25,
  },
  fat_loss: {
    label: "Fat loss",
    description: "Steady fat loss (−15%)",
    kcalAdjust: -0.15,
    proteinPerKg: 2.0, // ~0.9 g/lb
    fatShare: 0.25,
  },
  maintain: {
    label: "Maintain",
    description: "Hold your current weight",
    kcalAdjust: 0,
    proteinPerKg: 1.8, // ~0.8 g/lb
    fatShare: 0.3,
  },
  lean_bulk: {
    label: "Lean bulk",
    description: "Slow muscle gain, minimal fat (+10%)",
    kcalAdjust: 0.1,
    proteinPerKg: 2.0,
    fatShare: 0.25,
  },
  muscle_gain: {
    label: "Muscle gain",
    description: "Faster muscle gain (+15%)",
    kcalAdjust: 0.15,
    proteinPerKg: 2.0,
    fatShare: 0.25,
  },
};

export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

/** Never recommend fewer calories than this without medical supervision. */
export const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };
/** Minimum fat for hormone health, grams per kg. */
const MIN_FAT_PER_KG = 0.6;

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
export function bmr({ sex, age, heightCm, weightKg }: Omit<BodyStats, "activity">): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/** Total daily energy expenditure (kcal/day). */
export function tdee(stats: BodyStats): number {
  return bmr(stats) * ACTIVITY_FACTORS[stats.activity];
}

const round10 = (n: number) => Math.round(n / 10) * 10;

/** Recommended daily targets for a goal. */
export function targetsFor(stats: BodyStats, goal: Goal): Macros {
  const rule = GOAL_RULES[goal];
  const kcal = round10(Math.max(tdee(stats) * (1 + rule.kcalAdjust), KCAL_FLOOR[stats.sex]));

  const protein_g = Math.round(stats.weightKg * rule.proteinPerKg);
  const fat_g = Math.round(
    Math.max((kcal * rule.fatShare) / KCAL_PER_GRAM.fat, stats.weightKg * MIN_FAT_PER_KG),
  );
  const carbKcal = kcal - protein_g * KCAL_PER_GRAM.protein - fat_g * KCAL_PER_GRAM.fat;
  const carbs_g = Math.max(0, Math.round(carbKcal / KCAL_PER_GRAM.carbs));

  return { kcal, protein_g, carbs_g, fat_g };
}

/** Calories implied by a set of macro grams. */
export function kcalFromMacros({ protein_g, carbs_g, fat_g }: Omit<Macros, "kcal">): number {
  return (
    protein_g * KCAL_PER_GRAM.protein + carbs_g * KCAL_PER_GRAM.carbs + fat_g * KCAL_PER_GRAM.fat
  );
}

/** What's left to eat today (negative = over target). */
export function remaining(target: Macros, eaten: Macros): Macros {
  return {
    kcal: target.kcal - eaten.kcal,
    protein_g: target.protein_g - eaten.protein_g,
    carbs_g: target.carbs_g - eaten.carbs_g,
    fat_g: target.fat_g - eaten.fat_g,
  };
}

/** Sum macros across items. */
export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      protein_g: acc.protein_g + i.protein_g,
      carbs_g: acc.carbs_g + i.carbs_g,
      fat_g: acc.fat_g + i.fat_g,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

/** Whole years between birthDate and `on`. */
export function ageOn(birthDate: string | Date, on: Date = new Date()): number {
  const b = typeof birthDate === "string" ? new Date(`${birthDate}T00:00:00`) : birthDate;
  let age = on.getFullYear() - b.getFullYear();
  const beforeBirthday =
    on.getMonth() < b.getMonth() || (on.getMonth() === b.getMonth() && on.getDate() < b.getDate());
  if (beforeBirthday) age--;
  return age;
}
