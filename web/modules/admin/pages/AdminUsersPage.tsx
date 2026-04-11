import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useAdminStore } from "../store/admin.store";
import { useAdminUsers } from "../hooks/user/useAdminUsers";
import { useAdminUnbanUser } from "../hooks/user/useAdminUnbanUser";
import { useAdminDeleteUser } from "../hooks/user/useAdminDeleteUser";
import { useCallback, useState } from "react";
import { AdminUser, AdminUserFilters } from "../types/admin.types";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ConfirmModal } from "../../../shared/components/ui/ConfirmModal";
import { fmt } from "@/shared/utils/fmt";
import { timeAgo } from "@/shared/utils/time";
import { FilterBar } from "../components/users/FilterBar";
import { SkeletonRow } from "../components/users/SkeletonRow";
import { UserAvatar } from "../components/users/UserAvatar";
import { RoleBadge } from "../components/users/RoleBadge";
import { StatusBadge } from "../components/users/StatusBadge";
import { RowActions } from "../components/users/RowActions";
import { UserDetailPanel } from "../components/users/UserDetailPanel";
import { BanModal } from "../components/users/BanModal";
import { ChangeRoleModal } from "../components/users/ChangeRoleModal";
import { EditUserModal } from "../components/users/EditUserModal";

type SortHeaderProps = {
  field: AdminUserFilters["sortBy"];
  label: string;
  active: boolean;
  sortOrder?: "asc" | "desc";
  onSort: (field: AdminUserFilters["sortBy"]) => void;
};

/**
 * A button component for sorting a table column.
 *
 * @param {SortHeaderProps} props
 * @param {AdminUserFilters["sortBy"]} props.field - The field to sort by.
 * @param {string} props.label - The label to display in the button.
 * @param {boolean} props.active - Whether the button is active.
 * @param {"asc" | "desc"} props.sortOrder - The sort order.
 * @param {(field: AdminUserFilters["sortBy"]) => void} props.onSort - The callback to trigger when the button is clicked.
 *
 * @returns A button component with the given props.
 */
