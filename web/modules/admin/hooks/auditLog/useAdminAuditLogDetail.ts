import { useQuery } from "@tanstack/react-query";
import { adminGetAuditLogByIdApi } from "../../api/admin.api";
import { adminKeys } from "../../queries/admin.queries";

export function useAdminAuditLogDetail(logId: string | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.auditLogs.detail(logId ?? ""),
    queryFn: () => adminGetAuditLogByIdApi(logId!),
    enabled: enabled && !!logId,
    staleTime: 1000 * 60 * 10, // immutable — 10 min
  });
}
