import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAnnouncementStore } from "../../store/annoucement.store";
import { AdminAnnouncementFilters } from "../../types/announcement.types";
import { announcementKeys } from "../../queries/announcement.keys";
import { adminGetAnnouncementsApi } from "../../api/announcement.api";

/**
 * Admin list — all statuses (draft, published, retracted).
 * Reads filters from Zustand store so filter components stay in sync.
 */
export function useAdminAnnouncements(
  overrideFilters?: AdminAnnouncementFilters,
) {
  const storeFilters = useAnnouncementStore((s) => s.adminFilters);
  const filters = overrideFilters ?? storeFilters;

  return useQuery({
    queryKey: announcementKeys.admin.list(filters),
    queryFn: () => adminGetAnnouncementsApi(filters),
    staleTime: 1000 * 30, // 30s
    placeholderData: keepPreviousData,
  });
}
