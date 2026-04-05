// modules/leaderboard/lib/leaderboard.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  LeaderboardScope,
  LeaderboardUIState,
} from "../types/leaderboard.types";

export const useLeaderboardStore = create<LeaderboardUIState>()(
  devtools(
    (set) => ({
      // Filter state
      scope: "global_user",
      eventId: null,
      page: 1,
      limit: 50,

      // Admin
      isRecomputing: false,

      // Actions

      setScope: (scope: LeaderboardScope) =>
        set({ scope, page: 1 }, false, "setScope"),

      setEventId: (id) =>
        set({ eventId: id, page: 1 }, false, "setEventId"),

      setPage: (page) =>
        set({ page }, false, "setPage"),

      setLimit: (limit) =>
        set({ limit, page: 1 }, false, "setLimit"),

      resetFilters: () =>
        set(
          { scope: "global_user", eventId: null, page: 1, limit: 50 },
          false,
          "resetFilters"
        ),

      setIsRecomputing: (v) =>
        set({ isRecomputing: v }, false, "setIsRecomputing"),
    }),
    { name: "LeaderboardStore" }
  )
);

// Selectors

export const useLeaderboardFilters = () =>
  useLeaderboardStore((s) => ({
    scope: s.scope,
    eventId: s.eventId ?? undefined,
    page: s.page,
    limit: s.limit,
  }));