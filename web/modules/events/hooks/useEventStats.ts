import { useQuery } from "@tanstack/react-query";
import { eventKeys } from "../queries/event.queries";
import { getEventStatsApi } from "../api/events.api";
import {
  EVENT_REFETCH_INTERVALS,
  EVENT_STALE,
} from "../constants/event.constants";

/**
 * Aggregate stats — solve counts, categories, hourly activity.
 * Used on the event detail page sidebar.
 */
export function useEventStats(eventId: string, enabled = true) {
  return useQuery({
    queryKey: eventKeys.stats(eventId),
    queryFn: () => getEventStatsApi(eventId),
    enabled: enabled && !!eventId,
    staleTime: EVENT_STALE.STATS,
    refetchInterval: EVENT_REFETCH_INTERVALS.LEADERBOARD,
    refetchIntervalInBackground: false,
  });
}
