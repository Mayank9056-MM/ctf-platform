export function StatCard({
  icon: Icon,
  value,
  label,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="font-mono text-2xl font-bold tabular-nums text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mt-0.5">
        {label}
      </p>
    </div>
  );
}
