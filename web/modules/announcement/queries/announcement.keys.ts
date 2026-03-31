import type {
  AdminAnnouncementFilters,
  AnnouncementFeedFilters,
} from "../types/announcement.types";

const base = ["announcements"] as const;
const adminBase = [...base, "admin"] as const;

export const announcementKeys = {
  all: base,

  // Player
  feeds: () => [...base, "feed"] as const,
  feed: (filters: AnnouncementFeedFilters) =>
    [...base, "feed", filters] as const,

  challengeFeed: (challengeId: string) =>
    [...base, "challenge-feed", challengeId] as const,

  // Admin
  admin: {
    all: adminBase,
    lists: () => [...adminBase, "list"] as const,
    list: (filters: AdminAnnouncementFilters) =>
      [...adminBase, "list", filters] as const,
    stats: () => [...adminBase, "stats"] as const,
    detail: (id: string) =>
      [...adminBase, "detail", id] as const,
  },
} as const;