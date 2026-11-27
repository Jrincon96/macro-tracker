"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ACTIVITY_LEVELS, ageOn, GOALS, kcalFromMacros, targetsFor } from "@/lib/macros";
import { ftInToCm, lbToKg, round1 } from "@/lib/macros/units";
import { isValidTimeZone, todayIn } from "@/lib/dates";
import { createClient, getUser } from "@/lib/supabase/server";

export type SaveGoalState = { ok?: boolean; error?: string };

const num = z.coerce.number<string>();
const optionalNum = z.preprocess((v) => (v === "" || v == null ? undefined : v), num.optional());

const schema = z
  .object({
    units: z.enum(["imperial", "metric"]),
    sex: z.enum(["male", "female"]),
    birth_date: z.iso.date("Enter your birth date"),
    height_ft: optionalNum,
    height_in: optionalNum,
    height_cm: optionalNum,
    weight: num.positive("Enter your weight"),
    activity_level: z.enum(ACTIVITY_LEVELS),
    goal: z.enum(GOALS),
    timezone: z.string().refine(isValidTimeZone).catch("America/New_York"),
    customize: z.literal("on").optional(),
    protein_g: optionalNum,
    carbs_g: optionalNum,
    fat_g: optionalNum,
  })
  .transform((d) => ({
    ...d,
    heightCm: d.units === "imperial" ? ftInToCm(d.height_ft ?? 0, d.height_in ?? 0) : (d.height_cm ?? 0),
    weightKg: d.units === "imperial" ? lbToKg(d.weight) : d.weight,
  }))
  .refine((d) => d.heightCm >= 100 && d.heightCm <= 250, { message: "Height looks off", path: ["height"] })
  .refine((d) => d.weightKg >= 30 && d.weightKg <= 300, { message: "Weight looks off", path: ["weight"] });

export async function saveGoal(_prev: SaveGoalState, formData: FormData): Promise<SaveGoalState> {
  const user = await getUser();
  if (!user) return { error: "You're signed out. Sign in again." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const age = ageOn(d.birth_date);
  if (age < 16 || age > 100) return { error: "Birth date looks off" };

  const recommended = targetsFor(
    { sex: d.sex, age, heightCm: d.heightCm, weightKg: d.weightKg, activity: d.activity_level },
    d.goal,
  );

  let targets = recommended;
  const isOverride = d.customize === "on";
  if (isOverride) {
    const protein_g = Math.round(d.protein_g ?? recommended.protein_g);
    const carbs_g = Math.round(d.carbs_g ?? recommended.carbs_g);
    const fat_g = Math.round(d.fat_g ?? recommended.fat_g);
    if ([protein_g, carbs_g, fat_g].some((g) => g < 0 || g > 1000)) return { error: "Macro grams look off" };
    targets = { protein_g, carbs_g, fat_g, kcal: kcalFromMacros({ protein_g, carbs_g, fat_g }) };
    if (targets.kcal < 800) return { error: "Custom macros add up to under 800 kcal" };
  }

  const supabase = await createClient();
  const today = todayIn(d.timezone);

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    sex: d.sex,
    birth_date: d.birth_date,
    height_cm: round1(d.heightCm),
    activity_level: d.activity_level,
    units: d.units,
    timezone: d.timezone,
  });
  if (profileError) return { error: "Couldn't save your profile" };

  const { error: weighError } = await supabase
    .from("weigh_ins")
    .upsert({ user_id: user.id, date: today, weight_kg: Math.round(d.weightKg * 100) / 100 }, { onConflict: "user_id,date" });
  if (weighError) return { error: "Couldn't save your weight" };

  // One active goal per user: retire the old one, then add the new one.
  const { error: retireError } = await supabase.from("goals").update({ active: false }).eq("active", true);
  if (retireError) return { error: "Couldn't update your goal" };
  const { error: goalError } = await supabase.from("goals").insert({
    type: d.goal,
    ...targets,
    is_override: isOverride,
    start_date: today,
    active: true,
  });
  if (goalError) return { error: "Couldn't save your goal" };

  revalidatePath("/today");
  revalidatePath("/goals");
  return { ok: true };
}
