import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getEventLeaderboardApi } from "../api/events.api";
import {
  EVENT_REFETCH_INTERVALS,
  EVENT_STALE,
} from "../constants/event.constants";
import { eventKeys } from "../queries/event.queries";
import { LeaderboardFilters } from "../types/event.type";
import { useLeaderboardState } from "../store/event.store";

/**
 * Event leaderboard — user or team.
 * Reads page and type from Zustand store.
 * Polled every 30s during active events so scores are near-real-time.
 * Frozen board: server returns data as of scoreboardFrozenAt.
 */
export function useEventLeaderboard(eventId: string, enabled = true) {
  const { page, type } = useLeaderboardState();

  const filters: LeaderboardFilters = { page, limit: 50, type };

  return useQuery({
    queryKey: eventKeys.leaderboard(eventId, filters),
    queryFn: () => getEventLeaderboardApi(eventId, filters),
    enabled: enabled && !!eventId,
    staleTime: EVENT_STALE.LEADERBOARD,
    placeholderData: keepPreviousData,
    refetchInterval: EVENT_REFETCH_INTERVALS.LEADERBOARD,
    refetchIntervalInBackground: false,
  });
}
