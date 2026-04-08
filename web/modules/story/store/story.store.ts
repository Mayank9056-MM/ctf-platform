import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { StoryStatus, StoryUIState } from "../types/story.types";

export const useStoryStore = create<StoryUIState>()(
  devtools(
    (set) => ({
      adminPage: 1,
      adminStatusFilter: "all",
      adminSearch: "",
      selectedChapterId: null,
      selectedNodeId: null,

      setAdminPage: (page) => set({ adminPage: page }),
      setAdminStatusFilter: (s: StoryStatus | "all") =>
        set({ adminStatusFilter: s, adminPage: 1 }),
      setAdminSearch: (q) => set({ adminSearch: q, adminPage: 1 }),
      setSelectedChapter: (id) =>
        set({ selectedChapterId: id, selectedNodeId: null }),
      setSelectedNode: (id) => set({ selectedNodeId: id }),
      resetAdminFilters: () =>
        set({ adminPage: 1, adminStatusFilter: "all", adminSearch: "" }),
    }),
    { name: "StoryStore" },
  ),
);
