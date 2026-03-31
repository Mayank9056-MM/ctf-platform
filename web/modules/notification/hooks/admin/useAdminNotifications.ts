import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNotificationStore } from "../../store/notification.store";
import { AdminNotificationFilters } from "../../types/notification.types";
import { notificationKeys } from "../../queries/notification.keys";
import { adminGetNotificationsApi } from "../../api/notification.api";

 
/**
 * Admin paginated log of all notifications.
 * Reads filters from the Zustand store — filter controls bind to the store directly.
 */
export function useAdminNotifications(
  overrideFilters?: AdminNotificationFilters
) {
  const storeFilters = useNotificationStore((s) => s.adminFilters);
  const filters = overrideFilters ?? storeFilters;
 
  return useQuery({
    queryKey: notificationKeys.admin.list(filters),
    queryFn: () => adminGetNotificationsApi(filters),
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}