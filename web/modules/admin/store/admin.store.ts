// modules/admin/lib/admin.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  AdminUIState,
  AdminUserFilters,
} from "../types/admin.types";

const DEFAULT_USER_FILTERS: AdminUserFilters = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};

export const useAdminStore = create<AdminUIState>()(
  devtools(
    (set) => ({
      userFilters: { ...DEFAULT_USER_FILTERS },
      selectedUserId: null,
      auditFilters: { page: 1, limit: 20 },
      selectedLogId: null,
      adminListFilters: { page: 1, limit: 20 },

      setUserFilters: (f) =>
        set((s) => ({ userFilters: { ...s.userFilters, ...f, page: 1 } })),
      resetUserFilters: () => set({ userFilters: { ...DEFAULT_USER_FILTERS } }),
      setSelectedUser: (id) => set({ selectedUserId: id }),

      setAuditFilters: (f) =>
        set((s) => ({ auditFilters: { ...s.auditFilters, ...f, page: 1 } })),
      resetAuditFilters: () => set({ auditFilters: { page: 1, limit: 20 } }),
      setSelectedLog: (id) => set({ selectedLogId: id }),

      setAdminListFilters: (f) =>
        set((s) => ({
          adminListFilters: { ...s.adminListFilters, ...f, page: 1 },
        })),
    }),
    { name: "AdminStore" },
  ),
);

export const useAdminUserFilters = () => useAdminStore((s) => s.userFilters);
export const useAuditLogFilters = () => useAdminStore((s) => s.auditFilters);