const SortHeader = ({
  field,
  label,
  active,
  sortOrder,
  onSort,
}: SortHeaderProps) => {
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 font-mono text-[11px] tracking-wider uppercase transition-colors",
        active ? "text-emerald-400" : "text-slate-600 hover:text-slate-400",
      )}
    >
      {label}
      {active && (
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            sortOrder === "asc" && "rotate-180",
          )}
        />
      )}
    </button>
  );
};

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "superadmin";

  const filters = useAdminStore((s) => s.userFilters);
  const setFilters = useAdminStore((s) => s.setUserFilters);
  const selectedUserId = useAdminStore((s) => s.selectedUserId);
  const setSelectedUser = useAdminStore((s) => s.setSelectedUser);

  // Modal states
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);

  const { data, isLoading, isFetching, refetch } = useAdminUsers();
  const { mutate: unban, isPending: isUnbanning } = useAdminUnbanUser(
    unbanTarget?._id ?? "",
  );
  const { mutate: deleteUser, isPending: isDeleting } = useAdminDeleteUser();

  const users = data?.users ?? [];
  const meta = data?.meta;

  const openPanel = useCallback(
    (user: AdminUser) => setSelectedUser(user._id),
    [setSelectedUser],
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-800/60 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-[0.25em] text-emerald-400/70 uppercase">
              {"// admin"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
            User Management
          </h1>
          {meta && (
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {meta.total.toLocaleString()} users · page {meta.page} of{" "}
              {meta.totalPages}
            </p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-xs font-mono text-slate-400 hover:border-slate-500 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Main scrollable area */}
        <div
          className={cn(
            "h-full overflow-y-auto transition-all duration-300",
            selectedUserId ? "mr-[360px]" : "",
          )}
        >
          <div className="p-6">
            {/* Filter bar */}
            <FilterBar />

            {/* Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                      <th className="px-4 py-3 text-left w-10" />
                      <th className="px-4 py-3 text-left">
                        <SortHeader
                          field="username"
                          label="User"
                          active={filters.sortBy === "username"}
                          sortOrder={filters.sortOrder}
                          onSort={(field) =>
                            setFilters({
                              sortBy: field,
                              sortOrder:
                                filters.sortBy === field &&
                                filters.sortOrder === "desc"
                                  ? "asc"
                                  : "desc",
                            })
                          }
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <SortHeader
                          field="email"
                          label="Email"
                          active={filters.sortBy === "username"}
                          sortOrder={filters.sortOrder}
                          onSort={(field) =>
                            setFilters({
                              sortBy: field,
                              sortOrder:
                                filters.sortBy === field &&
                                filters.sortOrder === "desc"
                                  ? "asc"
                                  : "desc",
                            })
                          }
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left">
                        <SortHeader
                          field="score"
                          label="Score"
                          active={filters.sortBy === "username"}
                          sortOrder={filters.sortOrder}
                          onSort={(field) =>
                            setFilters({
                              sortBy: field,
                              sortOrder:
                                filters.sortBy === field &&
                                filters.sortOrder === "desc"
                                  ? "asc"
                                  : "desc",
                            })
                          }
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left">
                        <SortHeader
                          field="lastActive"
                          label="Last active"
                          active={filters.sortBy === "username"}
                          sortOrder={filters.sortOrder}
                          onSort={(field) =>
                            setFilters({
                              sortBy: field,
                              sortOrder:
                                filters.sortBy === field &&
                                filters.sortOrder === "desc"
                                  ? "asc"
                                  : "desc",
                            })
                          }
                        />
                      </th>
                      <th className="px-4 py-3 text-right font-mono text-[11px] tracking-wider text-slate-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading &&
                      Array.from({ length: 10 }).map((_, i) => (
                        <SkeletonRow key={i} />
                      ))}

                    {!isLoading && users.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <UserX className="h-8 w-8 text-slate-700" />
                            <p className="text-sm text-slate-500 font-mono">
                              No users found
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {users.map((user) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => openPanel(user)}
                        className={cn(
                          "border-b border-slate-800/50 cursor-pointer transition-colors group",
                          selectedUserId === user._id
                            ? "bg-emerald-500/5"
                            : "hover:bg-slate-800/30",
                        )}
                      >
                        {/* Avatar */}
                        <td className="px-4 py-3">
                          <UserAvatar user={user} size="sm" />
                        </td>

                        {/* Username */}
                        <td className="px-4 py-3">
                          <p className="font-mono text-sm font-medium text-slate-200 truncate max-w-[120px]">
                            {user.username}
                          </p>
                          {user.fullName && (
                            <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                              {user.fullName}
                            </p>
                          )}
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-400 truncate max-w-[160px] font-mono">
                            {user.email}
                          </p>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                            {fmt(user.score)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge
                            isBanned={user.isBanned}
                            isVerified={user.isVerified}
                          />
                        </td>

                        {/* Last active */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-500">
                            {timeAgo(user.lastActive)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActions
                            user={user}
                            isSuperAdmin={isSuperAdmin}
                            onEdit={() => setEditTarget(user)}
                            onBan={() => setBanTarget(user)}
                            onUnban={() => setUnbanTarget(user)}
                            onChangeRole={() => setRoleTarget(user)}
                            onDelete={() => setDeleteTarget(user)}
                          />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="font-mono text-xs text-slate-500">
                  {(meta.page - 1) * meta.limit + 1}–
                  {Math.min(meta.page * meta.limit, meta.total)} of{" "}
                  {meta.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilters({ page: meta.page - 1 })}
                    disabled={!meta.hasPrev}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(meta.totalPages, 7) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setFilters({ page })}
                            className={cn(
                              "h-8 min-w-[32px] rounded-lg px-2 font-mono text-xs transition-all",
                              meta.page === page
                                ? "bg-emerald-500 text-slate-950 font-bold"
                                : "border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white",
                            )}
                          >
                            {page}
                          </button>
                        );
                      },
                    )}
                    {meta.totalPages > 7 && (
                      <span className="font-mono text-xs text-slate-600 px-1">
                        ...
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setFilters({ page: meta.page + 1 })}
                    disabled={!meta.hasNext}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedUserId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 lg:hidden"
                onClick={() => setSelectedUser(null)}
              />
              <UserDetailPanel
                userId={selectedUserId}
                onClose={() => setSelectedUser(null)}
                isSuperAdmin={isSuperAdmin}
                onEdit={() => {
                  const u = users.find((u) => u._id === selectedUserId);
                  if (u) setEditTarget(u);
                }}
                onBan={() => {
                  const u = users.find((u) => u._id === selectedUserId);
                  if (u) setBanTarget(u);
                }}
                onUnban={() => {
                  const u = users.find((u) => u._id === selectedUserId);
                  if (u) setUnbanTarget(u);
                }}
                onChangeRole={() => {
                  const u = users.find((u) => u._id === selectedUserId);
                  if (u) setRoleTarget(u);
                }}
                onDelete={() => {
                  const u = users.find((u) => u._id === selectedUserId);
                  if (u) setDeleteTarget(u);
                }}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}

      <BanModal
        open={!!banTarget}
        user={banTarget}
        onClose={() => setBanTarget(null)}
      />

      <ConfirmModal
        open={!!unbanTarget}
        onClose={() => setUnbanTarget(null)}
        onConfirm={() => {
          if (!unbanTarget) return;
          unban(undefined, { onSuccess: () => setUnbanTarget(null) });
        }}
        title={`Unban ${unbanTarget?.username}?`}
        description="This will restore their access to the platform immediately."
        confirmLabel="Unban user"
        variant="warning"
        isPending={isUnbanning}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteUser(deleteTarget._id, {
            onSuccess: () => {
              setDeleteTarget(null);
              if (selectedUserId === deleteTarget._id) setSelectedUser(null);
            },
          });
        }}
        title={`Delete ${deleteTarget?.username}?`}
        description="This permanently anonymises the account. All PII will be scrubbed. This cannot be undone."
        confirmLabel="Delete permanently"
        variant="danger"
        isPending={isDeleting}
      />

      <ChangeRoleModal
        open={!!roleTarget}
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
        isSuperAdmin={isSuperAdmin}
      />

      <EditUserModal
        open={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}
