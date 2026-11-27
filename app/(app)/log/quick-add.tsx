"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { kcalFromMacros } from "@/lib/macros";
import { newKey, type Draft } from "./draft";

const FIELDS = [
  { key: "protein_g", label: "Protein (g)" },
  { key: "carbs_g", label: "Carbs (g)" },
  { key: "fat_g", label: "Fat (g)" },
] as const;

/** Type in macros directly, e.g. from a nutrition label or a restaurant's website. */
export function QuickAdd({ onAdd }: { onAdd: (d: Draft) => void }) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [m, setM] = useState({ protein_g: "", carbs_g: "", fat_g: "" });

  const num = (s: string) => (s.trim() === "" ? 0 : Number(s));
  const macros = { protein_g: num(m.protein_g), carbs_g: num(m.carbs_g), fat_g: num(m.fat_g) };
  const estimated = kcalFromMacros(macros);
  const kcalValue = kcal.trim() === "" ? estimated : num(kcal);
  const valid =
    name.trim().length > 0 &&
    [kcalValue, ...Object.values(macros)].every((v) => Number.isFinite(v) && v >= 0) &&
    kcalValue > 0;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onAdd({
          key: newKey(),
          name: name.trim(),
          unit: "serving",
          quantity: 1,
          perUnit: { kcal: kcalValue, ...macros, fiber_g: 0 },
          origin: "manual",
        });
        setName("");
        setKcal("");
        setM({ protein_g: "", carbs_g: "", fat_g: "" });
      }}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qa-name">Food</Label>
        <Input id="qa-name" placeholder="e.g. Chipotle chicken bowl" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`qa-${f.key}`}>{f.label}</Label>
            <Input id={`qa-${f.key}`} inputMode="decimal" value={m[f.key]}
              onChange={(e) => setM({ ...m, [f.key]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qa-kcal">Calories</Label>
        <Input id="qa-kcal" inputMode="numeric" placeholder={estimated ? `${Math.round(estimated)} (from macros)` : ""}
          value={kcal} onChange={(e) => setKcal(e.target.value)} />
      </div>
      <Button type="submit" variant="outline" disabled={!valid}>Add to meal</Button>
    </form>
  );
}
