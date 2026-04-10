import { useQuery } from "@tanstack/react-query";
import { adminGetUserByIdApi } from "../../api/admin.api";
import { adminKeys } from "../../queries/admin.queries";

/**
 * Hook to fetch a user by ID from the API.
 *
 * @param {string | null} [userId] - Optional user ID to fetch.
 * @param {boolean} [enabled=true] - Optional flag to enable or disable the query.
 *
 * @returns {useQuery} - A react-query hook to fetch the user.
 *
 * @example
 * const { data, error, isLoading } = useAdminUser("1234567890abcdef");
 */
export function useAdminUser(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.users.detail(userId ?? ""),
    queryFn: () => adminGetUserByIdApi(userId!),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60,
  });
}
