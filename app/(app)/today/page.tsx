import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MacroMeter } from "@/components/macro-meter";
import { Button } from "@/components/ui/button";
import { getDay, MEAL_TYPES, type Meal } from "@/lib/data/meals";
import { getProfileBundle } from "@/lib/data/profile";
import { addDays, formatDayLabel, parseDateParam, todayIn } from "@/lib/dates";
import { GOAL_RULES, remaining, type Goal } from "@/lib/macros";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { DeleteMealButton } from "./delete-meal-button";

const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" } as const;
const fmt = (n: number) => Math.round(n);

// The static part renders instantly; the user-specific part streams in.
export default function TodayPage({ searchParams }: PageProps<"/today">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <TodayContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TodayContent({ searchParams }: { searchParams: PageProps<"/today">["searchParams"] }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const [{ profile, goal }, params] = await Promise.all([getProfileBundle(), searchParams]);

  const tz = profile?.timezone ?? "America/New_York";
  const date = parseDateParam(params.date, tz);
  const isToday = date === todayIn(tz);
  const { meals, totals } = await getDay(date);

  return (
    <>
      <header className="flex items-center justify-between">
        <Link href={`/today?date=${addDays(date, -1)}`} aria-label="Previous day" className="rounded-md px-3 py-1 text-lg hover:bg-muted">‹</Link>
        <div className="text-center">
          <h1 className="text-xl font-semibold">{formatDayLabel(date, tz)}</h1>
          {!isToday && <Link href="/today" className="text-xs text-muted-foreground underline">Back to today</Link>}
        </div>
        <Link href={`/today?date=${addDays(date, 1)}`} aria-label="Next day" className="rounded-md px-3 py-1 text-lg hover:bg-muted">›</Link>
      </header>

      {goal ? (
        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <CaloriesHero eaten={totals.kcal} target={goal.kcal} />
          <MacroMeter label="Protein" eaten={totals.protein_g} target={goal.protein_g} overIsGood />
          <MacroMeter label="Carbs" eaten={totals.carbs_g} target={goal.carbs_g} />
          <MacroMeter label="Fat" eaten={totals.fat_g} target={goal.fat_g} />
          <p className="text-xs text-muted-foreground">
            Goal: {GOAL_RULES[goal.type as Goal].label}{goal.is_override ? " (custom)" : ""} ·{" "}
            <Link href="/goals" className="underline">change</Link>
          </p>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">Set a goal to get your daily calorie and macro targets.</p>
          <Button nativeButton={false} render={<Link href="/goals" />}>Set your goal</Button>
        </section>
      )}

      <Button size="lg" nativeButton={false} render={<Link href={`/log?date=${date}`} />}>+ Log food</Button>

      <MealsList meals={meals} date={date} />

      {goal && meals.length > 0 && <RemainingNote target={goal} eaten={totals} />}

      <div className="flex items-center justify-between pt-6 text-xs text-muted-foreground">
        <span>Signed in as {user.email}</span>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">Sign out</Button>
        </form>
      </div>
    </>
  );
}

function CaloriesHero({ eaten, target }: { eaten: number; target: number }) {
  const left = Math.round(target - eaten);
  const pct = Math.min(eaten / target, 1);
  const over = left < 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-5xl font-semibold tabular-nums tracking-tight">{Math.abs(left).toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{over ? "▲ kcal over target" : "kcal left"}</div>
        </div>
        <div className="text-right text-sm tabular-nums text-muted-foreground">
          <span className="text-foreground">{fmt(eaten).toLocaleString()}</span> / {target.toLocaleString()} kcal
        </div>
      </div>
      <div role="meter" aria-label="Calories" aria-valuemin={0} aria-valuemax={target} aria-valuenow={fmt(eaten)}
        aria-valuetext={`${fmt(eaten)} of ${target} kcal, ${over ? `${-left} over` : `${left} left`}`}
        className="h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--viz-track)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: over ? "var(--viz-serious)" : "var(--viz-fill)" }} />
      </div>
    </div>
  );
}

function MealsList({ meals, date }: { meals: Meal[]; date: string }) {
  if (meals.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Nothing logged yet.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {MEAL_TYPES.map((type) => {
        const ofType = meals.filter((m) => m.meal_type === type);
        if (!ofType.length) return null;
        const kcal = ofType.reduce((s, m) => s + m.totals.kcal, 0);
        return (
          <section key={type} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{MEAL_LABELS[type]}</h2>
              <span className="text-sm tabular-nums text-muted-foreground">{fmt(kcal)} kcal</span>
            </div>
            <ul className="flex flex-col divide-y rounded-lg border">
              {ofType.map((m) => (
                <li key={m.id} className="flex items-start gap-2 px-3 py-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm">{m.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {fmt(m.totals.kcal)} kcal · {fmt(m.totals.protein_g)}P {fmt(m.totals.carbs_g)}C {fmt(m.totals.fat_g)}F
                    </span>
                    {m.items.length > 1 && (
                      <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {m.items.map((i) => (
                          <li key={i.id} className="truncate">· {i.name} ({Number(i.quantity)} {i.unit}), {fmt(i.kcal)} kcal</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <DeleteMealButton id={m.id} name={m.name} />
                </li>
              ))}
            </ul>
            <Link href={`/log?date=${date}&meal=${type}`} className="self-start text-xs text-muted-foreground underline">
              + Add to {MEAL_LABELS[type].toLowerCase()}
            </Link>
          </section>
        );
      })}
    </div>
  );
}

function RemainingNote({ target, eaten }: { target: { kcal: number; protein_g: number; carbs_g: number; fat_g: number }; eaten: { kcal: number; protein_g: number; carbs_g: number; fat_g: number } }) {
  const r = remaining(target, eaten);
  if (r.protein_g <= 0 || r.kcal <= 0) return null;
  return (
    <p className="rounded-lg bg-muted p-3 text-sm">
      To hit your targets you still need about <strong>{fmt(r.protein_g)} g protein</strong>
      {r.carbs_g > 0 ? `, ${fmt(r.carbs_g)} g carbs` : ""}{r.fat_g > 0 ? ` and ${fmt(r.fat_g)} g fat` : ""} in{" "}
      {fmt(r.kcal)} kcal.
    </p>
  );
}
