import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { adminKeys } from "../../queries/admin.queries";
import { adminChangeRoleApi } from "../../api/admin.api";
import { ChangeRoleFormData } from "../../schema/admin.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminChangeRole() {
  const qc = useQueryClient();
 
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ChangeRoleFormData }) =>
      adminChangeRoleApi(userId, payload),
 
    onSuccess: (user, { userId }) => {
      qc.setQueryData(adminKeys.users.detail(userId), user);
      qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
      toast.success(`Role changed to "${user.role}".`);
    },
 
    onError: (err: ApiError) => {
      if (err.statusCode === 403) toast.error("Cannot change your own role.");
      else toast.error(err.message ?? "Failed to change role.");
    },
  });
}