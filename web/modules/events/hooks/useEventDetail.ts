import { useQuery } from "@tanstack/react-query";
import { getEventDetailApi } from "../api/events.api";
import { EVENT_STALE } from "../constants/event.constants";
import { eventKeys } from "../queries/event.queries";

/**
 * Full event detail by ID or slug.
 * Annotates isOrganizer and isRegistered server-side when authenticated.
 */
export function useEventDetail(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: eventKeys.detail(idOrSlug),
    queryFn: () => getEventDetailApi(idOrSlug),
    enabled: enabled && !!idOrSlug,
    staleTime: EVENT_STALE.DETAIL,
    refetchOnWindowFocus: true,
  });
}