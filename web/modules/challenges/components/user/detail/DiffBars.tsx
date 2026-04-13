import { CHALLENGE_DETAIL_DIFF_CONFIG } from "@/modules/challenges/config/challenge-detail-ui.config";
import { ChallengeDifficulty } from "@/modules/challenges/types/challenge.types";

/**
 * Displays a difficulty bar for a challenge.
 * The bar is composed of 4 segments, each representing a difficulty level.
 * The color of the bar is determined by the difficulty level.
 * @param {Object} props - The props to pass to the component.
 * @param {ChallengeDifficulty} props.difficulty - The difficulty level of the challenge.
 * @returns {JSX.Element} A JSX element representing the difficulty bar.
 */
export function DiffBars({ difficulty }: { difficulty: ChallengeDifficulty }) {
  const { color, bars } = CHALLENGE_DETAIL_DIFF_CONFIG[difficulty];
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="w-1.5 rounded-sm"
          style={{
            height: `${n * 4 + 4}px`,
            backgroundColor: n <= bars ? color : "#1e293b",
          }}
        />
      ))}
    </div>
  );
}
