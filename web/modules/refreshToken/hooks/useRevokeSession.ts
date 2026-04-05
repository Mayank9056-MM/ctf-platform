import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../store/refreshToken.store";
import { revokeSessionApi } from "../api/refreshToken.api";
import { SessionInfo, SessionsListResponse } from "../types/refreshToken.types";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";
import { sessionKeys } from "../queries/refreshToken.queries";

export function useRevokeSession() {
  const qc = useQueryClient();
  const { setRevokingSessionId } = useSessionStore();

  return useMutation({
    mutationFn: (sessionId: string) => {
      setRevokingSessionId(sessionId);
      return revokeSessionApi(sessionId);
    },

    onSuccess: (_, sessionId) => {
      // Optimistic: remove from cached list immediately
      qc.setQueryData<SessionsListResponse>(sessionKeys.list(), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sessions: prev.sessions.filter(
            (s: SessionInfo) => s._id !== sessionId,
          ),
          count: Math.max(0, prev.count - 1),
        };
      });

      setRevokingSessionId(null);
      toast.success("Session revoked. That device has been signed out.");
    },

    onError: (err: ApiError) => {
      setRevokingSessionId(null);
      // Re-sync so the UI reflects reality
      qc.invalidateQueries({ queryKey: sessionKeys.list() });

      if (err.statusCode === 404) {
        toast.error("Session not found or already expired.");
      } else {
        toast.error(err.message ?? "Failed to revoke session.");
      }
    },
  });
}
