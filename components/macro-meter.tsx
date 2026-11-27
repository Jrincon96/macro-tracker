/** One macro against its daily target: label + numbers on top, a meter below. */
export function MacroMeter({
  label,
  eaten,
  target,
  unit = "g",
  overIsGood = false,
}: {
  label: string;
  eaten: number;
  target: number;
  unit?: string;
  /** Protein: reaching or passing the target is the goal, not a problem. */
  overIsGood?: boolean;
}) {
  const pct = target > 0 ? Math.min(eaten / target, 1) : 0;
  const diff = Math.round(target - eaten);
  const over = diff < 0;
  const hit = overIsGood && diff <= 0;

  const fill = hit ? "var(--viz-good)" : over ? "var(--viz-serious)" : "var(--viz-fill)";
  const status = hit ? "✓ Target hit" : over ? `▲ ${Math.abs(diff)}${unit} over` : `${diff}${unit} left`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          <span className="text-foreground">{Math.round(eaten)}</span> / {target}{unit}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.round(eaten)}
        aria-valuetext={`${Math.round(eaten)} of ${target}${unit}, ${status}`}
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--viz-track)" }}
      >
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct * 100}%`, background: fill }} />
      </div>
      <span className="text-xs text-muted-foreground">{status}</span>
    </div>
  );
}
