import { describe, expect, it } from "vitest";
import { addDays, formatDayLabel, hourIn, parseDateParam, todayIn } from "@/lib/dates";
import { defaultMealType } from "@/app/(app)/log/draft";

// 2026-11-28 03:30 UTC = still Nov 27 in New York (22:30).
const now = new Date("2026-11-28T03:30:00Z");

describe("dates", () => {
  it("computes today in the user's timezone, not UTC", () => {
    expect(todayIn("America/New_York", now)).toBe("2026-11-27");
    expect(todayIn("Europe/Madrid", now)).toBe("2026-11-28");
  });
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });
  it("accepts valid date params and falls back to today", () => {
    expect(parseDateParam("2026-11-20", "UTC")).toBe("2026-11-20");
    expect(parseDateParam("garbage", "UTC")).toBe(todayIn("UTC"));
    expect(parseDateParam(["2026-11-20"], "UTC")).toBe(todayIn("UTC"));
  });
  it("labels nearby days", () => {
    expect(formatDayLabel("2026-11-27", "America/New_York", now)).toBe("Today");
    expect(formatDayLabel("2026-11-26", "America/New_York", now)).toBe("Yesterday");
    expect(formatDayLabel("2026-11-20", "America/New_York", now)).toBe("Fri, Nov 20");
  });
  it("picks a meal from the local hour", () => {
    expect(hourIn("America/New_York", now)).toBe(22);
    expect([7, 12, 19, 23].map(defaultMealType)).toEqual(["breakfast", "lunch", "dinner", "snack"]);
  });
});
