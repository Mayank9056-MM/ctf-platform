export const EVENT_FORMATS = [
  "jeopardy",
  "attack_defense",
  "king_of_hill",
  "mixed",
] as const;

export const EVENT_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "ended",
  "archived",
] as const;

export const EVENT_VISIBILITIES = ["public", "invite", "internal"] as const;

export const EVENT_SORT_OPTIONS = [
  "opensAt",
  "createdAt",
  "name",
  "registeredCount",
] as const;

export const LEADERBOARD_TYPES = ["user", "team"] as const;

// Format display labels

export const FORMAT_LABELS: Record<(typeof EVENT_FORMATS)[number], string> = {
  jeopardy: "Jeopardy",
  attack_defense: "Attack & Defense",
  king_of_hill: "King of the Hill",
  mixed: "Mixed",
} as const;

// Status display config

export const STATUS_CONFIG: Record<
  (typeof EVENT_STATUSES)[number],
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "#94a3b8", bg: "bg-slate-500/10" },
  scheduled: { label: "Scheduled", color: "#60a5fa", bg: "bg-blue-500/10" },
  active: { label: "Live", color: "#34d399", bg: "bg-emerald-500/10" },
  paused: { label: "Paused", color: "#fbbf24", bg: "bg-amber-500/10" },
  ended: { label: "Ended", color: "#f87171", bg: "bg-red-500/10" },
  archived: { label: "Archived", color: "#6b7280", bg: "bg-gray-500/10" },
} as const;

/**
 * Forward-only transitions each status allows.
 * Mirrors EVENT_STATUS_TRANSITIONS on the backend model.
 */
export const STATUS_TRANSITIONS: Record<
  (typeof EVENT_STATUSES)[number],
  (typeof EVENT_STATUSES)[number][]
> = {
  draft: ["scheduled", "archived"],
  scheduled: ["active", "draft", "archived"],
  active: ["paused", "ended"],
  paused: ["active", "ended"],
  ended: ["archived"],
  archived: [],
} as const;

// staleTime presets

export const EVENT_STALE = {
  LIST: 1000 * 60, // 1 min  — status can flip automatically
  DETAIL: 1000 * 60 * 2, // 2 min
  LEADERBOARD: 1000 * 30, // 30s    — scores change during active events
  STATS: 1000 * 60, // 1 min
  ADMIN_LIST: 1000 * 30, // 30s
} as const;

export const EVENT_REFETCH_INTERVALS = {
  LIVE_LIST: 1000 * 60 * 2, // check for status changes every 2 min
  LEADERBOARD: 1000 * 30, // live leaderboard poll
} as const;
