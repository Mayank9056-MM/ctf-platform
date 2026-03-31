import { useQuery } from "@tanstack/react-query";
import { notificationKeys } from "../queries/notification.keys";
import { getNotificationByIdApi } from "../api/notification.api";

export function useNotificationById(id: string, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => getNotificationByIdApi(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60,
  });
}
