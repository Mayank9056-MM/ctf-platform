import { useQuery } from "@tanstack/react-query";
import { announcementKeys } from "../../queries/announcement.keys";
import { adminGetAnnouncementStatsApi } from "../../api/announcement.api";

/**
 * Aggregate stats for the admin dashboard.
 */
export function useAdminAnnouncementStats() {
  return useQuery({
    queryKey: announcementKeys.admin.stats(),
    queryFn: adminGetAnnouncementStatsApi,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
