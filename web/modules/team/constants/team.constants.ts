export const TEAM_SORT_OPTIONS = ["score", "memberCount", "createdAt"] as const;

export const TEAM_SORT_ORDERS = ["asc", "desc"] as const;

export const TEAM_LIMITS = {
  NAME_MIN: 3,
  NAME_MAX: 50,
  DESCRIPTION_MAX: 500,
  MAX_MEMBERS_CAP: 10,
  SEARCH_QUERY_MAX: 50,
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
} as const;

export const TEAM_NAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

/** staleTime values — how long TanStack Query reuses cached data */
export const TEAM_STALE = {
  MY_TEAM: 1000 * 60 * 2, // 2 min — membership rarely changes mid-session
  TEAM_DETAIL: 1000 * 60 * 5, // 5 min — public profile is mostly read-only
  SEARCH: 1000 * 30, // 30s — search results are transient
} as const;

/** Invite status values for the UI */
export const INVITE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

export type InviteStatus = (typeof INVITE_STATUS)[keyof typeof INVITE_STATUS];
