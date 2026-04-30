import { cn } from "@/lib/utils";
import { NODE_TYPE_CONFIG } from "@/modules/story/config/user-detail-ui.config";

export function NodeTypeBadge({ type }: { type: string }) {
  const cfg = NODE_TYPE_CONFIG[type] ?? NODE_TYPE_CONFIG.cutscene;
  const Icon = cfg.icon;
  return (
    <div className={cn("flex items-center gap-1 rounded-md px-1.5 py-0.5 ring-1 ring-inset", cfg.bg, "ring-white/10")}>
      <Icon className={cn("h-2.5 w-2.5", cfg.color)} />
      <span className={cn("font-mono text-[8px] font-bold uppercase tracking-wide", cfg.color)}>
        {cfg.label}
      </span>
    </div>
  );
}