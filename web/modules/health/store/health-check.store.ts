import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  HealthCheckStore,
  ValidService,
} from "../types/health-check.types";

// Default intervals

export const REFRESH_INTERVALS = {
  FAST: 10_000, // 10s — for active incident monitoring
  NORMAL: 30_000, // 30s — default
  SLOW: 60_000, // 60s — low-traffic / background
} as const;

// Store

export const useHealthCheckStore = create<HealthCheckStore>()(
  devtools(
    persist(
      (set) => ({
        // State

        selectedService: null,
        autoRefresh: true,
        refreshIntervalMs: REFRESH_INTERVALS.NORMAL,
        lastFetchedAt: null,

        // Actions

        setSelectedService: (service: ValidService | null) =>
          set({ selectedService: service }, false, "setSelectedService"),

        toggleAutoRefresh: () =>
          set(
            (s) => ({ autoRefresh: !s.autoRefresh }),
            false,
            "toggleAutoRefresh",
          ),

        setRefreshInterval: (ms: number) =>
          set({ refreshIntervalMs: ms }, false, "setRefreshInterval"),

        markFetched: () =>
          set({ lastFetchedAt: Date.now() }, false, "markFetched"),
      }),
      {
        name: "ctf-health-check",
        // Only persist UI preferences — never server data
        partialize: (s) => ({
          autoRefresh: s.autoRefresh,
          refreshIntervalMs: s.refreshIntervalMs,
        }),
      },
    ),
    { name: "HealthCheckStore" },
  ),
);

// Selectors

export const useSelectedService = () =>
  useHealthCheckStore((s) => s.selectedService);

export const useAutoRefresh = () => useHealthCheckStore((s) => s.autoRefresh);

export const useRefreshInterval = () =>
  useHealthCheckStore((s) => s.refreshIntervalMs);

export const useLastFetchedAt = () =>
  useHealthCheckStore((s) => s.lastFetchedAt);
