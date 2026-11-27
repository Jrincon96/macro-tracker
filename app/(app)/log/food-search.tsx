"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { scaleNutrients } from "@/lib/macros/portion";
import { fmt, newKey, OZ, perUnitFrom100g, type Draft } from "./draft";

type Food = {
  fdcId: number;
  name: string;
  brand: string | null;
  kind: "generic" | "branded";
  per100g: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number };
  serving: { grams: number; label: string } | null;
};

export function FoodSearch({ onAdd }: { onAdd: (d: Draft) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Food | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Search failed");
        setResults(body.foods);
        setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Short queries show nothing; derived here rather than cleared in the effect.
  const active = query.trim().length >= 2;
  const shown = active ? results : [];
  const shownError = active ? error : null;

  if (selected) {
    return (
      <PortionPicker
        food={selected}
        onCancel={() => setSelected(null)}
        onAdd={(d) => {
          onAdd(d);
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Input type="search" placeholder="Search foods, e.g. chicken breast" value={query}
        onChange={(e) => setQuery(e.target.value)} autoFocus enterKeyHint="search" />
      {shownError && <p className="text-sm text-destructive">{shownError}</p>}
      {active && loading && shown.length === 0 && <p className="text-sm text-muted-foreground">Searching…</p>}
      {active && !loading && shown.length === 0 && !shownError && (
        <p className="text-sm text-muted-foreground">No matches. Try fewer words, or use Quick add.</p>
      )}
      <ul className={`flex flex-col divide-y rounded-lg ${shown.length ? "border" : ""}`}>
        {shown.map((f) => (
          <li key={f.fdcId}>
            <button type="button" onClick={() => setSelected(f)}
              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted">
              <span className="text-sm">{f.name}</span>
              <span className="text-xs text-muted-foreground">
                {f.brand ? `${f.brand} · ` : ""}
                {f.serving
                  ? `${Math.round((f.per100g.kcal * f.serving.grams) / 100)} kcal per ${f.serving.label}`
                  : `${f.per100g.kcal} kcal · ${fmt(f.per100g.protein_g)}P ${fmt(f.per100g.carbs_g)}C ${fmt(f.per100g.fat_g)}F per 100 g`}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {shown.length > 0 && (
        <p className="text-xs text-muted-foreground">Nutrition data: USDA FoodData Central.</p>
      )}
    </div>
  );
}

function PortionPicker({ food, onAdd, onCancel }: { food: Food; onAdd: (d: Draft) => void; onCancel: () => void }) {
  const [unit, setUnit] = useState<"g" | "oz" | "serving">(food.serving ? "serving" : "g");
  const [amount, setAmount] = useState(food.serving ? "1" : "100");

  const qty = Number(amount);
  const gramsPerUnit = unit === "g" ? 1 : unit === "oz" ? OZ : (food.serving?.grams ?? 100);
  const valid = qty > 0 && Number.isFinite(qty);
  const n = scaleNutrients(food.per100g, valid ? qty * gramsPerUnit : 0);
  const unitLabel = unit === "serving" ? (food.serving?.label ?? "serving") : unit;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{food.name}</p>
        {food.brand && <p className="text-xs text-muted-foreground">{food.brand}</p>}
      </div>
      <div className="grid grid-cols-[1fr_1.6fr] gap-2">
        <Input inputMode="decimal" aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        <NativeSelect aria-label="Unit" value={unit} onChange={(e) => {
          const next = e.target.value as typeof unit;
          setUnit(next);
          setAmount(next === "serving" ? "1" : next === "oz" ? "4" : "100");
        }}>
          {food.serving && <option value="serving">× {food.serving.label}</option>}
          <option value="g">grams</option>
          <option value="oz">ounces</option>
        </NativeSelect>
      </div>
      <p className="text-sm tabular-nums">
        <span className="font-semibold">{n.kcal} kcal</span>
        <span className="text-muted-foreground"> · {fmt(n.protein_g)} g protein · {fmt(n.carbs_g)} g carbs · {fmt(n.fat_g)} g fat</span>
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Back</Button>
        <Button type="button" className="flex-1" disabled={!valid}
          onClick={() =>
            onAdd({
              key: newKey(),
              name: food.brand ? `${food.name} (${food.brand})` : food.name,
              unit: unitLabel,
              quantity: qty,
              perUnit: perUnitFrom100g(food.per100g, gramsPerUnit),
              origin: "usda",
              usdaFdcId: food.fdcId,
            })
          }>
          Add to meal
        </Button>
      </div>
    </div>
  );
}
