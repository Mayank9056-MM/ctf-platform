import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../../queries/event.queries";
import { adminFreezeScoreboardApi } from "../../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

 
/**
 * Freeze or unfreeze the scoreboard. Event must be active.
 */
export function useAdminFreezeScoreboard(eventId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (frozen: boolean) => adminFreezeScoreboardApi(eventId, frozen),
 
    onSuccess: (event) => {
      qc.setQueryData(eventKeys.detail(event._id), event);
      qc.setQueryData(eventKeys.detail(event.slug), event);
      // Leaderboard consumers re-fetch so they pick up the frozen state
      qc.invalidateQueries({ queryKey: eventKeys.leaderboards() });
 
      if (event.scoring.scoreboardFrozen) {
        toast.success("Scoreboard frozen.", {
          description:
            "Participants see scores as of the freeze timestamp.",
        });
      } else {
        toast.success("Scoreboard unfrozen. Live scoring resumed.");
      }
    },
 
    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 400) {
        toast.error("Scoreboard can only be frozen while the event is active.");
      } else if (status === 404) {
        toast.error("Event not found.");
      } else {
        toast.error(err.message ?? "Failed to update scoreboard freeze.");
      }
    },
  });
}