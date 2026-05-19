import Link from "next/link";
import { NavItem } from "../types/navbar.types";
import { cn } from "@/lib/utils";

export function NavLink({
  item,
  isActive,
  liveCount,
}: {
  item: NavItem;
  isActive: boolean;
  liveCount?: number;
}) {
  const Icon = item.icon;
  const showLive = item.href === "/events" && (liveCount ?? 0) > 0;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-emerald-500/10 text-emerald-300"
          : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-emerald-400" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 transition-colors",
          isActive
            ? "text-emerald-400"
            : "text-slate-600 group-hover:text-slate-300",
        )}
      />
      {item.label}
      {showLive && (
        <span className="flex items-center gap-0.5 rounded-full bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] text-red-400 ring-1 ring-red-500/20">
          <span className="h-1 w-1 animate-pulse rounded-full bg-red-400" />
          {liveCount}
        </span>
      )}
    </Link>
  );
}
