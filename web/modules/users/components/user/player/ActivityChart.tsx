export function ActivityChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-3">
        30-day Activity
      </p>
      <div className="flex h-12 items-end gap-0.5">
        {Array.from({ length: 30 }).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          const dateStr = date.toISOString().slice(0, 10);
          const entry = data.find((d) => d.date === dateStr);
          const h = entry ? Math.max(8, (entry.count / max) * 100) : 0;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              title={entry ? `${entry.count} on ${dateStr}` : dateStr}
              style={{
                height: `${h}%`,
                backgroundColor:
                  h > 0
                    ? entry!.count >= max * 0.6
                      ? "#f59e0b"
                      : "#78350f"
                    : "transparent",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
