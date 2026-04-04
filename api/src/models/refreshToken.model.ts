import mongoose, { Document, Types } from "mongoose";
import crypto from "crypto";

// Enums

/**
 * Why a token was revoked. Kept on the record for audit/security forensics.
 *
 *  logout          → user explicitly signed out (single device)
 *  logout_all      → user signed out all devices
 *  rotation        → token was exchanged for a new one (normal refresh flow)
 *  reuse_detected  → an already-used token was presented — potential theft;
 *                    entire family is immediately revoked
 *  admin           → revoked by an admin (account ban, security action)
 *  password_change → all sessions invalidated after password change
 *  expired         → cleaned up by the TTL sweep (informational only)
 */
export type RevocationReason =
  | "logout"
  | "logout_all"
  | "rotation"
  | "reuse_detected"
  | "admin"
  | "password_change"
  | "password_reset"
  | "banned"
  | "deleted";

// Interface

export interface IRefreshToken extends Document {
  /** The user this token belongs to */
  userId: Types.ObjectId;

  /**
   * SHA-256 hash of the raw token string.
   * The raw token is NEVER stored — only transmitted to the client
   * via httpOnly cookie. This field is always select:false.
   */
  tokenHash: string;

  /**
   * Rotation family ID.
   * All tokens produced by rotating a given root token share the same family.
   * If a token from this family is presented AFTER being rotated out,
   * the entire family is revoked immediately (reuse / theft detection).
   */
  family: string;

  /** Browser / client identifier — for "active sessions" display */
  userAgent?: string;

  /** IP address at token creation */
  ipAddress?: string;

  /** Whether this token has been explicitly revoked */
  isRevoked: boolean;

  /** Timestamp of revocation */
  revokedAt?: Date;

  /** Why the token was revoked */
  revokedReason?: RevocationReason;

  /**
   * Hard expiry. The MongoDB TTL index auto-deletes the document at this time.
   * This is the source of truth for token lifetime — even if isRevoked is false,
   * a token past this date is invalid.
   */
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;

  /** Whether this token is still usable */
  isValid(): boolean;
}

// Schema

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    tokenHash: {
      type: String,
      required: [true, "tokenHash is required"],
      unique: true,
      select: false, // never exposed in query results by default
    },

    family: {
      type: String,
      required: [true, "family is required"],
      index: true, // for efficient family-wide revocation
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: [512, "userAgent cannot exceed 512 characters"],
      default: null,
    },

    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },

    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedReason: {
      type: String,
      enum: [
        "logout",
        "logout_all",
        "rotation",
        "reuse_detected",
        "admin",
        "password_change",
      ] satisfies RevocationReason[],
      default: null,
    },

    expiresAt: {
      type: Date,
      required: [true, "expiresAt is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes

// TTL — auto-delete expired tokens
refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "ttl_expires" }
);

// Active session lookup per user
refreshTokenSchema.index(
  { userId: 1, isRevoked: 1, expiresAt: 1 },
  { name: "active_sessions_per_user" }
);

// Family-wide revocation (reuse detection)
refreshTokenSchema.index(
  { family: 1, isRevoked: 1 },
  { name: "family_revocation" }
);

// Virtuals

refreshTokenSchema.virtual("isExpired").get(function (this: IRefreshToken) {
  return this.expiresAt < new Date();
});

// Instance Methods

/**
 * Returns true only if the token is not revoked AND has not expired.
 * Use this as the single validity gate in your auth middleware.
 */
refreshTokenSchema.methods.isValid = function (this: IRefreshToken): boolean {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Static Methods

export interface IRefreshTokenModel extends mongoose.Model<IRefreshToken> {
  /**
   * Find a token record by hashing the raw token string.
   * Always fetches tokenHash (normally select:false) for the hash comparison.
   */
  findByRawToken(rawToken: string): Promise<IRefreshToken | null>;

  /**
   * Count how many active (non-revoked, non-expired) sessions a user has.
   */
  countActiveSessions(userId: Types.ObjectId): Promise<number>;

  /**
   * Revoke every active token in a given family.
   * Called on reuse detection — returns the number of revoked documents.
   */
  revokeFamily(family: string, reason: RevocationReason): Promise<number>;

  /**
   * Revoke all active tokens for a user.
   * Used for logout-all and password-change flows.
   */
  revokeAllForUser(
    userId: Types.ObjectId,
    reason: RevocationReason
  ): Promise<number>;
}

refreshTokenSchema.statics.findByRawToken = async function (
  rawToken: string
): Promise<IRefreshToken | null> {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  return this.findOne({ tokenHash: hash })
    .select("+tokenHash") // override select:false for this query only
    .lean();
};

refreshTokenSchema.statics.countActiveSessions = async function (
  userId: Types.ObjectId
): Promise<number> {
  return this.countDocuments({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

refreshTokenSchema.statics.revokeFamily = async function (
  family: string,
  reason: RevocationReason
): Promise<number> {
  const now = new Date();
  const result = await this.updateMany(
    { family, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: now, revokedReason: reason } }
  );
  return result.modifiedCount;
};

refreshTokenSchema.statics.revokeAllForUser = async function (
  userId: Types.ObjectId,
  reason: RevocationReason
): Promise<number> {
  const now = new Date();
  const result = await this.updateMany(
    { userId, isRevoked: false, expiresAt: { $gt: now } },
    { $set: { isRevoked: true, revokedAt: now, revokedReason: reason } }
  );
  return result.modifiedCount;
};

// Model

const RefreshToken = mongoose.model<IRefreshToken, IRefreshTokenModel>(
  "RefreshToken",
  refreshTokenSchema
);

export default RefreshToken;
