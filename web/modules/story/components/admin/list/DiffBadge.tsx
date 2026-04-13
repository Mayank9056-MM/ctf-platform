import { cn } from "@/lib/utils";
import { DIFF_CONFIG } from "@/modules/story/config/admin-list-ui.config";
import { StoryDifficulty } from "@/modules/story/types/story.types";

export function DiffBadge({ difficulty }: { difficulty: StoryDifficulty }) {
  const d = DIFF_CONFIG[difficulty];
  return (
    <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ring-1", d.bg, d.color, d.ring)}>
      <d.Icon className="h-2.5 w-2.5" />
      {d.label}
    </span>
  );
}