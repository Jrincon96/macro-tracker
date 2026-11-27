import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

/** Profile, most recent weigh-in and active goal for the signed-in user (RLS scopes to them). */
export async function getProfileBundle() {
  const supabase = await createClient();
  const [profile, weighIn, goal] = await Promise.all([
    supabase.from("profiles").select("*").maybeSingle(),
    supabase.from("weigh_ins").select("date, weight_kg").order("date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("goals").select("*").eq("active", true).maybeSingle(),
  ]);
  return {
    profile: profile.data,
    latestWeightKg: weighIn.data ? Number(weighIn.data.weight_kg) : null,
    goal: goal.data,
  };
}
