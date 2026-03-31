import { useQuery } from "@tanstack/react-query";
import { adminGetNotificationStatsApi } from "../../api/notification.api";
import { notificationKeys } from "../../queries/notification.keys";

export function useAdminNotificationStats() {
  return useQuery({
    queryKey: notificationKeys.admin.stats(),
    queryFn: adminGetNotificationStatsApi,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
