import { useQuery } from "@tanstack/react-query";
import { notificationKeys } from "../queries/notification.keys";
import { getInboxSummaryApi } from "../api/notification.api";

/**
 * Bell badge — unread count + last 5 previews.
 * Polled every 30s so the badge stays fresh without WebSockets.
 * staleTime: 15s — short so a correct solve appears in the bell quickly.
 */
export function useInboxSummary() {
  return useQuery({
    queryKey: notificationKeys.summary(),
    queryFn: getInboxSummaryApi,
    staleTime: 1000 * 15, // 15s
    refetchInterval: 1000 * 30, // poll every 30s
    refetchIntervalInBackground: false, // don't poll when tab is hidden
  });
}
