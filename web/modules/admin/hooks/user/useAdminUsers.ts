import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAdminUserFilters } from "../../store/admin.store";
import { AdminUserFilters } from "../../types/admin.types";
import { adminKeys } from "../../queries/admin.queries";
import { adminGetUsersApi } from "../../api/admin.api";

/**
 * Hook to fetch a list of users from the API.
 *
 * @param {AdminUserFilters} [override] - Optional override of the filters used to fetch the users.
 *
 * @returns {useQuery} - A react-query hook to fetch the list of users.
 *
 * @example
 * const { data, error, isLoading } = useAdminUsers();
 */
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