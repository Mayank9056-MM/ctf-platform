import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRevokeAdminApi } from "../api/admin.api";
import { toast } from "sonner";
import { adminKeys } from "../queries/admin.queries";
import { ApiError } from "next/dist/server/api-utils";

export function useAdminRevokeAdmin() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (userId: string) => adminRevokeAdminApi(userId),
 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.admins.lists() });
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      toast.success("Admin privileges revoked. Account demoted to user.");
    },
 
    onError: (err: ApiError) => {
      const msg = err.message?.toLowerCase() ?? "";
      if (msg.includes("last superadmin")) {
        toast.error("Cannot revoke the last superadmin account.");
      } else if (err.statusCode === 403) {
        toast.error("Cannot revoke your own admin role.");
      } else {
        toast.error(err.message ?? "Failed to revoke admin.");
      }
    },
  });
}