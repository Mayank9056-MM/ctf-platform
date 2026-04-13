import { devtools } from "zustand/middleware";
import type {
  AdminNotificationFilters,
  NotificationTypeValue,
  NotificationUIState,
} from "../types/notification.types";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

const DEFAULT_ADMIN_FILTERS: AdminNotificationFilters = {
  page: 1,
  limit: 20,
};

export const useNotificationStore = createWithEqualityFn<NotificationUIState>()(
  devtools(
    (set) => ({
      // ── Bell panel
      isPanelOpen: false,
      panelTab: "all",

      // ── Full inbox
      inboxPage: 1,
      inboxFilter: "all",
      inboxTypeFilter: "all",

      // ── Optimistic sets
      // These prevent flash-of-content when dismiss/delete is in-flight.
      // They are NOT persisted — they live only for the current session.
      // TanStack Query re-validates on stale and will sync truth from server.
      optimisticDismissedIds: new Set<string>(),
      optimisticDeletedIds: new Set<string>(),

      // ── Admin
      adminPage: 1,
      adminFilters: { ...DEFAULT_ADMIN_FILTERS },
      selectedNotificationId: null,

      // ── Actions
      togglePanel: () =>
        set((s) => ({ isPanelOpen: !s.isPanelOpen }), false, "togglePanel"),

      closePanel: () => set({ isPanelOpen: false }, false, "closePanel"),

      setPanelTab: (tab) => set({ panelTab: tab }, false, "setPanelTab"),

      setInboxPage: (page) => set({ inboxPage: page }, false, "setInboxPage"),

      setInboxFilter: (f) =>
        set({ inboxFilter: f, inboxPage: 1 }, false, "setInboxFilter"),

      setInboxTypeFilter: (t: NotificationTypeValue | "all") =>
        set({ inboxTypeFilter: t, inboxPage: 1 }, false, "setInboxTypeFilter"),

      optimisticallyDismiss: (id) =>
        set(
          (s) => ({
            optimisticDismissedIds: new Set([...s.optimisticDismissedIds, id]),
          }),
          false,
          "optimisticallyDismiss",
        ),

      optimisticallyDelete: (id) =>
        set(
          (s) => ({
            optimisticDeletedIds: new Set([...s.optimisticDeletedIds, id]),
          }),
          false,
          "optimisticallyDelete",
        ),

      clearOptimistic: () =>
        set(
          {
            optimisticDismissedIds: new Set<string>(),
            optimisticDeletedIds: new Set<string>(),
          },
          false,
          "clearOptimistic",
        ),

      setAdminPage: (page) =>
        set(
          (s) => ({ adminFilters: { ...s.adminFilters, page } }),
          false,
          "setAdminPage",
        ),

      setAdminFilters: (partial) =>
        set(
          (s) => ({
            adminFilters: { ...s.adminFilters, ...partial, page: 1 },
          }),
          false,
          "setAdminFilters",
        ),

      resetAdminFilters: () =>
        set(
          { adminFilters: { ...DEFAULT_ADMIN_FILTERS } },
          false,
          "resetAdminFilters",
        ),

      setSelectedNotification: (id) =>
        set({ selectedNotificationId: id }, false, "setSelectedNotification"),
    }),
    { name: "NotificationStore" },
  ),
);

// Selectors (prevent unnecessary re-renders)

export const useBellState = () =>
  useNotificationStore((s) => ({
    isOpen: s.isPanelOpen,
    tab: s.panelTab,
    togglePanel: s.togglePanel,
    closePanel: s.closePanel,
    setPanelTab: s.setPanelTab,
  }));

export const useInboxFilters = () =>
  useNotificationStore(
    (s) => ({
      page: s.inboxPage,
      filter: s.inboxFilter,
      typeFilter: s.inboxTypeFilter,
      setPage: s.setInboxPage,
      setFilter: s.setInboxFilter,
      setTypeFilter: s.setInboxTypeFilter,
    }),
    shallow,
  );

export const useOptimisticSets = () =>
  useNotificationStore((s) => ({
    dismissedIds: s.optimisticDismissedIds,
    deletedIds: s.optimisticDeletedIds,
  }));

export const useAdminNotificationFilters = () =>
  useNotificationStore((s) => s.adminFilters);

export const useSelectedNotification = () =>
  useNotificationStore((s) => s.selectedNotificationId);
