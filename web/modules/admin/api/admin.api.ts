// modules/admin/api/admin.api.ts
import { ApiResponse } from "@/shared/types/api.types";
import type {
  AdminListFilters,
  AdminUser,
  AdminUserFilters,
  AuditLog,
  AuditLogFilters,
  PaginationMeta,
  PlatformStats,
} from "../types/admin.types";
import { api } from "@/shared/lib/api";
import {
  AdminUpdateUserFormData,
  BanUserFormData,
  ChangeRoleFormData,
  CreateAdminFormData,
  ManualScoreAdjustFormData,
} from "../schema/admin.schema";

function buildParams(obj: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p;
}

// Dashboard

export async function getDashboardStatsApi(): Promise<PlatformStats> {
  const res = await api.get<ApiResponse<PlatformStats>>("api/v1/admin/dashboard");
  return res.data.data;
}

// User management

export async function adminGetUsersApi(
  filters: AdminUserFilters = {},
): Promise<{ users: AdminUser[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get(`api/v1/admin/users?${params}`);
  return { users: res.data.data.users, meta: res.data.data.meta };
}

export async function adminGetUserByIdApi(userId: string): Promise<AdminUser> {
  const res = await api.get<ApiResponse<AdminUser>>(`api/v1/admin/users/${userId}`);
  return res.data.data;
}

export async function adminUpdateUserApi(
  userId: string,
  payload: AdminUpdateUserFormData,
): Promise<AdminUser> {
  const res = await api.patch<ApiResponse<AdminUser>>(
    `api/v1/admin/users/${userId}`,
    payload,
  );
  return res.data.data;
}

export async function adminBanUserApi(
  userId: string,
  payload: BanUserFormData,
): Promise<AdminUser> {
  const res = await api.post<ApiResponse<AdminUser>>(
    `api/v1/admin/users/${userId}/ban`,
    payload,
  );
  return res.data.data;
}

export async function adminUnbanUserApi(userId: string): Promise<AdminUser> {
  const res = await api.post<ApiResponse<AdminUser>>(
    `api/v1/admin/users/${userId}/unban`,
  );
  return res.data.data;
}

export async function adminChangeRoleApi(
  userId: string,
  payload: ChangeRoleFormData,
): Promise<AdminUser> {
  const res = await api.patch<ApiResponse<AdminUser>>(
    `api/v1/admin/users/${userId}/role`,
    payload,
  );
  return res.data.data;
}

export async function adminDeleteUserApi(userId: string): Promise<void> {
  await api.delete(`api/v1/admin/users/${userId}`);
}

// Score management

export async function adminManualScoreAdjustApi(
  userId: string,
  payload: ManualScoreAdjustFormData,
): Promise<{ newScore: number; delta: number }> {
  const res = await api.post<ApiResponse<{ newScore: number; delta: number }>>(
    `api/v1/admin/users/${userId}/score/adjust`,
    payload,
  );
  return res.data.data;
}

export async function adminRecalculateScoresApi(): Promise<{
  usersUpdated: number;
  teamsUpdated: number;
  durationMs: number;
}> {
  const res = await api.post(`api/v1/admin/scores/recalculate`);
  return res.data.data;
}

// Admin account management

export async function adminGetAdminsApi(
  filters: AdminListFilters = {},
): Promise<{ admins: AdminUser[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get(`api/v1/admin/admins?${params}`);
  return { admins: res.data.data.admins, meta: res.data.data.meta };
}

export async function adminCreateAdminApi(
  payload: CreateAdminFormData,
): Promise<AdminUser> {
  const res = await api.post<ApiResponse<AdminUser>>("api/v1/admin/admins", payload);
  return res.data.data;
}

export async function adminRevokeAdminApi(userId: string): Promise<void> {
  await api.delete(`api/v1/admin/admins/${userId}`);
}

// Audit logs

export async function adminGetAuditLogsApi(
  filters: AuditLogFilters = {},
): Promise<{ logs: AuditLog[]; meta: PaginationMeta }> {
  const params = buildParams(filters as Record<string, unknown>);
  const res = await api.get(`api/v1/admin/audit-logs?${params}`);
  return { logs: res.data.data.logs, meta: res.data.data.meta };
}

export async function adminGetAuditLogByIdApi(
  logId: string,
): Promise<AuditLog> {
  const res = await api.get<ApiResponse<AuditLog>>(
    `api/v1/admin/audit-logs/${logId}`,
  );
  return res.data.data;
}
