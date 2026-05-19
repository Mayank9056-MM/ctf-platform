import { cn } from "@/lib/utils";
import { AuthUser } from "@/modules/auth/types/auth.types";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

export function UserButton({
  user,
  isOpen,
  onClick,
}: {
  user: AuthUser;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 transition-all duration-200",
        isOpen
          ? "border-emerald-500/30 bg-emerald-950/20"
          : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.05]",
      )}
      aria-expanded={isOpen}
      aria-label="User menu"
    >
      <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-white/[0.08] ring-1 ring-white/[0.1]">
        {user?.avatar?.url ? (
          <Image
            src={user.avatar.url}
            alt={user.username}
            fill
            className="object-cover"
            sizes="28px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] font-semibold text-slate-300">
            {user?.username?.slice(0, 2).toUpperCase() ?? "?"}
          </span>
        )}
      </div>
      <span className="hidden max-w-[96px] truncate font-mono text-[11px] font-medium text-slate-300 sm:block">
        {user?.username ?? "Guest"}
      </span>
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 text-slate-600 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
}