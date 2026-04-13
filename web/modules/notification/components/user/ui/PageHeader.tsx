import { Bell } from "lucide-react";

export function PageHeader({ unreadCount }: { unreadCount: number }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 flex items-start justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
          <Bell className="h-6 w-6 text-emerald-400" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 font-mono text-[10px] font-bold text-slate-950 ring-2 ring-[#080c10]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-500/60">
            {"// Intel Feed"}
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
            Notifications
          </h1>
        </div>
      </div>
    </div>
  );
}