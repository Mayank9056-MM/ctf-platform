import { cn } from "@/lib/utils";
import { NODE_TYPE_CONFIG } from "@/modules/story/config/admin-editor-ui.config";
import { StoryNodeType } from "@/modules/story/types/story.types";

export function NodeTypeBadge({ type }: { type: StoryNodeType }) {
  const c = NODE_TYPE_CONFIG[type];
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ring-1",
        c.bg,
        c.color,
        c.ring,
      )}
    >
      <c.Icon className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}
