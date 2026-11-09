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
});
