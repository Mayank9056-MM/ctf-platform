export function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-xl mb-2"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-mono text-xl font-bold tabular-nums text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mt-0.5">
        {label}
      </p>
    </div>
  );
}
