import { cn } from "@/lib/utils";
import { ADMIN_CHALLENGE_DIFF_CONFIG } from "@/modules/admin/config/admin-challenge-ui.config";
import { ChallengeDifficulty } from "@/modules/challenges/types/challenge.types";

export function DiffBadge({ difficulty }: { difficulty: ChallengeDifficulty }) {
  const d = ADMIN_CHALLENGE_DIFF_CONFIG[difficulty];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ring-1",
        d.bg,
        d.color,
        d.ring,
      )}
    >
      {d.label}
    </span>
  );
}