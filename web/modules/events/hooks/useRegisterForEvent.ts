import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { eventKeys } from "../queries/event.queries";
import { registerForEventApi } from "../api/events.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Register for an event.
 * Invalidates the event detail so isRegistered flips to true.
 * Also invalidates the event list (registeredCount bumped).
 */
export function useRegisterForEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      inviteCode,
    }: {
      eventId: string;
      inviteCode?: string;
    }) => registerForEventApi(eventId, inviteCode),

    onSuccess: () => {
      // Invalidate both slug and id variants — we don't know which key is cached
      qc.invalidateQueries({ queryKey: eventKeys.details() });
      qc.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success("Registered for the event! 🎯", {
        description: "You're now competing. Good luck!",
      });
    },

    onError: (err: ApiError) => {
      const status = err.statusCode;
      const msg = err.message?.toLowerCase() ?? "";

      if (status === 400) {
        if (msg.includes("full") || msg.includes("capacity")) {
          toast.error("This event has reached maximum capacity.");
        } else if (msg.includes("closed") || msg.includes("deadline")) {
          toast.error("Registration for this event has closed.");
        } else if (msg.includes("team size") || msg.includes("members")) {
          toast.error(err.message ?? "Your team size exceeds the event limit.");
        } else if (msg.includes("solo")) {
          toast.error("This event requires a team. Join or create one first.");
        } else {
          toast.error(err.message ?? "Cannot register for this event.");
        }
      } else if (status === 403) {
        if (msg.includes("invite")) {
          toast.error("An invite code is required to join this event.");
        } else if (msg.includes("allowed") || msg.includes("list")) {
          toast.error("You are not on the allowed list for this event.");
        } else {
          toast.error("Invalid invite code.");
        }
      } else if (status === 409) {
        toast.info("You are already registered for this event.");
      } else if (status === 404) {
        toast.error("Event not found.");
      } else {
        toast.error(err.message ?? "Registration failed.");
      }
    },
  });
}
