import { Target } from "lucide-react";

/**
 * PageHeader component for challenges page
 *
 * @param {Object} props - props object
 * @param {number} props.total - total number of challenges
 * @param {number} props.solved - total number of solved challenges
 *
 * @returns {JSX.Element} - JSX element for page header
 */
export function PageHeader({
  total,
  solved,
}: {
  total: number;
  solved: number;
}) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const circumference = 2 * Math.PI * 14;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 flex flex-wrap items-start justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
          <Target className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-500/60">
            {"// Mission Board"}
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
            Challenges
          </h1>
        </div>
      </div>

      {/* Progress ring */}
      {total > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <svg width="34" height="34" className="-rotate-90">
            <circle
              cx="17"
              cy="17"
              r="14"
              fill="none"
              stroke="#1a2e1a"
              strokeWidth="3"
            />
            <circle
              cx="17"
              cy="17"
              r="14"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div>
            <p className="font-mono text-sm font-bold text-white tabular-nums">
              {solved}
              <span className="text-slate-600">/{total}</span>
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
              {pct}% complete
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
