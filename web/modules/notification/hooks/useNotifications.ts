import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  useNotificationStore,
  useOptimisticSets,
} from "../store/notification.store";
import {
  GetNotificationsFilters,
  NotificationTypeValue,
} from "../types/notification.types";
import { notificationKeys } from "../queries/notification.keys";
import { getNotificationsApi } from "../api/notification.api";

/**
 * Full inbox list. Merges server data with optimistic dismiss/delete sets
 * so the UI never flickers when an action is in-flight.
 *
 * Reads filters from the Zustand store so filter controls stay in sync.
 */
export function useNotifications(overrideFilters?: GetNotificationsFilters) {
  const storeState = useNotificationStore((s) => ({
    page: s.inboxPage,
    filter: s.inboxFilter,
    typeFilter: s.inboxTypeFilter,
  }));

  const { dismissedIds, deletedIds } = useOptimisticSets();

  const filters: GetNotificationsFilters = overrideFilters ?? {
    page: storeState.page,
    limit: 20,
    ...(storeState.filter === "unread" && { isRead: false }),
    ...(storeState.typeFilter !== "all" && {
      type: storeState.typeFilter as NotificationTypeValue,
    }),
    includeBroadcasts: true,
  };

  const query = useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => getNotificationsApi(filters),
    staleTime: 1000 * 15,
    placeholderData: keepPreviousData,
  });

  // Merge: filter out items dismissed/deleted this session (optimistic)
  const notifications = (query.data?.notifications ?? []).filter(
    (n) => !dismissedIds.has(n._id) && !deletedIds.has(n._id),
  );

  return { ...query, notifications, meta: query.data?.meta };
}
