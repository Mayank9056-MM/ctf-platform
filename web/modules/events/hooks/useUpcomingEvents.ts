import { useQuery } from "@tanstack/react-query";
import { eventKeys } from "../queries/event.queries";
import { getEventsApi } from "../api/events.api";
import {
  EVENT_REFETCH_INTERVALS,
  EVENT_STALE,
} from "../constants/event.constants";

/**
 * Convenience hook — only scheduled events.
 */
export function useUpcomingEvents() {
  return useQuery({
    queryKey: eventKeys.list({
      status: "scheduled",
      limit: 4,
      sortBy: "opensAt",
      sortOrder: "asc",
    }),
    queryFn: () =>
      getEventsApi({
        status: "scheduled",
        limit: 4,
        sortBy: "opensAt",
        sortOrder: "asc",
      }),
    staleTime: EVENT_STALE.LIST,
    refetchInterval: EVENT_REFETCH_INTERVALS.LIVE_LIST,
    refetchIntervalInBackground: false,
  });
}
