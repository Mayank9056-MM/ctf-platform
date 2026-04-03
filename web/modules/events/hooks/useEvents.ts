import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getEventsApi } from "../api/events.api";
import { useEventListState } from "../store/event.store";
import { EventListFilters } from "../types/event.type";
import { eventKeys } from "../queries/event.queries";
import {
  EVENT_REFETCH_INTERVALS,
  EVENT_STALE,
} from "../constants/event.constants";

/**
 * Public paginated event list. Reads all filters from Zustand store.
 *
 * - refetchInterval: 2 min — events can auto-transition (draft→scheduled→active)
 *   so the list needs periodic refresh to pick up status changes without reload.
 * - keepPreviousData: prevents layout shift when changing filters.
 */
export function useEvents(override?: EventListFilters) {
  const { page, statusFilter, formatFilter, search, sortBy, sortOrder } =
    useEventListState();

  const filters: EventListFilters = override ?? {
    page,
    limit: 12,
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(formatFilter !== "all" && { format: formatFilter }),
    ...(search.trim() && { search: search.trim() }),
    sortBy,
    sortOrder,
  };

  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => getEventsApi(filters),
    staleTime: EVENT_STALE.LIST,
    placeholderData: keepPreviousData,
    refetchInterval: EVENT_REFETCH_INTERVALS.LIVE_LIST,
    refetchIntervalInBackground: false,
  });
}
