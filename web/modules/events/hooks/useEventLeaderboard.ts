import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getEventLeaderboardApi } from "../api/events.api";
import { eventKeys } from "../queries/event.queries";
import { LeaderboardFilters } from "../types/event.type";
import { useLeaderboardState } from "../store/event.store";
import { useEffect, useMemo } from "react";
import { getSocket } from "@/shared/lib/socket";
import { useEventRoom } from "./useEventRoom";

/**
 * Hook to fetch the event leaderboard.
 * @param eventId The event ID to fetch the leaderboard for.
 * @param enabled Whether to enable the query.
 * @returns The result of the query.
 */
export function useEventLeaderboard(eventId: string, enabled = true) {
  const queryClient = useQueryClient();
  const { page, type } = useLeaderboardState();

  useEventRoom(eventId);

  const filters: LeaderboardFilters = useMemo(
    () => ({
      page,
      limit: 50,
      type,
    }),
    [page, type],
  );

  const queryKey = eventKeys.leaderboard(eventId, filters);

  const query = useQuery({
    queryKey,
    queryFn: () => getEventLeaderboardApi(eventId, filters),
    enabled: enabled && !!eventId,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handler = (data: { scope: string; eventId?: string }) => {
      if (data.eventId === eventId) {
        queryClient.invalidateQueries({ queryKey });
      }
    };
    socket.on("leaderboard:updated", handler);

    return () => {
      socket.off("leaderboard:updated", handler);
    };
  }, [eventId, queryClient, queryKey]);

  return query;
}
