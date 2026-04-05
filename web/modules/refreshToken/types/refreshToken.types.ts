export type RevocationReason =
  | "logout"
  | "logout_all"
  | "rotation"
  | "reuse_detected"
  | "admin"
  | "password_change";

// Session

export type SessionInfo = {
  _id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

// Refresh response

export type RefreshTokenResponse = {
  accessToken: string;
};

// Sessions list response

export type SessionsListResponse = {
  sessions: SessionInfo[];
  count: number;
};

// Parsed device label

export type DeviceInfo = {
  sessionId: string;
  browser: string;
  os: string;
  ip?: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
  isExpired: boolean;
};

// Zustand UI state

export type SessionUIState = {
  /** ID of the session currently being revoked (for loading state per-row) */
  revokingSessionId: string | null;
  isRevokingAll: boolean;

  setRevokingSessionId: (id: string | null) => void;
  setRevokingAll: (v: boolean) => void;
};