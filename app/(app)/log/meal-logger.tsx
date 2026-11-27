"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sumMacros } from "@/lib/macros";
import type { MealType, SavedFood } from "@/lib/data/meals";
import { logMeal, saveFood } from "./actions";
import { draftNutrients, fmt, toDraftItem, type Draft } from "./draft";
import { FoodSearch } from "./food-search";
import { QuickAdd } from "./quick-add";
import { SavedFoods } from "./saved-foods";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack",
};
const TABS = [
  { id: "search", label: "Search" },
  { id: "saved", label: "Saved" },
  { id: "quick", label: "Quick add" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function MealLogger({
  date,
  dateLabel,
  defaultMealType,
  savedFoods,
}: {
  date: string;
  dateLabel: string;
  defaultMealType: MealType;
  savedFoods: SavedFood[];
}) {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [tab, setTab] = useState<Tab>(savedFoods.length ? "saved" : "search");
  const [items, setItems] = useState<Draft[]>([]);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = sumMacros(items.map(draftNutrients));
  const add = (d: Draft) => setItems((xs) => [...xs, d]);
  const update = (key: string, quantity: number) =>
    setItems((xs) => xs.map((x) => (x.key === key ? { ...x, quantity } : x)));
  const remove = (key: string) => setItems((xs) => xs.filter((x) => x.key !== key));

  function star(d: Draft) {
    const n = draftNutrients(d);
    setStarred((s) => new Set(s).add(d.key));
    startTransition(async () => {
      const res = await saveFood({
        name: d.name.slice(0, 200),
        serving: `${fmt(d.quantity)} ${d.unit}`.slice(0, 80),
        ...n,
      });
      if (!res.ok) {
        setStarred((s) => { const x = new Set(s); x.delete(d.key); return x; });
        setError(res.error);
      }
    });
  }

  function submit() {
    setError(null);
    const origins = new Set(items.map((i) => i.origin));
    const source = origins.size === 1 ? [...origins][0] : "manual";
    startTransition(async () => {
      const res = await logMeal({ date, meal_type: mealType, source, items: items.map(toDraftItem) });
      if (!res.ok) return setError(res.error);
      router.push(`/today?date=${date}`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
        <div className="grid grid-cols-4 gap-1 rounded-lg border p-1 text-sm" role="radiogroup" aria-label="Meal">
          {(Object.keys(MEAL_LABELS) as MealType[]).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={mealType === t} onClick={() => setMealType(t)}
              className={`rounded-md py-1.5 ${mealType === t ? "bg-primary text-primary-foreground" : ""}`}>
              {MEAL_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 border-b text-sm" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-2 ${tab === t.id ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "search" && <FoodSearch onAdd={add} />}
      {tab === "saved" && <SavedFoods foods={savedFoods} onAdd={add} />}
      {tab === "quick" && <QuickAdd onAdd={add} />}

      {items.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg border p-3">
          <h2 className="text-sm font-medium">{MEAL_LABELS[mealType]} · {items.length} item{items.length > 1 ? "s" : ""}</h2>
          <ul className="flex flex-col divide-y">
            {items.map((d) => {
              const n = draftNutrients(d);
              return (
                <li key={d.key} className="flex items-center gap-2 py-2">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{d.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {n.kcal} kcal · {fmt(n.protein_g)}P {fmt(n.carbs_g)}C {fmt(n.fat_g)}F
                    </span>
                  </div>
                  <Input inputMode="decimal" aria-label={`Quantity of ${d.name}`} className="w-16 text-right"
                    defaultValue={String(d.quantity)}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      if (q > 0) update(d.key, q);
                    }} />
                  <span className="w-14 truncate text-xs text-muted-foreground" title={d.unit}>{d.unit}</span>
                  {d.origin !== "saved" && (
                    <Button type="button" size="icon-sm" variant="ghost" disabled={starred.has(d.key)}
                      aria-label={starred.has(d.key) ? "Saved" : `Save ${d.name} to saved foods`} onClick={() => star(d)}>
                      {starred.has(d.key) ? "★" : "☆"}
                    </Button>
                  )}
                  <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${d.name}`} onClick={() => remove(d.key)}>
                    ✕
                  </Button>
                </li>
              );
            })}
          </ul>
          <p className="text-sm tabular-nums">
            <span className="font-semibold">{Math.round(totals.kcal)} kcal</span>
            <span className="text-muted-foreground"> · {fmt(totals.protein_g)} g protein · {fmt(totals.carbs_g)} g carbs · {fmt(totals.fat_g)} g fat</span>
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" size="lg" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : `Log ${MEAL_LABELS[mealType].toLowerCase()}`}
          </Button>
        </section>
      )}
    </div>
  );
}
