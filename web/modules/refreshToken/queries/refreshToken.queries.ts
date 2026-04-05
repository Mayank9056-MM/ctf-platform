
export const sessionKeys = {
  all: ["sessions"] as const,

  /**
   * Active sessions list for the authenticated user.
   * GET /auth/sessions
   */
  list: () => [...sessionKeys.all, "list"] as const,
} as const;