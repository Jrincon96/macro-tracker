import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getProfileBundle } from "@/lib/data/profile";
import { getSavedFoods, MEAL_TYPES, type MealType } from "@/lib/data/meals";
import { parseDateParam, formatDayLabel, hourIn } from "@/lib/dates";
import { getUser } from "@/lib/supabase/server";
import { defaultMealType } from "./draft";
import { MealLogger } from "./meal-logger";

export default function LogPage({ searchParams }: PageProps<"/log">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Log food</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <LogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LogContent({ searchParams }: { searchParams: PageProps<"/log">["searchParams"] }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const [{ profile }, savedFoods, params] = await Promise.all([getProfileBundle(), getSavedFoods(), searchParams]);

  const tz = profile?.timezone ?? "America/New_York";
  const date = parseDateParam(params.date, tz);
  const meal = typeof params.meal === "string" && (MEAL_TYPES as string[]).includes(params.meal)
    ? (params.meal as MealType)
    : defaultMealType(hourIn(tz));

  return (
    <MealLogger date={date} dateLabel={formatDayLabel(date, tz)} defaultMealType={meal} savedFoods={savedFoods} />
  );
}
