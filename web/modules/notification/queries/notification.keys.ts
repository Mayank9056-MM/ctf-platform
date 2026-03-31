import { AdminNotificationFilters, GetNotificationsFilters } from "../types/notification.types";

const base = ["notifications"] as const;

export const notificationKeys = {
  all: base,

  /** Bell badge — unread count + previews */
  summary: () => [...base, "summary"] as const,

  /** Full inbox list with filters */
  lists: () => [...base, "list"] as const,
  list: (filters: GetNotificationsFilters) =>
    [...base, "list", filters] as const,

  /** Single notification detail */
  details: () => [...base, "detail"] as const,
  detail: (id: string) => [...base, "detail", id] as const,

  // Admin
  admin: {
    all: [...base, "admin"] as const,
    lists: () => [...base, "admin", "list"] as const,
    list: (filters: AdminNotificationFilters) =>
      [...base, "admin", "list", filters] as const,
    stats: () => [...base, "admin", "stats"] as const,
    detail: (id: string) => [...base, "admin", "detail", id] as const,
  },
} as const;
