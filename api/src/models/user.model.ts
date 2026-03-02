import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/config";

export interface IUser extends Document {
  username: string;
  email: string;
  fullName?: string;
  mobileNumber?: string;
  provider: "local" | "google" | "github";
  providerId?: string;
  avatar?: string;
  bio?: string;
  teamId?: mongoose.Types.ObjectId;
  solvedChallenges: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  refreshToken?: string;
  score: number;
  isVerified: boolean;
  password?: string;
  role: string;
  lastActive: Date;
  isBanned: boolean;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  hintsPurchased?: {
    challenge: mongoose.Types.ObjectId;
    hintIndex: number;
    purchasedAt: Date;
  }[];
  country?: string;
  isDeleted: boolean;

  generateAccessToken(): string;
  generateRefreshToken(): string;
  comparePassword(password: string): Promise<boolean>;
  getResetPasswordToken(): string;
  generateEmailVerificationToken(): string;
  updateLastActive(): Promise<IUser>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minLength: [3, "Username must be at least 3 characters long"],
      maxLength: [30, "Username must be less than 30 characters"],
    },
    fullName: {
      type: String,
      trim: true,
      maxLength: [100, "Full name must be less than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [
        function (this: IUser): boolean {
          return this.provider === "local";
        },
        "Password is required for local accounts",
      ],
      select: false,
    },
    mobileNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    provider: {
      type: String,
      enum: {
        values: ["local", "google", "github"],
        message: "Provider must be either local, google, or github",
      },
      default: "local",
    },
    providerId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: "/images/default-avatar.png",
    },
    bio: {
      type: String,
      maxLength: [200, "Bio cannot exceed 200 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    solvedChallenges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Challenge",
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    hintsPurchased: [
      {
        challengeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Challenge",
          required: true,
        },
        hintIndex: {
          type: Number,
          required: true,
        },
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isVerified: {
      type: Boolean,
      default: function (this: IUser) {
        return this.provider !== "local";
      },
    },
    /**
     * Token used for password reset
     */
    resetPasswordToken: {
      type: String,
      select: false,
    },

    /**
     * Expiration time for reset token
     */
    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpire: {
      type: Date,
      select: false,
    },

    /**
     * Refresh token for session management
     */

    refreshToken: {
      type: String,
      select: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    country: {
      type: String,
      maxlength: 2, // ISO 3166-1 alpha-2 e.g. "IN", "US"
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index(
  { provider: 1, providerId: 1 },
  { unique: true, sparse: true }
);
userSchema.index({ score: -1 });
userSchema.index(
  { _id: 1, solvedChallenges: 1 },
  { unique: true, sparse: true }
);
userSchema.index({
  "hintsPurchased.challengeId": 1,
});
userSchema.index({ score: -1 });
userSchema.index({ country: 1, score: -1 });

// Virtual for gravatar URL
userSchema.virtual("gravatar").get(function (this: IUser) {
  const hash = crypto.createHash("md5").update(this.email).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
});

// Validate password length for local providerq
userSchema.pre("validate", function (this: IUser) {
  if (
    this.isNew &&
    this.provider === "local" &&
    this.password &&
    this.password.length < 8
  ) {
    this.invalidate("password", "Password must be at least 8 characters");
  }
});

// Hash password before saving the user
userSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password") || this.provider !== "local") {
    return;
  }

  if (!this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);

  return;
});

/**
 * Generate JWT access token
 * @returns {String} JWT access token
 */
userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    config.ACCESS_TOKEN_SECRET,
    { expiresIn: config.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"] }
  );
};

/**
 * Generate JWT refresh token
 * @returns {String} JWT refresh token
 */
userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
    },
    config.REFRESH_TOKEN_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"] }
  );
};

// compare password method
userSchema.methods.comparePassword = async function (enterPassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(enterPassword, this.password); // true or false
};

/**
 * Generates a reset password token
 * @returns {String} Reset password token
 * @remarks This method generates a random token and updates the user document with the hashed token and expiration time.
 * The expiration time is set to 10 minutes by default.
 */
userSchema.methods.getResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

/**
 * Generates an email verification token for the user.
 * @returns {string} Email verification token
 * @remarks This method generates a random token and updates the user document with the hashed token and expiration time.
 * The expiration time is set to 24 hours by default.
 */
userSchema.methods.generateEmailVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Remove user from team members when user is deleted
userSchema.post("findOneAndDelete", async function (doc: IUser) {
  if (doc?.teamId) {
    await mongoose
      .model("Team")
      .updateOne({ _id: doc.teamId }, { $pull: { members: doc._id } });
  }
});

/**
 * Updates the user's last active time.
 * @returns {Promise<Document>} User document with updated last active time.
 * @remarks This method updates the user's last active time to the current timestamp.
 */
userSchema.methods.updateLastActive = function () {
  this.lastActive = Date.now();
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
