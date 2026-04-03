// modules/event/lib/event.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  AdminEventListFilters,
  EventFormat,
  EventSortBy,
  EventStatus,
  EventUIState,
  LeaderboardType,
} from "../types/event.type";

const DEFAULT_ADMIN_FILTERS: AdminEventListFilters = {
  page: 1,
  limit: 20,
  sortBy: "opensAt",
  sortOrder: "asc",
};

export const useEventStore = create<EventUIState>()(
  devtools(
    (set) => ({
      // Player list
      listPage: 1,
      listStatusFilter: "all",
      listFormatFilter: "all",
      listSearch: "",
      listSortBy: "opensAt",
      listSortOrder: "asc",

      // Leaderboard
      leaderboardPage: 1,
      leaderboardType: "user",

      // Admin
      adminPage: 1,
      adminFilters: { ...DEFAULT_ADMIN_FILTERS },
      selectedEventId: null,
      isManagingChallenges: false,

      // Actions

      setListPage: (page) => set({ listPage: page }, false, "setListPage"),

      setListStatusFilter: (s: EventStatus | "all") =>
        set({ listStatusFilter: s, listPage: 1 }, false, "setListStatusFilter"),

      setListFormatFilter: (f: EventFormat | "all") =>
        set({ listFormatFilter: f, listPage: 1 }, false, "setListFormatFilter"),

      setListSearch: (q) =>
        set({ listSearch: q, listPage: 1 }, false, "setListSearch"),

      setListSort: (sortBy: EventSortBy, order: "asc" | "desc") =>
        set(
          { listSortBy: sortBy, listSortOrder: order, listPage: 1 },
          false,
          "setListSort",
        ),

      resetListFilters: () =>
        set(
          {
            listPage: 1,
            listStatusFilter: "all",
            listFormatFilter: "all",
            listSearch: "",
            listSortBy: "opensAt",
            listSortOrder: "asc",
          },
          false,
          "resetListFilters",
        ),

      setLeaderboardPage: (page) =>
        set({ leaderboardPage: page }, false, "setLeaderboardPage"),

      setLeaderboardType: (t: LeaderboardType) =>
        set(
          { leaderboardType: t, leaderboardPage: 1 },
          false,
          "setLeaderboardType",
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

      setSelectedEvent: (id) =>
        set({ selectedEventId: id }, false, "setSelectedEvent"),

      setIsManagingChallenges: (v) =>
        set({ isManagingChallenges: v }, false, "setIsManagingChallenges"),
    }),
    { name: "EventStore" },
  ),
);

// Selectors

export const useEventListState = () =>
  useEventStore((s) => ({
    page: s.listPage,
    statusFilter: s.listStatusFilter,
    formatFilter: s.listFormatFilter,
    search: s.listSearch,
    sortBy: s.listSortBy,
    sortOrder: s.listSortOrder,
    setPage: s.setListPage,
    setStatusFilter: s.setListStatusFilter,
    setFormatFilter: s.setListFormatFilter,
    setSearch: s.setListSearch,
    setSort: s.setListSort,
    reset: s.resetListFilters,
  }));

export const useLeaderboardState = () =>
  useEventStore((s) => ({
    page: s.leaderboardPage,
    type: s.leaderboardType,
    setPage: s.setLeaderboardPage,
    setType: s.setLeaderboardType,
  }));

export const useAdminEventFilters = () => useEventStore((s) => s.adminFilters);
