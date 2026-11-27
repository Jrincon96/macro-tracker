import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getProfileBundle } from "@/lib/data/profile";
import { GOAL_RULES, type Goal } from "@/lib/macros";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

// The static part renders instantly; the user-specific part streams in.
export default function TodayPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Today</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <TodayContent />
      </Suspense>
    </div>
  );
}

async function TodayContent() {
  const user = await getUser();
  if (!user) redirect("/login");
  const { goal } = await getProfileBundle();

  return (
    <>
      {goal ? (
        <section className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Daily targets</h2>
            <span className="text-xs text-muted-foreground">
              {GOAL_RULES[goal.type as Goal].label}{goal.is_override ? " · custom" : ""}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Target label="kcal" value={goal.kcal} />
            <Target label="Protein" value={goal.protein_g} unit="g" />
            <Target label="Carbs" value={goal.carbs_g} unit="g" />
            <Target label="Fat" value={goal.fat_g} unit="g" />
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">Set a goal to get your daily calorie and macro targets.</p>
          <Button nativeButton={false} render={<Link href="/goals" />}>Set your goal</Button>
        </section>
      )}

      <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
        <span>Signed in as {user.email}</span>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">Sign out</Button>
        </form>
      </div>
    </>
  );
}

function Target({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <div className="text-lg font-semibold tabular-nums">{value}{unit}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
