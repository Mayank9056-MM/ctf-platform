import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getEventsApi } from "../api/events.api";
import { useEventListState } from "../store/event.store";
import { EventListFilters } from "../types/event.type";
import { eventKeys } from "../queries/event.queries";
// import {
//   EVENT_REFETCH_INTERVALS,
//   EVENT_STALE,
// } from "../constants/event.constants";
import { useEffect, useMemo } from "react";
import { getSocket } from "@/shared/lib/socket";

/**
 * Hook to fetch the event list. Merges filters from the store with the override parameter.
 * Listens to the "event:status_changed" socket event to invalidate the query when an event status changes.
 * @param override EventListFilters - overrides the filters from the store
 * @returns The result of the query
 */
export function useEvents(override?: EventListFilters) {
  const { page, statusFilter, formatFilter, search, sortBy, sortOrder } =
    useEventListState();

  const queryClient = useQueryClient();

  const filters: EventListFilters = useMemo(() => {
    return (
      override ?? {
        page,
        limit: 12,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(formatFilter !== "all" && { format: formatFilter }),
        ...(search.trim() && { search: search.trim() }),
        sortBy,
        sortOrder,
      }
    );
  }, [override, page, statusFilter, formatFilter, search, sortBy, sortOrder]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handler = () => {
      queryClient.invalidateQueries({
        queryKey: eventKeys.list(filters),
      });
    };

    socket.on("event:status_changed", handler);

    return () => {
      socket.off("event:status_changed", handler);
    };
  }, [queryClient, filters]);

  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => getEventsApi(filters),
    // staleTime: EVENT_STALE.LIST,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
    // refetchInterval: EVENT_REFETCH_INTERVALS.LIVE_LIST,
    refetchIntervalInBackground: false,
  });
}
