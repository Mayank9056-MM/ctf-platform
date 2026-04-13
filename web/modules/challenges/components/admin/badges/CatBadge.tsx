import { ADMIN_CHALLENGE_CAT_ICONS } from "@/modules/challenges/config/admin-challenge-ui.config";
import { ChallengeCategory } from "@/modules/challenges/types/challenge.types";
import { Hash } from "lucide-react";

/**
 * A badge component for displaying a challenge category.
 *
 * @param {{ category: ChallengeCategory }}
 * @returns {JSX.Element} A badge component with the category name and icon.
 */
export function CatBadge({ category }: { category: ChallengeCategory }) {
  const Icon = ADMIN_CHALLENGE_CAT_ICONS[category] ?? Hash;
  return (
    <span className="flex items-center gap-1 rounded-md border border-slate-700/60 bg-slate-800/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
      <Icon className="h-2.5 w-2.5" />
      {category}
    </span>
  );
}