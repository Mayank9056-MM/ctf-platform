import { Crown, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export function AdminPanelLink({
  role,
  onClose,
}: {
  role: string;
  onClose: () => void;
}) {
  const isSuperAdmin = role === "superadmin";
  return (
    <Link
      href="/admin"
      onClick={onClose}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-amber-500/[0.06]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
        {isSuperAdmin ? (
          <Crown className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <LayoutDashboard className="h-3.5 w-3.5 text-amber-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-300 transition-colors group-hover:text-amber-200">
          Admin Dashboard
        </p>
        <p className="text-[11px] capitalize text-slate-600">{role}</p>
      </div>
    </Link>
  );
}