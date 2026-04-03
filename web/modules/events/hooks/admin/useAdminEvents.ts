import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { EVENT_STALE } from "../../constants/event.constants";
import { adminGetEventsApi } from "../../api/events.api";
import { eventKeys } from "../../queries/event.queries";
import { useAdminEventFilters } from "../../store/event.store";
import { AdminEventListFilters } from "../../types/event.type";

/**
 * Admin event list — includes drafts and archived. Reads filters from store.
 */
export function useAdminEvents(override?: AdminEventListFilters) {
  const storeFilters = useAdminEventFilters();
  const filters = override ?? storeFilters;

  return useQuery({
    queryKey: eventKeys.admin.list(filters),
    queryFn: () => adminGetEventsApi(filters),
    staleTime: EVENT_STALE.ADMIN_LIST,
    placeholderData: keepPreviousData,
  });
}
