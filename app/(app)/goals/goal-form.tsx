"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { BirthDateSelect } from "@/components/birth-date-select";
import {
  ACTIVITY_LABELS, ACTIVITY_LEVELS, ageOn, GOAL_RULES, GOALS, kcalFromMacros, targetsFor, tdee,
  type ActivityLevel, type Goal, type Sex,
} from "@/lib/macros";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/macros/units";
import { saveGoal, type SaveGoalState } from "./actions";

export type GoalFormDefaults = {
  units: "imperial" | "metric";
  sex: Sex | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activity: ActivityLevel;
  goal: Goal | null;
  custom: { protein_g: number; carbs_g: number; fat_g: number } | null;
};

const toNum = (s: string) => (s.trim() === "" ? NaN : Number(s));

export function GoalForm({ defaults }: { defaults: GoalFormDefaults }) {
  const [state, action, pending] = useActionState<SaveGoalState, FormData>(saveGoal, {});

  const ftIn = defaults.heightCm ? cmToFtIn(defaults.heightCm) : null;
  const [units, setUnits] = useState(defaults.units);
  const [sex, setSex] = useState<Sex | "">(defaults.sex ?? "");
  const [birthDate, setBirthDate] = useState(defaults.birthDate ?? "");
  const [heightFt, setHeightFt] = useState(ftIn ? String(ftIn.ft) : "");
  const [heightIn, setHeightIn] = useState(ftIn ? String(ftIn.in) : "");
  const [heightCm, setHeightCm] = useState(defaults.heightCm ? String(Math.round(defaults.heightCm)) : "");
  const [weight, setWeight] = useState(
    defaults.weightKg ? String(Math.round((defaults.units === "imperial" ? kgToLb(defaults.weightKg) : defaults.weightKg) * 10) / 10) : "",
  );
  const [activity, setActivity] = useState<ActivityLevel>(defaults.activity);
  const [goal, setGoal] = useState<Goal>(defaults.goal ?? "fat_loss");
  const [customize, setCustomize] = useState(Boolean(defaults.custom));
  const [custom, setCustom] = useState({
    protein_g: defaults.custom ? String(defaults.custom.protein_g) : "",
    carbs_g: defaults.custom ? String(defaults.custom.carbs_g) : "",
    fat_g: defaults.custom ? String(defaults.custom.fat_g) : "",
  });

  function switchUnits(next: "imperial" | "metric") {
    if (next === units) return;
    const w = toNum(weight);
    if (next === "metric") {
      const cm = ftInToCm(toNum(heightFt) || 0, toNum(heightIn) || 0);
      if (cm > 0) setHeightCm(String(Math.round(cm)));
      if (!Number.isNaN(w)) setWeight(String(Math.round(lbToKg(w) * 10) / 10));
    } else {
      const cm = toNum(heightCm);
      if (!Number.isNaN(cm)) {
        const fi = cmToFtIn(cm);
        setHeightFt(String(fi.ft));
        setHeightIn(String(fi.in));
      }
      if (!Number.isNaN(w)) setWeight(String(Math.round(kgToLb(w) * 10) / 10));
    }
    setUnits(next);
  }

  // Live recommendation from the same math the server uses.
  const preview = useMemo(() => {
    const hCm = units === "imperial" ? ftInToCm(toNum(heightFt) || 0, toNum(heightIn) || 0) : toNum(heightCm);
    const wKg = units === "imperial" ? lbToKg(toNum(weight)) : toNum(weight);
    if (!sex || !birthDate || !(hCm >= 100) || !(wKg >= 30)) return null;
    const stats = { sex, age: ageOn(birthDate), heightCm: hCm, weightKg: wKg, activity };
    if (!(stats.age >= 16)) return null;
    return { tdee: Math.round(tdee(stats)), targets: targetsFor(stats, goal) };
  }, [units, sex, birthDate, heightFt, heightIn, heightCm, weight, activity, goal]);

  function startCustomizing() {
    if (!custom.protein_g && preview) {
      setCustom({
        protein_g: String(preview.targets.protein_g),
        carbs_g: String(preview.targets.carbs_g),
        fat_g: String(preview.targets.fat_g),
      });
    }
    setCustomize(true);
  }

  const customKcal = kcalFromMacros({
    protein_g: toNum(custom.protein_g) || 0,
    carbs_g: toNum(custom.carbs_g) || 0,
    fat_g: toNum(custom.fat_g) || 0,
  });
  const shown = customize
    ? { kcal: customKcal, protein_g: toNum(custom.protein_g) || 0, carbs_g: toNum(custom.carbs_g) || 0, fat_g: toNum(custom.fat_g) || 0 }
    : preview?.targets;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="units" value={units} />
      <input type="hidden" name="timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">About you</h2>
          <div className="flex rounded-lg border p-0.5 text-xs">
            {(["imperial", "metric"] as const).map((u) => (
              <button key={u} type="button" onClick={() => switchUnits(u)}
                className={`rounded-md px-2 py-1 ${units === u ? "bg-primary text-primary-foreground" : ""}`}>
                {u === "imperial" ? "lb / ft" : "kg / cm"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sex">Sex</Label>
          <NativeSelect id="sex" name="sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)} required>
            <option value="" disabled>Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Birth date</Label>
          <BirthDateSelect name="birth_date" defaultValue={defaults.birthDate} onChange={setBirthDate} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {units === "imperial" ? (
            <div className="flex flex-col gap-1.5">
              <Label>Height</Label>
              <div className="flex gap-2">
                <Input name="height_ft" inputMode="numeric" placeholder="ft" aria-label="Feet"
                  value={heightFt} onChange={(e) => setHeightFt(e.target.value)} required />
                <Input name="height_in" inputMode="numeric" placeholder="in" aria-label="Inches"
                  value={heightIn} onChange={(e) => setHeightIn(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="height_cm">Height (cm)</Label>
              <Input id="height_cm" name="height_cm" inputMode="numeric"
                value={heightCm} onChange={(e) => setHeightCm(e.target.value)} required />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weight">Weight ({units === "imperial" ? "lb" : "kg"})</Label>
            <Input id="weight" name="weight" inputMode="decimal"
              value={weight} onChange={(e) => setWeight(e.target.value)} required />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity_level">Activity</Label>
          <NativeSelect id="activity_level" name="activity_level" value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
            {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{ACTIVITY_LABELS[a]}</option>)}
          </NativeSelect>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Goal</h2>
        <div className="flex flex-col gap-2">
          {GOALS.map((g) => (
            <label key={g}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${goal === g ? "border-primary bg-primary/5" : ""}`}>
              <input type="radio" name="goal" value={g} checked={goal === g}
                onChange={() => setGoal(g)} className="mt-1 accent-primary" />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{GOAL_RULES[g].label}</span>
                <span className="text-xs text-muted-foreground">{GOAL_RULES[g].description}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Daily targets</h2>
          {preview && <span className="text-xs text-muted-foreground">Maintenance ≈ {preview.tdee} kcal</span>}
        </div>

        {shown ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="kcal" value={shown.kcal} />
            <Stat label="Protein" value={shown.protein_g} unit="g" />
            <Stat label="Carbs" value={shown.carbs_g} unit="g" />
            <Stat label="Fat" value={shown.fat_g} unit="g" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Fill in your details to see recommended targets.</p>
        )}

        {customize ? (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <input type="hidden" name="customize" value="on" />
            <div className="grid grid-cols-3 gap-2">
              {(["protein_g", "carbs_g", "fat_g"] as const).map((k) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <Label htmlFor={k}>{k === "protein_g" ? "Protein" : k === "carbs_g" ? "Carbs" : "Fat"} (g)</Label>
                  <Input id={k} name={k} inputMode="numeric" value={custom[k]}
                    onChange={(e) => setCustom({ ...custom, [k]: e.target.value })} required />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Calories are calculated from your macros.</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCustomize(false)}>
              Use recommended targets
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startCustomizing} disabled={!preview}>
            Customize macros
          </Button>
        )}
      </section>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && !pending && <p className="text-sm text-emerald-600">Saved. Your new targets are live.</p>}
      <Button type="submit" size="lg" disabled={pending || !shown}>
        {pending ? "Saving…" : "Save goal"}
      </Button>
    </form>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <div className="text-lg font-semibold tabular-nums">{Math.round(value)}{unit}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
