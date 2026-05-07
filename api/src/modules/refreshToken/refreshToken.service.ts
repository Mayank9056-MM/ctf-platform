import crypto from "crypto";
import { Types } from "mongoose";
import { config } from "../../config/config";
import {
  CreateRefreshTokenPayload,
  IssuedTokenPair,
  RotateTokenPayload,
  RotateTokenResult,
  SessionInfo,
} from "./refreshToken.types";
import RefreshToken, {
  IRefreshTokenModel,
} from "../../models/refreshToken.model";
import { ApiError } from "../../utils/ApiError";
import logger from "../../lib/logger";

// Constants

/**
 * Parses a token duration string into a number of milliseconds.
 * The duration string should be in the format of `<number><unit>`,
 * where `<number>` is a positive integer and `<unit>` is one of
 * `s`, `m`, `h`, or `d`, representing seconds, minutes, hours, and
 * days, respectively.
 * @throws {Error} If the duration string is invalid.
 * @example
 * parseDurationMs("1h") // 3_600_000
 * @example
 * parseDurationMs("7d") // 604_800_000
 */
function parseDurationMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new Error(`Invalid token duration: "${duration}"`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[unit];
}

const REFRESH_TTL_MS = parseDurationMs(
  (config.REFRESH_TOKEN_EXPIRY as string) ?? "7d"
);

// Service

class RefreshTokenService {
  /**
   * Creates a new refresh token for a user.
   * @param {CreateRefreshTokenPayload} payload - The payload containing the user id, user agent and IP address.
   * @returns {Promise<IssuedTokenPair>} - A promise that resolves to an object containing the raw refresh token, expiration date and family.
   */
  async issue(payload: CreateRefreshTokenPayload): Promise<IssuedTokenPair> {
    const { userId, userAgent, ipAddress, family } = payload;

    const rawToken = crypto.randomBytes(64).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const tokenFamily = family ?? crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await RefreshToken.create({
      userId,
      tokenHash,
      family: tokenFamily,
      userAgent: userAgent ?? undefined,
      ipAddress: ipAddress ?? undefined,
      expiresAt,
    });

    return { rawToken, expiresAt, family: tokenFamily };
  }

  /**
   * Rotate a refresh token.
   * This is called when a user presents a valid refresh token to obtain a new access token.
   * The old token is revoked and a new one is issued in the same family.
   * @param {RotateTokenPayload} payload - The payload containing the raw refresh token, user agent and IP address
   * @throws {ApiError} - If the refresh token is invalid, has already been used, or has expired
   * @returns {Promise<RotateTokenResult>} - A promise that resolves to an object containing the issued access token and refresh token, as well as the user ID
   */
  async rotate(payload: RotateTokenPayload): Promise<RotateTokenResult> {
    const { rawToken, userAgent, ipAddress } = payload;

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const record = await RefreshToken.findOne({ tokenHash })
      .select("+tokenHash")
      .lean();

    if (!record) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (record.isRevoked) {
      // Reuse of an already-revoked token — revoke the entire family
      const revoked = await (
        RefreshToken as unknown as IRefreshTokenModel
      ).revokeFamily(record.family, "reuse_detected");

      logger.warn(
        `[RefreshTokenService] Reuse detected — revoked ${revoked} tokens in family ${record.family} for user ${record.userId}`
      );

      throw new ApiError(
        401,
        "Session token has already been used. For security, all sessions have been invalidated. Please sign in again."
      );
    }

    if (record.expiresAt < new Date()) {
      throw new ApiError(
        401,
        "Refresh token has expired. Please sign in again."
      );
    }

    // Revoke the old token and issue a new one in the same family
    await RefreshToken.findByIdAndUpdate(record._id, {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: "rotation",
      },
    });

    const issuedToken = await this.issue({
      userId: record.userId as Types.ObjectId,
      userAgent,
      ipAddress,
      family: record.family,
    });

    return {
      issuedToken,
      userId: record.userId as Types.ObjectId,
    };
  }

  /**
   * Revokes a refresh token by its raw value.
   * @param {string} rawToken - The raw refresh token to revoke.
   * @throws {ApiError} If the refresh token is not found or has already been revoked.
   * @returns {Promise<void>} - A promise that resolves when the refresh token has been successfully revoked.
   */
  async revokeByRaw(rawToken: string): Promise<void> {
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await RefreshToken.updateOne(
      { tokenHash, isRevoked: false },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: "logout",
        },
      }
    );
  }

  /**
   * Revokes a refresh token by its session ID.
   * @param {string} sessionId - The session ID of the refresh token to revoke.
   * @param {Types.ObjectId} userId - The ID of the user who owns the session.
   * @throws {ApiError} If the refresh token is not found or has already been revoked.
   * @returns {Promise<void>} - A promise that resolves when the refresh token has been successfully revoked.
   */
  async revokeSessionById(
    sessionId: string,
    userId: Types.ObjectId
  ): Promise<void> {
    const result = await RefreshToken.updateOne(
      {
        _id: sessionId,
        userId,
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: "logout",
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new ApiError(404, "Session not found or already revoked");
    }
  }

  /**
   * Revokes all active tokens for a user.
   * Used for logout-all and password-change flows.
   * @param {Types.ObjectId} userId - The ID of the user to revoke all active tokens for.
   * @param {Parameters<IRefreshTokenModel["revokeAllForUser"]>[1]} reason - The reason for revoking all tokens. Defaults to "logout_all".
   * @returns {Promise<number>} - A promise that resolves to the number of revoked tokens.
   */
  async revokeAllForUser(
    userId: Types.ObjectId,
    reason: Parameters<IRefreshTokenModel["revokeAllForUser"]>[1] = "logout_all"
  ): Promise<number> {
    return (RefreshToken as unknown as IRefreshTokenModel).revokeAllForUser(
      userId,
      reason
    );
  }

  /**
   * Retrieve a list of active sessions for a user.
   * @param {Types.ObjectId} userId - The ID of the user to retrieve active sessions for.
   * @param {string} [currentTokenHash] - Optional. The hash of the current token. If provided, the response will include a boolean indicating whether each session is the current one.
   * @returns {Promise<SessionInfo[]>} - A promise that resolves to an array of SessionInfo objects, each representing an active session.
   */
  async getActiveSessions(
    userId: Types.ObjectId,
    currentTokenHash?: string
  ): Promise<SessionInfo[]> {
    const sessions = await RefreshToken.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select("_id userAgent ipAddress createdAt expiresAt tokenHash")
      .select("+tokenHash")
      .sort({ createdAt: -1 })
      .lean();

    return sessions.map((s) => ({
      _id: s._id.toString(),
      userAgent: s.userAgent ?? undefined,
      ipAddress: s.ipAddress ?? undefined,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: !!currentTokenHash && s.tokenHash === currentTokenHash,
    }));
  }

  /**
   * Counts the number of active (non-revoked, non-expired) sessions a user has.
   * @param {Types.ObjectId} userId - The ID of the user to count active sessions for.
   * @returns {Promise<number>} - A promise that resolves to the number of active sessions.
   */
  async countActiveSessions(userId: Types.ObjectId): Promise<number> {
    return (RefreshToken as unknown as IRefreshTokenModel).countActiveSessions(
      userId
    );
  }
}

export const refreshTokenService = new RefreshTokenService();
