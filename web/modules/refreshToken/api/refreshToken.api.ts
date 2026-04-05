
import { api } from "@/shared/lib/api";
import { ApiResponse } from "@/shared/types/api.types";
import { RefreshTokenResponse, SessionsListResponse } from "../types/refreshToken.types";

// POST /auth/refresh
/**
 * Rotate the refresh token cookie and get a new access token.
 * Called automatically by the axios interceptor on 401 — not in user code.
 * The refresh token travels as an httpOnly cookie; no body needed.
 */
export async function rotateRefreshTokenApi(): Promise<RefreshTokenResponse> {
  const res = await api.post<ApiResponse<RefreshTokenResponse>>(
    "/auth/refresh",
    {},
    // Flag this as a silent auth request so the interceptor
    // doesn't show a toast or trigger another refresh on failure
    { _silentAuth: true } as Parameters<typeof api.post>[2],
  );
  return res.data.data;
}

// GET /auth/sessions
/**
 * List all active sessions for the authenticated user.
 * The current session (this device) is annotated with isCurrent: true.
 */
export async function getSessionsApi(): Promise<SessionsListResponse> {
  const res =
    await api.get<ApiResponse<SessionsListResponse>>("/auth/sessions");
  return res.data.data;
}

// DELETE /auth/sessions/:sessionId
/**
 * Revoke a specific session by its _id.
 * The user can only revoke their own sessions (enforced by the server).
 */
export async function revokeSessionApi(sessionId: string): Promise<void> {
  await api.delete(`/auth/sessions/${sessionId}`);
}

// DELETE /auth/sessions
/**
 * Revoke ALL sessions for the authenticated user (logout everywhere).
 * The server also clears the current device's refresh token cookie.
 */
export async function revokeAllSessionsApi(): Promise<{ revoked: number }> {
  const res =
    await api.delete<ApiResponse<{ revoked: number }>>("/auth/sessions");
  return res.data.data;
}
