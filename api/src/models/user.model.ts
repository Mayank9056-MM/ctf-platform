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

  generateAccessToken(): string;
  generateRefreshToken(): string;
  comparePassword(password: string): Promise<boolean>;
  getResetPasswordToken(): string;
  updateLastActive(): Promise<IUser>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
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
      required: function (this: IUser): boolean {
        return this.provider === "local";
      },
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    /**
     * Token used for password reset
     */
    resetPasswordToken: String,

    /**
     * Expiration time for reset token
     */
    resetPasswordExpire: Date,

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
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ provider: 1, providerId: 1 });
userSchema.index({ score: -1 });

// Hash password before saving the user
userSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password") || this.provider !== "local") {
    return;
  }

  if (!this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
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
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

/**
 * Updates the user's last active time.
 * @returns {Promise<Document>} User document with updated last active time.
 * @remarks This method updates the user's last active time to the current timestamp.
 */
userSchema.methods.updateLastActive = function () {
  this.lastActive = Date.now();
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model("User", userSchema);

export default User;
