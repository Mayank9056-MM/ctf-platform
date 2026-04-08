import { toast } from "sonner";
import { adminBanUserApi } from "../../api/admin.api";
import { adminKeys } from "../../queries/admin.queries";
import { BanUserFormData } from "../../schema/admin.schema";
import { ApiError } from "next/dist/server/api-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminBanUser(userId: string) {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: (payload: BanUserFormData) => adminBanUserApi(userId, payload),
 
    onSuccess: (user) => {
      qc.setQueryData(adminKeys.users.detail(userId), user);
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      toast.success(`${user.username} has been banned.`);
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 400) toast.error("User is already banned.");
      else toast.error(err.message ?? "Failed to ban user.");
    },
  });
}