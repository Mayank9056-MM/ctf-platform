import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAdminStore } from "../store/admin.store";
import { AdminListFilters } from "../types/admin.types";
import { adminKeys } from "../queries/admin.queries";
import { adminGetAdminsApi } from "../api/admin.api";

export function useAdminListAdmins(override?: AdminListFilters) {
  const storeFilters = useAdminStore((s) => s.adminListFilters);
  const filters = override ?? storeFilters;
 
  return useQuery({
    queryKey: adminKeys.admins.list(filters),
    queryFn: () => adminGetAdminsApi(filters),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}