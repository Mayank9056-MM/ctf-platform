"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

type DashboardStore = {
  teamSearchQuery: string;
  teamJoinCode: string;
  setTeamSearchQuery: (q: string) => void;
  setTeamJoinCode: (code: string) => void;
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set) => ({
      teamSearchQuery: "",
      teamJoinCode: "",
      setTeamSearchQuery: (q) => set({ teamSearchQuery: q }),
      setTeamJoinCode: (code) => set({ teamJoinCode: code }),
    }),
    { name: "DashboardStore" }
  )
);