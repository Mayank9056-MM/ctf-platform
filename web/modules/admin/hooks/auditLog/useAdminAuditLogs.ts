import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminGetAuditLogsApi } from "../../api/admin.api";
import { adminKeys } from "../../queries/admin.queries";
import { useAuditLogFilters } from "../../store/admin.store";
import { AuditLogFilters } from "../../types/admin.types";

export function useAdminAuditLogs(override?: AuditLogFilters) {
  const storeFilters = useAuditLogFilters();
  const filters = override ?? storeFilters;
 
  return useQuery({
    queryKey: adminKeys.auditLogs.list(filters),
    queryFn: () => adminGetAuditLogsApi(filters),
    staleTime: 1000 * 60, // 1 min
    placeholderData: keepPreviousData,
  });
}