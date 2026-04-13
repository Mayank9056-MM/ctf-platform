import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/modules/story/config/admin-list-ui.config";
import { StoryStatus } from "@/modules/story/types/story.types";

export function StatusBadge({ status }: { status: StoryStatus }) {
  const s = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ring-1",
        s.bg,
        s.color,
        s.ring,
      )}
    >
      <s.Icon className="h-2.5 w-2.5" />
      {s.label}
    </span>
  );
}
