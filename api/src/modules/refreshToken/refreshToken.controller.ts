import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.middleware";
import { config } from "../../config/config";
import { asyncHandler } from "../../utils/asyncHandler";
import { COOKIE_NAME } from "../../utils/constants";
import { refreshTokenService } from "./refreshToken.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { parseBody } from "../../utils/helpers";
import { revokeSessionSchema } from "./refreshToken.validator";
import { ApiError } from "../../utils/ApiError";

/**
 * Generates an options object for setting a cookie.
 * @param {Date} expiresAt - the date the cookie should expire
 * @returns {Object} - an object with the following properties:
 *   httpOnly: {boolean} - whether the cookie should be accessible only by the web server
 *   secure: {boolean} - whether the cookie should be sent over a secure channel
 *   sameSite: {string} - whether the cookie should be restricted to a first-party or same-site context
 *   expires: {Date} - the date the cookie should expire
 *   path: {string} - the path for which the cookie is valid
 */
function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict" as const,
    expires: expiresAt,
    path: "/",
  };
}

// GET /auth/sessions

/**
 * List all active sessions for the authenticated user.
 * The current session is marked with isCurrent: true.
 */
export const listSessions = asyncHandler(async (req, res) => {
  const rawCurrent = req.cookies[COOKIE_NAME] as string | undefined;

  // Hash the current token so the service can mark this session
  let currentHash: string | undefined;
  if (rawCurrent) {
    const crypto = await import("crypto");
    currentHash = crypto.createHash("sha256").update(rawCurrent).digest("hex");
  }

  const sessions = await refreshTokenService.getActiveSessions(
    req.user!._id,
    currentHash
  );

  const count = await refreshTokenService.countActiveSessions(req.user!._id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { sessions, count }, "Active sessions retrieved")
    );
});

// DELETE /auth/sessions/:sessionId
/**
 * Revoke a specific session by its _id.
 * Only the session owner can revoke their own sessions.
 */
export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = parseBody(revokeSessionSchema, req.params) as {
    sessionId: string;
  };

  await refreshTokenService.revokeSessionById(sessionId, req.user!._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Session revoked successfully"));
});

// DELETE /auth/sessions
/**
 * Revoke ALL sessions (logout from every device).
 * Clears the current device's cookie too.
 */
export const revokeAllSessions = asyncHandler(async (req, res) => {
  const revoked = await refreshTokenService.revokeAllForUser(
    req.user!._id,
    "logout_all"
  );

  res.clearCookie(COOKIE_NAME, { path: "/" });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { revoked },
        `Signed out from all ${revoked} device(s)`
      )
    );
});

// POST /auth/refresh
/**
 * Rotate the refresh token.
 * Called by the axios interceptor when an access token expires.
 * Issues a new access token + rotated refresh token.
 *
 * This controller is intentionally kept here to keep all refresh-token
 * lifecycle operations in one place. Your existing auth.controller.ts
 * refresh endpoint should delegate to this.
 */
export const rotateRefreshToken = asyncHandler(async (req, res) => {
  const rawToken = req.cookies[COOKIE_NAME] as string | undefined;

  if (!rawToken) {
    throw new ApiError(401, "Refresh token not found. Please sign in again.");
  }

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      .trim() ?? req.socket?.remoteAddress;

  const { issuedToken, userId } = await refreshTokenService.rotate({
    rawToken,
    userAgent: req.headers["user-agent"],
    ipAddress: ip,
  });

  // Issue a fresh access token
  const { default: User } = await import("../../models/user.model");
  const user = await User.findById(userId).select(
    "username email role isBanned isDeleted"
  );

  if (!user || user.isBanned || user.isDeleted) {
    throw new ApiError(401, "Account is inactive. Please sign in again.");
  }

  const accessToken = user.generateAccessToken();

  // Set the new refresh token cookie
  res.cookie(
    COOKIE_NAME,
    issuedToken.rawToken,
    cookieOptions(issuedToken.expiresAt)
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken }, "Token refreshed successfully")
    );
});
