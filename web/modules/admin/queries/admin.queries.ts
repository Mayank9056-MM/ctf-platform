import type {
  AdminListFilters,
  AdminUserFilters,
  AuditLogFilters,
} from "../types/admin.types";

const base = ["admin"] as const;

export const adminKeys = {
  all: base,

  dashboard: () => [...base, "dashboard"] as const,

  users: {
    all: [...base, "users"] as const,
    lists: () => [...base, "users", "list"] as const,
    list: (f: AdminUserFilters) => [...base, "users", "list", f] as const,
    detail: (id: string) => [...base, "users", "detail", id] as const,
  },

  admins: {
    all: [...base, "admins"] as const,
    lists: () => [...base, "admins", "list"] as const,
    list: (f: AdminListFilters) => [...base, "admins", "list", f] as const,
  },

  auditLogs: {
    all: [...base, "audit"] as const,
    lists: () => [...base, "audit", "list"] as const,
    list: (f: AuditLogFilters) => [...base, "audit", "list", f] as const,
    detail: (id: string) => [...base, "audit", "detail", id] as const,
  },
} as const;
