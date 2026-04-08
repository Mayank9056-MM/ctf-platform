export const STALE = {
  LIST: 1000 * 60 * 5, // 5 min — stories change infrequently
  DETAIL: 1000 * 60 * 2, // 2 min
  PROGRESS: 1000 * 30, // 30s — XP/completion can change
  LEADERBOARD: 1000 * 60, // 1 min
} as const;
