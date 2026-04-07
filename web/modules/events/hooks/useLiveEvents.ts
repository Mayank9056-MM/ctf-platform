import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eventKeys } from "../queries/event.queries";
import { getEventsApi } from "../api/events.api";
// import {
//   EVENT_REFETCH_INTERVALS,
//   EVENT_STALE,
// } from "../constants/event.constants";
import { useEffect } from "react";
import { getSocket } from "@/shared/lib/socket";

/**
 * Convenience hook — only active events, sorted by opensAt.
 * Used on the dashboard widget.
 */
export function useLiveEvents() {
  const queryClient = useQueryClient();

  const queryKey = eventKeys.list({
    status: "active",
    limit: 3,
    sortBy: "opensAt",
    sortOrder: "asc",
  });

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handler = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    socket.on("event:status_changed", handler);

    return () => {
      socket.off("event:status_changed", handler);
    };
  }, [queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: () =>
      getEventsApi({
        status: "active",
        limit: 3,
        sortBy: "opensAt",
        sortOrder: "asc",
      }),
    // staleTime: EVENT_STALE.LIST,  // normal
    // refetchInterval: EVENT_REFETCH_INTERVALS.LIVE_LIST,
    staleTime: Infinity,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
}
