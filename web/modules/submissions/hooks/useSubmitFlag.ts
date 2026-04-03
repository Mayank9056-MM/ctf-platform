import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { submissionKeys } from "../queries/submissions.query";
import { notificationKeys } from "@/modules/notification/queries/notification.keys";
import { challengeKeys } from "@/modules/challenges/queries/challenge.keys";
import { submitFlagApi } from "../api/submissons.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Submit a flag for a challenge.
 *
 * On correct:
 *   - Invalidates challenge detail (solveCount, firstBlood, dynamic points)
 *   - Invalidates my stats (rank, streak, score)
 *   - Invalidates notification summary (bell badge picks up the solve notification)
 *   - Invalidates solve leaderboard for this challenge
 *
 * HTTP status 200 = correct, 400 = incorrect (both are handled — not both errors).
 */
export function useSubmitFlag(challengeId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (flag: string) => submitFlagApi(challengeId, flag),

    onSuccess: (result) => {
      if (result.isCorrect) {
        if (result.isFirstBlood) {
          toast.success(`🩸 First blood! +${result.pointsAwarded} pts`, {
            description: "You're the first to solve this challenge.",
            duration: 6000,
          });
        } else {
          toast.success(`✅ Correct! +${result.pointsAwarded} pts`, {
            description: result.message,
            duration: 4000,
          });
        }

        // Invalidate challenge detail — solveCount, firstBlood, currentPoints updated
        qc.invalidateQueries({
          queryKey: challengeKeys.detail(challengeId),
        });

        // Invalidate my stats — rank, streak, score all changed
        qc.invalidateQueries({ queryKey: submissionKeys.myStats() });

        // Invalidate notification summary — solve notification just created
        qc.invalidateQueries({
          queryKey: notificationKeys.summary(),
        });

        // Invalidate solve leaderboard — user just appeared
        qc.invalidateQueries({
          queryKey: submissionKeys.solves(challengeId),
        });

        // Invalidate my submission list — new correct entry
        qc.invalidateQueries({ queryKey: submissionKeys.myLists() });

        // Invalidate challenge history for this challenge
        qc.invalidateQueries({
          queryKey: submissionKeys.history(challengeId),
        });
      }
      // Incorrect is not an error — the mutation succeeded (server processed the request)
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;

      if (status === 400) {
        // Incorrect flag — show attempt count if present
        const msg = err.message ?? "Incorrect flag.";
        toast.error(msg, {
          description: "Check your flag format and try again.",
        });
      } else if (status === 409) {
        toast.info("You have already solved this challenge.", {
          description: "Each challenge can only be solved once.",
        });
      } else if (status === 423) {
        toast.error("Too many incorrect attempts. Wait before trying again.", {
          duration: 8000,
        });
      } else if (status === 429) {
        toast.error("Rate limited. Too many submissions in a short time.", {
          duration: 6000,
        });
      } else if (status === 403) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("team")) {
          toast.info("Your team has already solved this challenge.");
        } else if (msg.includes("verif")) {
          toast.error("Verify your email to submit flags.", {
            action: {
              label: "Resend",
              onClick: () => {
                import("@/modules/auth/api/auth.api").then(
                  ({ resendVerificationApi }) => resendVerificationApi(),
                );
              },
            },
          });
        } else {
          toast.error(err.message ?? "Access denied.");
        }
      } else if (status === 400) {
        toast.error(
          "This challenge is closed and no longer accepting submissions.",
        );
      } else {
        toast.error(err.message ?? "Submission failed. Try again.");
      }
    },
  });
}
