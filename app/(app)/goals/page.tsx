import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getProfileBundle } from "@/lib/data/profile";
import type { ActivityLevel, Goal, Sex } from "@/lib/macros";
import { getUser } from "@/lib/supabase/server";
import { GoalForm, type GoalFormDefaults } from "./goal-form";

export default function GoalsPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Goals</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <GoalsContent />
      </Suspense>
    </div>
  );
}

async function GoalsContent() {
  const user = await getUser();
  if (!user) redirect("/login");
  const { profile, latestWeightKg, goal } = await getProfileBundle();

  const defaults: GoalFormDefaults = {
    units: profile?.units ?? "imperial",
    sex: (profile?.sex as Sex | null) ?? null,
    birthDate: profile?.birth_date ?? null,
    heightCm: profile?.height_cm != null ? Number(profile.height_cm) : null,
    weightKg: latestWeightKg,
    activity: (profile?.activity_level as ActivityLevel) ?? "moderate",
    goal: (goal?.type as Goal | undefined) ?? null,
    custom: goal?.is_override ? { protein_g: goal.protein_g, carbs_g: goal.carbs_g, fat_g: goal.fat_g } : null,
  };

  return <GoalForm defaults={defaults} />;
}
