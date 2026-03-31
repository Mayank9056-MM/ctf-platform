import { useQuery } from "@tanstack/react-query";
import { adminGetNotificationByIdApi } from "../../api/notification.api";
import { notificationKeys } from "../../queries/notification.keys";

export function useAdminNotificationDetail(id: string | null, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.admin.detail(id ?? ""),
    queryFn: () => adminGetNotificationByIdApi(id!),
    enabled: enabled && !!id,
    staleTime: 1000 * 60,
  });
}
