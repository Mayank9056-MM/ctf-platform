import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { teamKeys } from "../../queries/team.queries";
import { joinTeamByCodeApi } from "../../api/team.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTeamStore } from "../../store/team.store";

const USER_CURRENT_KEY = ["user", "current"];
const NOTIFICATION_SUMMARY_KEY = ["notifications", "summary"];

/**
 * Join a team using a join code.
 * Sets the team cache directly with the returned team object.
 */
export function useJoinTeamByCode() {
  const qc = useQueryClient();
  const { setJoinCodeInput } = useTeamStore((s) => ({
    setJoinCodeInput: s.setJoinCodeInput,
  }));

  return useMutation({
    mutationFn: (code: string) => joinTeamByCodeApi(code),

    onSuccess: (team) => {
      qc.setQueryData(teamKeys.mine(), team);
      qc.invalidateQueries({ queryKey: USER_CURRENT_KEY });
      qc.invalidateQueries({ queryKey: NOTIFICATION_SUMMARY_KEY });
      setJoinCodeInput("");
      toast.success(`Joined "${team.name}"! 🎉`, {
        description: "You're now competing as a team.",
      });
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      if (status === 404) {
        toast.error("Invalid join code. Check the code and try again.");
      } else if (status === 403) {
        toast.error(
          "Join code has expired. Ask your team owner to generate a new one.",
        );
      } else if (status === 400) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("full")) {
          toast.error("This team is full.");
        } else if (msg.includes("already in a team")) {
          toast.error("Leave your current team before joining another.");
        } else {
          toast.error(err.message ?? "Cannot join this team.");
        }
      } else if (status === 409) {
        toast.info("You are already a member of this team.");
      } else {
        toast.error(err.message ?? "Failed to join team.");
      }
    },
  });
}
