import { cn } from "@/lib/utils";
import { ROLE_CONFIG } from "../../constants/admin.constants";
import { UserRole } from "../../types/admin.types";

export function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_CONFIG[role];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ring-1",
        c.bg,
        c.color,
        c.ring,
      )}
    >
      {c.label}
    </span>
  );
}