export function HeaderStats({
  total,
  completed,
  inProgress,
}: {
  total: number;
  completed: number;
  inProgress: number;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="font-mono text-xl font-bold tabular-nums text-white">
          {total}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
          Total
        </p>
      </div>
      <div className="h-6 w-px bg-white/[0.06]" />
      <div className="text-center">
        <p className="font-mono text-xl font-bold tabular-nums text-emerald-400">
          {completed}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
          Completed
        </p>
      </div>
      <div className="h-6 w-px bg-white/[0.06]" />
      <div className="text-center">
        <p className="font-mono text-xl font-bold tabular-nums text-blue-400">
          {inProgress}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
          Active
        </p>
      </div>
    </div>
  );
}
