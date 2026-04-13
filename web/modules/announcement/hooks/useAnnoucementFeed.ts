import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAnnouncementFeedApi } from "../api/announcement.api";
import { announcementKeys } from "../queries/announcement.keys";
import { AnnouncementFeedFilters } from "../types/announcement.types";
import { useAnnouncementStore } from "../store/announcement.store";
import { useEffect, useMemo } from "react";
import { getSocket } from "@/shared/lib/socket";

/**
 * Participant-facing feed. Merges server dismiss state with local
 * optimistic dismissals from the Zustand store so the UI never flickers.
 *
 * staleTime: 2 min — announcements are not real-time; moderately fresh is fine.
 * keepPreviousData: prevents layout shift when switching severity filters.
 */
export function useAnnouncementFeed(
  extraFilters: AnnouncementFeedFilters = {},
) {
  const queryClient = useQueryClient();

  const page = useAnnouncementStore((s) => s.feedPage);
  const severityFilter = useAnnouncementStore((s) => s.feedSeverityFilter);
  const dismissedIds = useAnnouncementStore((s) => s.dismissedIds);

  const filters: AnnouncementFeedFilters = useMemo(
    () => ({
      page,
      limit: 10,
      ...extraFilters,
      ...(severityFilter !== "all" && { severity: severityFilter }),
    }),
    [page, extraFilters, severityFilter],
  );

  const query = useQuery({
    queryKey: announcementKeys.feed(filters),
    queryFn: () => getAnnouncementFeedApi(filters),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const socket = getSocket();

    const handler = () => {
      queryClient.invalidateQueries({
        queryKey: announcementKeys.feed(filters),
      });
    };

    socket.on("announcement:published", handler);

    return () => {
      socket.off("announcement:published", handler);
    };
  }, [queryClient, filters]);

  // Merge: filter out IDs the user dismissed this session (optimistic)
  const announcements = (query.data?.announcements ?? []).filter(
    (a) => !dismissedIds.has(a._id),
  );

  return { ...query, announcements, meta: query.data?.meta };
}
