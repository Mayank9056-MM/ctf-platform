import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAdminUserFilters } from "../../store/admin.store";
import { AdminUserFilters } from "../../types/admin.types";
import { adminKeys } from "../../queries/admin.queries";
import { adminGetUsersApi } from "../../api/admin.api";

export function useAdminUsers(override?: AdminUserFilters) {
  const storeFilters = useAdminUserFilters();
  const filters = override ?? storeFilters;
 
  return useQuery({
    queryKey: adminKeys.users.list(filters),
    queryFn: () => adminGetUsersApi(filters),
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}