import { Ban, CheckCircle2 } from "lucide-react";

export function StatusBadge({
  isBanned,
  isVerified,
}: {
  isBanned: boolean;
  isVerified: boolean;
}) {
  if (isBanned)
    return (
      <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-400 ring-1 ring-red-500/20">
        <Ban className="h-2.5 w-2.5" />
        Banned
      </span>
    );
  if (!isVerified)
    return (
      <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-mono text-[10px] text-orange-400 ring-1 ring-orange-500/20">
        Unverified
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400 ring-1 ring-emerald-500/20">
      <CheckCircle2 className="h-2.5 w-2.5" />
      Active
    </span>
  );
}