"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SavedFood } from "@/lib/data/meals";
import { deleteSavedFood } from "./actions";
import { fmt, newKey, type Draft } from "./draft";

export function SavedFoods({ foods, onAdd }: { foods: SavedFood[]; onAdd: (d: Draft) => void }) {
  const [filter, setFilter] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const visible = foods.filter(
    (f) => !hidden.has(f.id) && f.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  if (foods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No saved foods yet. Tap ☆ next to a food in your meal to save it for one-tap logging.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {foods.length > 6 && (
        <Input type="search" placeholder="Filter saved foods" value={filter} onChange={(e) => setFilter(e.target.value)} />
      )}
      <ul className="flex flex-col divide-y rounded-lg border">
        {visible.map((f) => (
          <li key={f.id} className="flex items-center gap-2 px-3 py-2">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{f.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {f.serving} · {Math.round(Number(f.kcal))} kcal · {fmt(Number(f.protein_g))}P {fmt(Number(f.carbs_g))}C {fmt(Number(f.fat_g))}F
              </span>
            </div>
            <Button type="button" size="sm" variant="ghost" aria-label={`Delete ${f.name}`} disabled={pending}
              onClick={() => {
                if (!confirm(`Remove "${f.name}" from saved foods?`)) return;
                setHidden((h) => new Set(h).add(f.id));
                startTransition(async () => {
                  const res = await deleteSavedFood(f.id);
                  if (!res.ok) setHidden((h) => { const n = new Set(h); n.delete(f.id); return n; });
                });
              }}>
              ✕
            </Button>
            <Button type="button" size="sm" aria-label={`Add ${f.name}`}
              onClick={() =>
                onAdd({
                  key: newKey(),
                  name: f.name,
                  unit: f.serving,
                  quantity: 1,
                  perUnit: {
                    kcal: Number(f.kcal), protein_g: Number(f.protein_g), carbs_g: Number(f.carbs_g),
                    fat_g: Number(f.fat_g), fiber_g: Number(f.fiber_g ?? 0),
                  },
                  origin: "saved",
                  savedFoodId: f.id,
                })
              }>
              + Add
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
