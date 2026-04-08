import { ApiError } from "next/dist/server/api-utils";
import { adminKeys } from "../../queries/admin.queries";
import { toast } from "sonner";
import { adminUnbanUserApi } from "../../api/admin.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminUnbanUser(userId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: () => adminUnbanUserApi(userId),
 
    onSuccess: (user) => {
      qc.setQueryData(adminKeys.users.detail(userId), user);
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      toast.success(`${user.username} has been unbanned.`);
    },
 
    onError: (err: ApiError) => {
      toast.error(err.message ?? "Failed to unban user.");
    },
  });
}
 