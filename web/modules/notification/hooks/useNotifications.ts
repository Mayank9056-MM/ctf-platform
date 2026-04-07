import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
import { useEffect, useMemo } from "react";
import { getSocket } from "@/shared/lib/socket";

/**
 * React Query hook for fetching the user's notification inbox.
 * Merges the server response with the optimistic dismissed/deleted
 * sets from the Zustand store, so the UI never flickers.
 * If the user has dismissed/soft-deleted a notification this session,
 * it will be filtered out of the response.
 *
 * @param {GetNotificationsFilters} [overrideFilters] - Optional filters to
 * override the default filters.
 * @returns {{ data: { notifications: Notification[], meta: NotificationListMeta }, ...useQuery }}
 */
export function useNotifications(overrideFilters?: GetNotificationsFilters) {
  const queryClient = useQueryClient();

  const storeState = useNotificationStore((s) => ({
    page: s.inboxPage,
    filter: s.inboxFilter,
    typeFilter: s.inboxTypeFilter,
  }));

  const { dismissedIds, deletedIds } = useOptimisticSets();

  const filters: GetNotificationsFilters = useMemo(() => {
    return (
      overrideFilters ?? {
        page: storeState.page,
        limit: 20,
        ...(storeState.filter === "unread" && { isRead: false }),
        ...(storeState.typeFilter !== "all" && {
          type: storeState.typeFilter as NotificationTypeValue,
        }),
        includeBroadcasts: true,
      }
    );
  }, [
    overrideFilters,
    storeState.page,
    storeState.filter,
    storeState.typeFilter,
  ]);

  const query = useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => getNotificationsApi(filters),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const socket = getSocket();

    function handleNewNotification() {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(filters),
      });
    }

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [queryClient, filters]);

  // Merge: filter out items dismissed/deleted this session (optimistic)
  const notifications = (query.data?.notifications ?? []).filter(
    (n) => !dismissedIds.has(n._id) && !deletedIds.has(n._id),
  );

  return { ...query, notifications, meta: query.data?.meta };
}
