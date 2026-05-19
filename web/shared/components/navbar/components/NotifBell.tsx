import { Bell } from "lucide-react";
import Link from "next/link";

export function NotifBell({ count }: { count: number }) {
  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 transition-all hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-slate-200"
      aria-label={`${count} unread notifications`}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 font-mono text-[9px] font-bold text-slate-950 ring-2 ring-[#080c10]">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
