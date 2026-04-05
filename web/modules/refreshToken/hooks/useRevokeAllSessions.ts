import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { revokeAllSessionsApi } from "../api/refreshToken.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "../store/refreshToken.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useRouter } from "next/navigation";

/**
 * Hook to revoke all active sessions for the current user.
 * This hook is similar to useLogout, but it also invalidates all
 * active refresh tokens for the user, effectively signing out all
 * devices.
 *
 * Returns a useMutation hook with the following properties:
 * - mutationFn: Calls the revokeAllSessionsApi function.
 * - onSuccess: Logs out the user, clears the query cache, and navigates to /login.
 * - onError: Logs an error if the request fails. If the error is a 401, it logs out the user and navigates to /login.
 */
export function useRevokeAllSessions() {
  const qc = useQueryClient();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { setRevokingAll } = useSessionStore();
 
  return useMutation({
    mutationFn: () => {
      setRevokingAll(true);
      return revokeAllSessionsApi();
    },
 
    onSuccess: (result) => {
      logout();
      qc.clear();
      setRevokingAll(false);
 
      toast.success(
        `Signed out from all ${result.revoked} device${result.revoked !== 1 ? "s" : ""}.`,
        { id: "revoke-all" }
      );
 
      router.push("/login");
      router.refresh();
    },
 
    onError: (err: ApiError) => {
      setRevokingAll(false);
 
      if (err.statusCode === 401) {
        // Session was already expired — still log out locally
        logout();
        qc.clear();
        router.push("/login");
      } else {
        toast.error(err.message ?? "Failed to sign out from all devices.");
      }
    },
  });
}