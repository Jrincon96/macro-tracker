"use client";

import { useState } from "react";
import { NativeSelect } from "@/components/ui/native-select";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (year: number, month: number) => new Date(year || 2000, month, 0).getDate();

/**
 * Month / day / year dropdowns instead of <input type="date">: picking a birth year
 * in a calendar means scrolling back decades. Native selects open the iOS wheel on iPhone
 * and support type-to-jump ("1996") on desktop. Submits a hidden YYYY-MM-DD field.
 */
export function BirthDateSelect({
  name,
  defaultValue,
  onChange,
  minAge = 16,
  maxAge = 100,
}: {
  name: string;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  minAge?: number;
  maxAge?: number;
}) {
  const [y0, m0, d0] = (defaultValue ?? "").split("-").map(Number);
  const [year, setYear] = useState(y0 || 0);
  const [month, setMonth] = useState(m0 || 0);
  const [day, setDay] = useState(d0 || 0);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: maxAge - minAge + 1 }, (_, i) => thisYear - minAge - i);
  const maxDay = month ? daysIn(year, month) : 31;

  function update(next: { year?: number; month?: number; day?: number }) {
    const y = next.year ?? year;
    const m = next.month ?? month;
    let d = next.day ?? day;
    if (m && d > daysIn(y, m)) d = daysIn(y, m); // e.g. Feb 31 → Feb 28/29
    setYear(y);
    setMonth(m);
    setDay(d);
    onChange?.(y && m && d ? `${y}-${pad(m)}-${pad(d)}` : "");
  }

  const value = year && month && day ? `${year}-${pad(month)}-${pad(day)}` : "";

  return (
    <div className="grid grid-cols-[1.2fr_1fr_1.3fr] gap-2">
      <input type="hidden" name={name} value={value} />
      <NativeSelect aria-label="Birth month" value={month || ""} required
        onChange={(e) => update({ month: Number(e.target.value) })}>
        <option value="" disabled>Month</option>
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </NativeSelect>
      <NativeSelect aria-label="Birth day" value={day || ""} required
        onChange={(e) => update({ day: Number(e.target.value) })}>
        <option value="" disabled>Day</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
      </NativeSelect>
      <NativeSelect aria-label="Birth year" value={year || ""} required
        onChange={(e) => update({ year: Number(e.target.value) })}>
        <option value="" disabled>Year</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </NativeSelect>
    </div>
  );
}
