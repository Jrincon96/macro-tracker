"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getUser } from "@/lib/supabase/server";

const macro = z.number().min(0).max(20000);
const itemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().positive().max(100000),
  unit: z.string().trim().min(1).max(40),
  kcal: macro,
  protein_g: macro,
  carbs_g: macro,
  fat_g: macro,
  fiber_g: macro.optional(),
  usda_fdc_id: z.number().int().positive().nullable().optional(),
  saved_food_id: z.uuid().nullable().optional(),
});
export type DraftItem = z.input<typeof itemSchema>;

const mealSchema = z.object({
  date: z.iso.date(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string().trim().max(200).optional(),
  source: z.enum(["manual", "usda", "saved", "text_ai", "photo_ai"]),
  items: z.array(itemSchema).min(1, "Add at least one food").max(50),
});
export type LogMealInput = z.input<typeof mealSchema>;

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function logMeal(input: LogMealInput): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You're signed out. Sign in again." };
  const parsed = mealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { date, meal_type, items, source } = parsed.data;

  const name =
    parsed.data.name ||
    (items.length === 1 ? items[0].name : `${items[0].name} + ${items.length - 1} more`);

  const supabase = await createClient();
  const { data: meal, error } = await supabase
    .from("meals")
    .insert({ eaten_on: date, meal_type, name: name.slice(0, 200), source })
    .select("id")
    .single();
  if (error || !meal) return { ok: false, error: "Couldn't save the meal" };

  const { error: itemsError } = await supabase.from("meal_items").insert(
    items.map((i) => ({
      meal_id: meal.id, name: i.name, quantity: i.quantity, unit: i.unit, kcal: i.kcal,
      protein_g: i.protein_g, carbs_g: i.carbs_g, fat_g: i.fat_g, fiber_g: i.fiber_g ?? null,
      usda_fdc_id: i.usda_fdc_id ?? null,
    })),
  );
  if (itemsError) {
    await supabase.from("meals").delete().eq("id", meal.id); // don't leave an empty meal behind
    return { ok: false, error: "Couldn't save the foods in this meal" };
  }

  // Bump usage on saved foods so the most-used float to the top.
  const savedIds = [...new Set(items.map((i) => i.saved_food_id).filter((id): id is string => !!id))];
  if (savedIds.length) {
    const { data: saved } = await supabase.from("saved_foods").select("id, times_used").in("id", savedIds);
    const now = new Date().toISOString();
    await Promise.all(
      (saved ?? []).map((s) =>
        supabase.from("saved_foods").update({ times_used: s.times_used + 1, last_used_at: now }).eq("id", s.id),
      ),
    );
  }

  revalidatePath("/today");
  return { ok: true };
}

export async function deleteMeal(mealId: string): Promise<ActionResult> {
  if (!(await getUser())) return { ok: false, error: "You're signed out." };
  if (!z.uuid().safeParse(mealId).success) return { ok: false, error: "Unknown meal" };
  const supabase = await createClient();
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) return { ok: false, error: "Couldn't delete the meal" };
  revalidatePath("/today");
  return { ok: true };
}

const savedFoodSchema = z.object({
  name: z.string().trim().min(1).max(200),
  serving: z.string().trim().min(1).max(80),
  kcal: macro,
  protein_g: macro,
  carbs_g: macro,
  fat_g: macro,
  fiber_g: macro.optional(),
});
export type SavedFoodInput = z.input<typeof savedFoodSchema>;

export async function saveFood(input: SavedFoodInput): Promise<ActionResult & { id?: string }> {
  if (!(await getUser())) return { ok: false, error: "You're signed out." };
  const parsed = savedFoodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_foods")
    .upsert(parsed.data, { onConflict: "user_id,name" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't save the food" };
  revalidatePath("/log");
  return { ok: true, id: data.id };
}

export async function deleteSavedFood(id: string): Promise<ActionResult> {
  if (!(await getUser())) return { ok: false, error: "You're signed out." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown food" };
  const supabase = await createClient();
  const { error } = await supabase.from("saved_foods").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the food" };
  revalidatePath("/log");
  return { ok: true };
}
