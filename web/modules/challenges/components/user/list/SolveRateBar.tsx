export function SolveRateBar({
  solveCount,
  totalAttempts,
}: {
  solveCount: number;
  totalAttempts: number;
}) {
  const rate = totalAttempts > 0 ? (solveCount / totalAttempts) * 100 : 0;
  return (
    <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max(rate, 2)}%`, backgroundColor: "#34d39960" }}
      />
    </div>
  );
}
