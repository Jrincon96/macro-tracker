/**
 * Row-level security checks against a LOCAL Supabase stack.
 * Run with: npx supabase start && npm run test:db
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.LOCAL_SUPABASE_SERVICE_KEY ?? "";
const enabled = Boolean(anonKey && serviceKey);

async function makeUser(admin: SupabaseClient, email: string) {
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

describe.skipIf(!enabled)("row-level security", () => {
  let alice: Awaited<ReturnType<typeof makeUser>>;
  let bob: Awaited<ReturnType<typeof makeUser>>;
  let aliceMealId: string;

  beforeAll(async () => {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const tag = crypto.randomUUID().slice(0, 8);
    alice = await makeUser(admin, `alice-${tag}@test.local`);
    bob = await makeUser(admin, `bob-${tag}@test.local`);

    const { data, error } = await alice.client
      .from("meals").insert({ meal_type: "lunch", name: "Chicken bowl" }).select("id").single();
    if (error) throw error;
    aliceMealId = data.id;
    const { error: itemError } = await alice.client.from("meal_items").insert({
      meal_id: aliceMealId, name: "Chicken breast", kcal: 330, protein_g: 62, carbs_g: 0, fat_g: 7,
    });
    if (itemError) throw itemError;
  });

  it("creates a profile automatically on sign-up", async () => {
    const { data } = await alice.client.from("profiles").select("user_id").single();
    expect(data?.user_id).toBe(alice.id);
  });

  it("lets a user read their own meals and daily totals", async () => {
    const { data: meals } = await alice.client.from("meals").select("id");
    expect(meals?.map((m) => m.id)).toContain(aliceMealId);
    const { data: totals } = await alice.client.from("daily_totals").select("protein_g");
    expect(Number(totals?.[0]?.protein_g)).toBe(62);
  });

  it("hides one user's data from another", async () => {
    const { data: meals } = await bob.client.from("meals").select("id");
    expect(meals).toEqual([]);
    const { data: items } = await bob.client.from("meal_items").select("id");
    expect(items).toEqual([]);
    const { data: totals } = await bob.client.from("daily_totals").select("*");
    expect(totals).toEqual([]);
  });

  it("blocks adding items to someone else's meal", async () => {
    const { error } = await bob.client.from("meal_items").insert({ meal_id: aliceMealId, name: "Sneaky" });
    expect(error).not.toBeNull();
  });

  it("blocks writing rows owned by another user", async () => {
    const { error } = await bob.client.from("weigh_ins").insert({ user_id: alice.id, weight_kg: 80 });
    expect(error).not.toBeNull();
  });

  it("allows only one active goal per user", async () => {
    const goal = { type: "cut", kcal: 2000, protein_g: 180, carbs_g: 180, fat_g: 60 };
    expect((await alice.client.from("goals").insert(goal)).error).toBeNull();
    expect((await alice.client.from("goals").insert(goal)).error).not.toBeNull();
  });

  it("supports the goal save flow: profile upsert, weigh-in upsert, goal swap", async () => {
    const c = alice.client;
    expect((await c.from("profiles").upsert({
      user_id: alice.id, sex: "male", birth_date: "1996-01-01", height_cm: 177.8,
      activity_level: "moderate", units: "imperial", timezone: "America/New_York",
    })).error).toBeNull();

    const weigh = { user_id: alice.id, date: "2026-11-27", weight_kg: 81.65 };
    expect((await c.from("weigh_ins").upsert(weigh, { onConflict: "user_id,date" })).error).toBeNull();
    expect((await c.from("weigh_ins").upsert({ ...weigh, weight_kg: 81.2 }, { onConflict: "user_id,date" })).error).toBeNull();
    const { data: weighs } = await c.from("weigh_ins").select("weight_kg").eq("date", "2026-11-27");
    expect(weighs?.map((w) => Number(w.weight_kg))).toEqual([81.2]);

    // Retire whatever is active, then insert the new goal.
    expect((await c.from("goals").update({ active: false }).eq("active", true)).error).toBeNull();
    expect((await c.from("goals").insert({
      type: "lean_bulk", kcal: 2900, protein_g: 163, carbs_g: 380, fat_g: 81, active: true,
    })).error).toBeNull();
    const { data: active } = await c.from("goals").select("type").eq("active", true);
    expect(active).toEqual([{ type: "lean_bulk" }]);
  });

  it("logs a meal with items, reads the day back, and deletes it with its items", async () => {
    const c = alice.client;
    const { data: meal, error } = await c.from("meals")
      .insert({ eaten_on: "2026-11-20", meal_type: "dinner", name: "Steak + rice", source: "usda" })
      .select("id").single();
    expect(error).toBeNull();
    expect((await c.from("meal_items").insert([
      { meal_id: meal!.id, name: "Sirloin", quantity: 6, unit: "oz", kcal: 350, protein_g: 50, carbs_g: 0, fat_g: 15, usda_fdc_id: 123 },
      { meal_id: meal!.id, name: "Rice", quantity: 1, unit: "cup", kcal: 205, protein_g: 4.3, carbs_g: 45, fat_g: 0.4 },
    ])).error).toBeNull();

    const { data: day } = await c.from("meals")
      .select("id, meal_items (kcal, protein_g)").eq("eaten_on", "2026-11-20");
    expect(day).toHaveLength(1);
    expect(day![0].meal_items).toHaveLength(2);
    const { data: totals } = await c.from("daily_totals").select("kcal, protein_g").eq("day", "2026-11-20").single();
    expect(Number(totals!.kcal)).toBe(555);
    expect(Number(totals!.protein_g)).toBeCloseTo(54.3, 1);

    // Bob can't delete Alice's meal (RLS makes it a silent no-op).
    await bob.client.from("meals").delete().eq("id", meal!.id);
    expect((await c.from("meals").select("id").eq("id", meal!.id)).data).toHaveLength(1);

    expect((await c.from("meals").delete().eq("id", meal!.id)).error).toBeNull();
    expect((await c.from("meal_items").select("id").eq("meal_id", meal!.id)).data).toEqual([]);
  });

  it("upserts saved foods by name and keeps them private", async () => {
    const food = { name: "Protein shake", serving: "1 scoop", kcal: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5 };
    expect((await alice.client.from("saved_foods").upsert(food, { onConflict: "user_id,name" })).error).toBeNull();
    expect((await alice.client.from("saved_foods").upsert({ ...food, kcal: 130 }, { onConflict: "user_id,name" })).error).toBeNull();
    const { data } = await alice.client.from("saved_foods").select("kcal").eq("name", "Protein shake");
    expect(data?.map((d) => Number(d.kcal))).toEqual([130]);
    expect((await bob.client.from("saved_foods").select("id")).data).toEqual([]);
  });
});
