// modules/submissions/lib/submission.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  AdminStatsFilters,
  AdminSubmissionsFilters,
  SubmissionUIState,
} from "../types/submission.types";

const DEFAULT_ADMIN_FILTERS: AdminSubmissionsFilters = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};

const DEFAULT_ADMIN_STATS_FILTERS: AdminStatsFilters = {};

export const useSubmissionStore = create<SubmissionUIState>()(
  devtools(
    (set) => ({
      // My submissions page
      myPage: 1,
      myIsCorrectFilter: "all",
      myChallengeidFilter: null,
      mySortOrder: "desc",

      // Challenge history panel
      historyPage: 1,

      // Admin
      adminPage: 1,
      adminFilters: { ...DEFAULT_ADMIN_FILTERS },
      adminStatsFilters: { ...DEFAULT_ADMIN_STATS_FILTERS },
      selectedSubmissionId: null,

      // Actions
      setMyPage: (page) => set({ myPage: page }, false, "setMyPage"),

      setMyIsCorrectFilter: (v) =>
        set({ myIsCorrectFilter: v, myPage: 1 }, false, "setMyIsCorrectFilter"),

      setMyChallengeidFilter: (id) =>
        set(
          { myChallengeidFilter: id, myPage: 1 },
          false,
          "setMyChallengeidFilter",
        ),

      setMySortOrder: (o) =>
        set({ mySortOrder: o, myPage: 1 }, false, "setMySortOrder"),

      resetMyFilters: () =>
        set(
          {
            myPage: 1,
            myIsCorrectFilter: "all",
            myChallengeidFilter: null,
            mySortOrder: "desc",
          },
          false,
          "resetMyFilters",
        ),

      setHistoryPage: (page) =>
        set({ historyPage: page }, false, "setHistoryPage"),

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

      setAdminStatsFilters: (partial) =>
        set(
          (s) => ({
            adminStatsFilters: { ...s.adminStatsFilters, ...partial },
          }),
          false,
          "setAdminStatsFilters",
        ),

      setSelectedSubmission: (id) =>
        set({ selectedSubmissionId: id }, false, "setSelectedSubmission"),
    }),
    { name: "SubmissionStore" },
  ),
);

// Selectors

export const useMySubmissionsState = () =>
  useSubmissionStore((s) => ({
    page: s.myPage,
    isCorrectFilter: s.myIsCorrectFilter,
    challengeIdFilter: s.myChallengeidFilter,
    sortOrder: s.mySortOrder,
    setPage: s.setMyPage,
    setIsCorrectFilter: s.setMyIsCorrectFilter,
    setChallengeIdFilter: s.setMyChallengeidFilter,
    setSortOrder: s.setMySortOrder,
    resetFilters: s.resetMyFilters,
  }));

export const useAdminSubmissionFilters = () =>
  useSubmissionStore((s) => s.adminFilters);

export const useAdminStatsFilters = () =>
  useSubmissionStore((s) => s.adminStatsFilters);

export const useSelectedSubmission = () =>
  useSubmissionStore((s) => s.selectedSubmissionId);
