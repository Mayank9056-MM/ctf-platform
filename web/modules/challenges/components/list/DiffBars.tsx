import { DIFF_CONFIG } from "../../config/challenge-list-ui.config";
import { ChallengeDifficulty } from "../../types/challenge.types";

export function DiffBars({ difficulty }: { difficulty: ChallengeDifficulty }) {
  const cfg = DIFF_CONFIG[difficulty];
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="w-1 rounded-sm transition-all"
          style={{
            height: `${n * 3 + 4}px`,
            backgroundColor: n <= cfg.bars ? cfg.color : "#1e293b",
          }}
        />
      ))}
    </div>
  );
}