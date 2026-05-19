import { cn } from "@/lib/utils";
import { AuthUser } from "@/modules/auth/types/auth.types";
import Image from "next/image";
import Link from "next/link";
import { USER_DROPDOWN_FOOTER, USER_DROPDOWN_ITEMS } from "../lib/navbar.config";
import { DropdownMenuItem } from "./DropdownMenuItem";
import { AdminPanelLink } from "./AdminPanelLink";
import { LogOut } from "lucide-react";

export function UserDropdown({
  user,
  isOpen,
  menuRef,
  onClose,
  onLogout,
  isLoggingOut,
}: {
  user: AuthUser;
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  if (!isOpen) return null;

  const isAdmin = user.role === "admin" || user.role === "superadmin";

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-2 w-64 animate-in fade-in slide-in-from-top-2 duration-150 rounded-2xl border border-white/[0.07] bg-[#0d1117]/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      {/* Header: avatar + username + email + role + score strip */}
      <div className="border-b border-white/[0.05] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/[0.08] ring-1 ring-white/[0.1]">
            {user.avatar?.url ? (
              <Image
                src={user.avatar.url}
                alt={user.username ?? "avatar"}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-mono text-sm font-semibold text-slate-300">
                {user.username?.slice(0, 2).toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-semibold text-white">
              {user.username ?? "anonymous"}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[9px] font-medium ring-1",
                  isAdmin
                    ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                )}
              >
                {user.role ?? "player"}
              </span>
              {!user.isVerified && (
                <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 font-mono text-[9px] text-orange-400 ring-1 ring-orange-500/20">
                  unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score strip */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2.5">
          <div className="text-center">
            <p className="font-mono text-base font-bold tabular-nums text-white">
              {(user.score ?? 0).toLocaleString()}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600">
              Score
            </p>
          </div>
          <div className="h-6 w-px bg-white/[0.06]" />
          <div className="text-center">
            <p className="font-mono text-base font-bold tabular-nums text-white">
              {user.solvedChallenges?.length ?? 0}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600">
              Solved
            </p>
          </div>
          <div className="h-6 w-px bg-white/[0.06]" />
          <Link
            href="/profile"
            onClick={onClose}
            className="font-mono text-[10px] text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Profile →
          </Link>
        </div>
      </div>

      {/* Admin panel link — only for admin / superadmin */}
      {isAdmin && (
        <div className="border-b border-white/[0.05] px-2 py-2">
          <AdminPanelLink role={user.role!} onClose={onClose} />
        </div>
      )}

      {/* Menu items */}
      <div className="px-2 py-2">
        {USER_DROPDOWN_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} item={item} onClose={onClose} />
        ))}
      </div>

      {/* Footer + logout */}
      <div className="border-t border-white/[0.05] px-2 py-2">
        {USER_DROPDOWN_FOOTER.map((item) => (
          <DropdownMenuItem key={item.href} item={item} onClose={onClose} />
        ))}
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-all hover:bg-red-500/[0.08] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <LogOut className="h-3.5 w-3.5 text-red-400" />
          </div>
          <span className="font-medium">
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </span>
        </button>
      </div>
    </div>
  );
}