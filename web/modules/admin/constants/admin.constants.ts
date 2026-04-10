import { UserRole } from "../types/admin.types";

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; color: string; bg: string; ring: string }
> = {
  superadmin: {
    label: "Superadmin",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
  },
  admin: {
    label: "Admin",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
  },
  user: {
    label: "User",
    color: "text-slate-400",
    bg: "bg-slate-700/40",
    ring: "ring-slate-700/50",
  },
};

export const SORT_OPTIONS = [
  { value: "createdAt", label: "Join date" },
  { value: "lastActive", label: "Last active" },
  { value: "score", label: "Score" },
  { value: "username", label: "Username" },
  { value: "email", label: "Email" },
] as const;

export const PAGE_SIZES = [10, 20, 50, 100];