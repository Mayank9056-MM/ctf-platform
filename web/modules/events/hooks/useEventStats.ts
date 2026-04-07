import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eventKeys } from "../queries/event.queries";
import { getEventStatsApi } from "../api/events.api";
// import {
//   EVENT_REFETCH_INTERVALS,
//   EVENT_STALE,
// } from "../constants/event.constants";
import { useEffect } from "react";
import { getSocket } from "@/shared/lib/socket";

/**
 * Aggregate stats — solve counts, categories, hourly activity.
 * Used on the event detail page sidebar.
 */
export function useEventStats(eventId: string, enabled = true) {
  const queryClient = useQueryClient();

  const queryKey = eventKeys.stats(eventId);

  useEffect(() => {
    const socket = getSocket();

    if (!socket || !eventId) return;

    const handler = (data: { eventId?: string }) => {
      if (data.eventId === eventId) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    socket.on("leaderboard:updated", handler);

    return () => {
      socket.off("leaderboard:updated", handler);
    };
  }, [eventId, queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: () => getEventStatsApi(eventId),
    enabled: enabled && !!eventId,
    // staleTime: EVENT_STALE.STATS,
    // refetchInterval: EVENT_REFETCH_INTERVALS.LEADERBOARD,
    staleTime: Infinity,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
}
