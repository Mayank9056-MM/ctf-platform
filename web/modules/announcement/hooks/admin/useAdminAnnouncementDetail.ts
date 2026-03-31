import { useQuery } from "@tanstack/react-query";
import { adminGetAnnouncementByIdApi } from "../../api/announcement.api";
import { announcementKeys } from "../../queries/announcement.keys";

/**
 * Full announcement detail for the admin edit form.
 * Only fetches when an ID is selected.
 */
export function useAdminAnnouncementDetail(id: string | null, enabled = true) {
  return useQuery({
    queryKey: announcementKeys.admin.detail(id ?? ""),
    queryFn: () => adminGetAnnouncementByIdApi(id!),
    enabled: enabled && !!id,
    staleTime: 1000 * 60, // 1 min
  });
}
