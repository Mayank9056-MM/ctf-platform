// modules/team/lib/team.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { TeamUIState, TeamView } from "../types/team.types";
import { TEAM_SORT_OPTIONS, TEAM_SORT_ORDERS } from "../constants/team.constants";

export const useTeamStore = create<TeamUIState>()(
  devtools(
    (set) => ({
      // Panel / dashboard view
      activeView: "my-team",
      searchQuery: "",
      joinCodeInput: "",
      inviteUsernameInput: "",

      // Search page state
      searchPage: 1,
      searchCountry: null,
      searchSortBy: "score",
      searchSortOrder: "desc",

      // Settings
      isEditingTeam: false,

      // Actions

      setActiveView: (v: TeamView) =>
        set({ activeView: v }, false, "setActiveView"),

      setSearchQuery: (q) =>
        set({ searchQuery: q, searchPage: 1 }, false, "setSearchQuery"),

      setJoinCodeInput: (code) =>
        set({ joinCodeInput: code }, false, "setJoinCodeInput"),

      setInviteUsernameInput: (username) =>
        set({ inviteUsernameInput: username }, false, "setInviteUsernameInput"),

      setSearchPage: (page) =>
        set({ searchPage: page }, false, "setSearchPage"),

      setSearchCountry: (country) =>
        set(
          { searchCountry: country, searchPage: 1 },
          false,
          "setSearchCountry",
        ),

      setSearchSortBy: (sortBy: (typeof TEAM_SORT_OPTIONS)[number]) =>
        set({ searchSortBy: sortBy, searchPage: 1 }, false, "setSearchSortBy"),

      setSearchSortOrder: (order: (typeof TEAM_SORT_ORDERS)[number]) =>
        set(
          { searchSortOrder: order, searchPage: 1 },
          false,
          "setSearchSortOrder",
        ),

      setIsEditingTeam: (v) =>
        set({ isEditingTeam: v }, false, "setIsEditingTeam"),

      resetSearchState: () =>
        set(
          {
            searchQuery: "",
            searchPage: 1,
            searchCountry: null,
            searchSortBy: "score",
            searchSortOrder: "desc",
          },
          false,
          "resetSearchState",
        ),

      resetInputs: () =>
        set(
          { joinCodeInput: "", inviteUsernameInput: "", searchQuery: "" },
          false,
          "resetInputs",
        ),
    }),
    { name: "TeamStore" },
  ),
);

export const useTeamPanelState = () =>
  useTeamStore((s) => ({
    activeView: s.activeView,
    joinCodeInput: s.joinCodeInput,
    inviteUsernameInput: s.inviteUsernameInput,
    isEditingTeam: s.isEditingTeam,
    setActiveView: s.setActiveView,
    setJoinCodeInput: s.setJoinCodeInput,
    setInviteUsernameInput: s.setInviteUsernameInput,
    setIsEditingTeam: s.setIsEditingTeam,
    resetInputs: s.resetInputs,
  }));

export const useTeamSearchState = () =>
  useTeamStore((s) => ({
    query: s.searchQuery,
    page: s.searchPage,
    country: s.searchCountry,
    sortBy: s.searchSortBy,
    sortOrder: s.searchSortOrder,
    setQuery: s.setSearchQuery,
    setPage: s.setSearchPage,
    setCountry: s.setSearchCountry,
    setSortBy: s.setSearchSortBy,
    setSortOrder: s.setSearchSortOrder,
    resetSearch: s.resetSearchState,
  }));
