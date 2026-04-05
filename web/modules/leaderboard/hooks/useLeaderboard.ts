import { useUser } from "@/modules/auth/store/auth.store";
import { useLeaderboardFilters } from "../store/leaderboard.store";
import { LeaderboardQueryFilters } from "../types/leaderboard.types";
import { REFETCH_INTERVALS, STALE } from "../constants/leaderboard.constants";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { leaderboardKeys } from "../queries/leaderboard.queries";
import { getLeaderboardApi } from "../api/leaderboard.api";
import { ApiError } from "next/dist/server/api-utils";

/**
 * Retrieves a leaderboard with pagination.
 * 
 * The first request or no snapshot — compute now (cold start).
 * Subsequent requests will return the cached snapshot.
 * 
 * If the requesting user's ID is provided, the service will find their entry
 * (even outside top-N) and include it in the response.
 * 
 * @param {Partial<LeaderboardQueryFilters>} override - Optional filters to override the store filters.
 * @returns An object containing the following properties:
 *   - entries: Annotated array of leaderboard entries, where each entry contains the user's data and a flag indicating whether the entry belongs to the current user.
 *   - meta: The metadata of the leaderboard, including the total count, current page, and limit.
 *   - myEntry: The current user's entry, if found.
 *   - isFrozen: Whether the leaderboard is frozen.
 *   - frozenAt: The timestamp when the leaderboard was frozen, if applicable.
 *   - isStale: Whether the leaderboard is stale.
 *   - computedAt: The timestamp when the leaderboard was computed.
 *   - ageSeconds: The age of the leaderboard in seconds.
 */
export function useLeaderboard(override?: Partial<LeaderboardQueryFilters>) {
  const storeFilters = useLeaderboardFilters();
  const currentUser = useUser();
 
  const filters: LeaderboardQueryFilters = {
    ...storeFilters,
    ...override,
  };
 
  const isEventScope = filters.scope.startsWith("event_");
  const refetchInterval = isEventScope
    ? REFETCH_INTERVALS.ACTIVE_EVENT
    : REFETCH_INTERVALS.GLOBAL;
 
  const query = useQuery({
    queryKey: leaderboardKeys.board(filters),
    queryFn: () => getLeaderboardApi(filters),
    staleTime: STALE.BOARD,
    placeholderData: keepPreviousData,
    refetchInterval,
    refetchIntervalInBackground: false,
    // Leaderboard is a public route — no retry on auth errors
    retry: (failureCount, err: unknown) => {
      const status = (err as ApiError)?.statusCode;
      if (status === 404 || status === 400) return false;
      return failureCount < 2;
    },
  });
 
  const data = query.data;
 
  // Annotate entries: highlight the current user's row
  const annotatedEntries = (data?.entries ?? []).map((e) => ({
    ...e,
    isCurrentUser:
      !!currentUser &&
      e.entityType === "user" &&
      e.entityId === currentUser._id,
  }));
 
  return {
    ...query,
    entries: annotatedEntries,
    meta: data?.meta,
    myEntry: data?.myEntry,
    isFrozen: data?.isFrozen ?? false,
    frozenAt: data?.frozenAt,
    isStale: data?.isStale ?? false,
    computedAt: data?.computedAt,
    ageSeconds: data?.ageSeconds ?? 0,
  };
}