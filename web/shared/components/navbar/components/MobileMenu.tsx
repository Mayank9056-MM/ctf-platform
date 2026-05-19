import Image from "next/image";
import { useNavbar } from "../hooks/useNavbar";
import { NAV_ITEMS, USER_DROPDOWN_ITEMS } from "../lib/navbar.config";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Crown, LayoutDashboard, LogOut, X } from "lucide-react";
import { Logo } from "./Logo";

export function MobileMenu({
  isOpen,
  user,
  isActive,
  liveCount,
  onClose,
  onLogout,
  isLoggingOut,
}: {
  isOpen: boolean;
  user: ReturnType<typeof useNavbar>["user"];
  isActive: (href: string) => boolean;
  liveCount: number;
  onClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  if (!isOpen) return null;

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] animate-in slide-in-from-left duration-200">
        <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#0a0e15]/98 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <Logo variant="app" onClick={onClose} />
            <button
              onClick={onClose}
              className="rounded-xl border border-white/[0.06] p-2 text-slate-500 transition-colors hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User info strip */}
          {user && (
            <div className="border-b border-white/[0.05] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/[0.08] ring-1 ring-white/[0.1]">
                  {user.avatar?.url ? (
                    <Image
                      src={user.avatar.url}
                      alt={user.username}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-mono text-sm font-bold text-slate-300">
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-mono text-sm font-semibold text-white">
                      {user.username}
                    </p>
                    {isAdmin && (
                      <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] capitalize text-amber-400 ring-1 ring-amber-500/20">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {(user.score ?? 0).toLocaleString()} pts
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="font-mono text-xs text-slate-500">
                      {user.solvedChallenges?.length ?? 0} solved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav links */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
              Navigation
            </p>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    isActive(item.href) ? "text-emerald-400" : "text-slate-600",
                  )}
                />
                {item.label}
                {item.href === "/events" && liveCount > 0 && (
                  <span className="ml-auto flex items-center gap-0.5 rounded-full bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] text-red-400">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-red-400" />
                    {liveCount}
                  </span>
                )}
              </Link>
            ))}

            {/* Admin section — mobile */}
            {isAdmin && user && (
              <>
                <p className="px-3 pb-1 pt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
                  Admin
                </p>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive("/admin")
                      ? "bg-amber-500/10 text-amber-300"
                      : "text-slate-500 hover:bg-amber-500/[0.06] hover:text-amber-300",
                  )}
                >
                  {user.role === "superadmin" ? (
                    <Crown
                      className={cn(
                        "h-4 w-4",
                        isActive("/admin")
                          ? "text-amber-400"
                          : "text-slate-600",
                      )}
                    />
                  ) : (
                    <LayoutDashboard
                      className={cn(
                        "h-4 w-4",
                        isActive("/admin")
                          ? "text-amber-400"
                          : "text-slate-600",
                      )}
                    />
                  )}
                  Admin Dashboard
                  {isActive("/admin") && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              </>
            )}

            <p className="px-3 pb-1 pt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
              Account
            </p>
            {USER_DROPDOWN_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-white/[0.04] hover:text-slate-200"
              >
                <item.icon className="h-4 w-4 text-slate-600" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-white/[0.05] px-3 py-4">
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/[0.08] hover:text-red-300 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
