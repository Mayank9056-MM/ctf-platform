import { useQuery } from "@tanstack/react-query";
import { adminGetUserByIdApi } from "../../api/admin.api";
import { adminKeys } from "../../queries/admin.queries";

export function useAdminUser(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.users.detail(userId ?? ""),
    queryFn: () => adminGetUserByIdApi(userId!),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60,
  });
}
