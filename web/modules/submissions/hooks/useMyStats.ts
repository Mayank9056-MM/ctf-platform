import { useQuery, useQueryClient } from "@tanstack/react-query";
import { submissionKeys } from "../queries/submissions.query";
import { getMyStatsApi } from "../api/submissons.api";
import { useEffect } from "react";
import { getSocket } from "@/shared/lib/socket";

/**
 * Player's own stats — score, rank, streak, solve rate, 30-day activity.
 * Polled every 60s so rank updates are reflected without refresh.
 */
export function useMyStats() {
  const queryClient = useQueryClient();

  const queryKey = submissionKeys.myStats();

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handler = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    socket.on("submission:correct", handler);
    socket.on("leaderboard:updated", handler);

    return () => {
      socket.off("submission:correct", handler);
      socket.off("leaderboard:updated", handler);
    };
  }, [queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: getMyStatsApi,
    // staleTime: 1000 * 30,
    // refetchInterval: 1000 * 60, // background refresh every minute
    staleTime: Infinity,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
}
