import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/queries/dashboard.keys";
import { useQuery } from "@tanstack/react-query";
import { getAnnouncementsApi } from "../api/announcement.api";
import { DASHBOARD_STALE_TIMES } from "@/modules/dashboard/constants/dashboard.constant";

export function useAnnouncements(page = 1) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.announcements(page),
    queryFn: () => getAnnouncementsApi(page, 5),
    staleTime: DASHBOARD_STALE_TIMES.announcements,
  });
}