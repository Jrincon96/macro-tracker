import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { sumMacros, type Macros } from "@/lib/macros";

type MealRow = Database["public"]["Tables"]["meals"]["Row"];
type ItemRow = Database["public"]["Tables"]["meal_items"]["Row"];
export type SavedFood = Database["public"]["Tables"]["saved_foods"]["Row"];
export type MealType = Database["public"]["Enums"]["meal_type"];

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export type MealItem = Pick<ItemRow, "id" | "name" | "quantity" | "unit"> & Macros & { fiber_g: number };
export type Meal = Pick<MealRow, "id" | "name" | "meal_type" | "eaten_at" | "source"> & {
  items: MealItem[];
  totals: Macros;
};

const n = (v: number | string | null) => Number(v ?? 0);

/** All meals (with items and totals) logged for a calendar day. */
export async function getDay(date: string): Promise<{ meals: Meal[]; totals: Macros }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select("id, name, meal_type, eaten_at, source, meal_items (id, name, quantity, unit, kcal, protein_g, carbs_g, fat_g, fiber_g, created_at)")
    .eq("eaten_on", date)
    .order("eaten_at", { ascending: true });
  if (error) throw new Error("Couldn't load meals");

  const meals: Meal[] = (data ?? []).map(({ meal_items, ...m }) => {
    const items = [...meal_items]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((i) => ({
        id: i.id, name: i.name, quantity: n(i.quantity), unit: i.unit,
        kcal: n(i.kcal), protein_g: n(i.protein_g), carbs_g: n(i.carbs_g), fat_g: n(i.fat_g), fiber_g: n(i.fiber_g),
      }));
    return { ...m, items, totals: sumMacros(items) };
  });
  return { meals, totals: sumMacros(meals.map((m) => m.totals)) };
}

/** Saved foods, most used first. */
export async function getSavedFoods(): Promise<SavedFood[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_foods")
    .select("*")
    .order("times_used", { ascending: false })
    .order("name");
  return data ?? [];
}
