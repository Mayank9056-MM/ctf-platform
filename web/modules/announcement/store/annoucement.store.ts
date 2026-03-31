// modules/announcements/lib/announcement.store.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { AdminAnnouncementFilters, AnnouncementSeverity, AnnouncementUIState } from "../types/announcement.types";

const DEFAULT_ADMIN_FILTERS: AdminAnnouncementFilters = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};

export const useAnnouncementStore = create<AnnouncementUIState>()(
  devtools(
    persist(
      (set) => ({
        feedPage: 1,
        feedSeverityFilter: "all",

        dismissedIds: new Set<string>(),

        // Admin
        adminPage: 1,
        adminFilters: { ...DEFAULT_ADMIN_FILTERS },
        selectedAnnouncementId: null,

        // Actions
        setFeedPage: (page) => set({ feedPage: page }),

        setFeedSeverityFilter: (s: AnnouncementSeverity | "all") =>
          set({ feedSeverityFilter: s, feedPage: 1 }),

        optimisticDismiss: (id) =>
          set((state) => ({
            dismissedIds: new Set([...state.dismissedIds, id]),
          })),

        setAdminPage: (page) =>
          set((state) => ({
            adminFilters: { ...state.adminFilters, page },
          })),

        setAdminFilters: (partial) =>
          set((state) => ({
            adminFilters: {
              ...state.adminFilters,
              ...partial,
              page: 1, // reset to page 1 on any filter change
            },
          })),

        resetAdminFilters: () =>
          set({
            adminFilters: { ...DEFAULT_ADMIN_FILTERS },
            adminPage: 1,
          }),

        setSelectedAnnouncement: (id) => set({ selectedAnnouncementId: id }),
      }),
      {
        name: "ctf-announcements",
        // Persist only what survives a page refresh meaningfully
        partialize: (state) => ({
          feedSeverityFilter: state.feedSeverityFilter,
          // Convert Set → Array for JSON serialisation
          dismissedIds: [...state.dismissedIds],
        }),
        // Convert Array back to Set on rehydration
        merge: (persisted: unknown, current) => {
          const p = persisted as {
            feedSeverityFilter?: AnnouncementSeverity | "all";
            dismissedIds?: string[];
          };
          return {
            ...current,
            feedSeverityFilter: p?.feedSeverityFilter ?? "all",
            dismissedIds: new Set<string>(p?.dismissedIds ?? []),
          };
        },
      },
    ),
    { name: "AnnouncementStore" },
  ),
);

// Selectors

export const useFeedFilters = () =>
  useAnnouncementStore((s) => ({
    page: s.feedPage,
    severityFilter: s.feedSeverityFilter,
    dismissedIds: s.dismissedIds,
  }));

export const useAdminAnnouncementFilters = () =>
  useAnnouncementStore((s) => s.adminFilters);

export const useSelectedAnnouncement = () =>
  useAnnouncementStore((s) => s.selectedAnnouncementId);
