import { Types } from "mongoose";
import type { RevocationReason } from "../../models/refreshToken.model";

export type { RevocationReason };

export type IssuedTokenPair = {
  /** Raw token — transmitted to client via httpOnly cookie. Never logged. */
  rawToken: string;
  /** When the token expires (for cookie maxAge calculation) */
  expiresAt: Date;
  /** Family ID of this token chain */
  family: string;
};

// Session info for the "active sessions" endpoint (no hash exposed)
export type SessionInfo = {
  _id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean; // true when this session matches the requesting token
};

// Payload passed when creating a new refresh token
export type CreateRefreshTokenPayload = {
  userId: Types.ObjectId;
  userAgent?: string;
  ipAddress?: string;
  /**
   * When rotating, pass the family of the old token.
   * When creating a fresh session (login), omit — a new family UUID is generated.
   */
  family?: string;
};

// Payload for refresh (token rotation)
export type RotateTokenPayload = {
  rawToken: string;
  userAgent?: string;
  ipAddress?: string;
};

export type RotateTokenResult = {
  issuedToken: IssuedTokenPair;
  userId: Types.ObjectId;
};
