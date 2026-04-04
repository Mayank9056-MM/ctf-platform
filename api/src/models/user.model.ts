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
  providers: [
    {
      provider: string;
      providerId: string;
    },
  ];
  avatar?: {
    url: string;
    publicId: string;
  };
  bio?: string;
  teamId?: mongoose.Types.ObjectId;
  solvedChallenges: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  score: number;
  isVerified: boolean;
  password?: string;
  role: string;
  lastActive: Date;
  isBanned: boolean;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  hintsPurchased?: {
    challengeId: mongoose.Types.ObjectId;
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

// helper functions

/**
 * Generates a unique username based on the provided email address.
 * The generated username is of the format `<base>_<random number>` where
 * `<base>` is the first part of the email address without any special characters
 * and `<random number>` is a random number between 1000 and 9999.
 * If a username with the same `<base>` and a different `<random number>` already exists,
 * the function will generate a new username with a different `<random number>`.
 * The function will continue to generate new usernames until a unique one is found.
 * @param {string} email - The email address to generate a username from
 * @returns {Promise<string>} - A promise that resolves to a unique username
 * @throws {Error} - If a unique username could not be generated after 10 attempts
 */
const generateUsername = async (email: string): Promise<string> => {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 20);
  let username = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
  let i = 0;
  while (await mongoose.models.User.findOne({ username }).lean()) {
    username = `${base}_${Date.now()}_${i++}`;
    if (i > 10) throw new Error("Could not generate unique username");
  }
  return username;
};

// avatar schema
const avatarSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "/images/default-avatar.png",
    },
    publicId: {
      type: String,
    },
  },
  { _id: false }
);

// providers schema

const providerSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// main schema

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
          return this.providers.some((p) => p.provider === "local");
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
    providers: [providerSchema],
    avatar: avatarSchema,
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
        const hasLocalProvider = this.providers.some(
          (p) => p.provider === "local"
        );

        return !hasLocalProvider;
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
  { "providers.provider": 1, "providers.providerId": 1 },
  { sparse: true }
);
userSchema.index({ score: -1 });

userSchema.index({
  "hintsPurchased.challengeId": 1,
});

userSchema.index({ country: 1, score: -1 });

// Virtual for gravatar URL
userSchema.virtual("gravatar").get(function (this: IUser) {
  const hash = crypto.createHash("md5").update(this.email).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
});

// Validate password length for local providerq
userSchema.pre("validate", function (this: IUser) {
  const localProvider = this.providers.some((p) => p.provider === "local");
  if (
    this.isNew &&
    localProvider &&
    this.password &&
    this.password.length < 8
  ) {
    this.invalidate("password", "Password must be at least 8 characters");
  }
});

userSchema.pre("validate", async function (this: IUser) {
  if (!this.username) {
    let username = await generateUsername(this.email);

    let exists = await mongoose.models.User.findOne({ username });

    while (exists) {
      username = await generateUsername(this.email);
      exists = await mongoose.models.User.findOne({ username });
    }

    this.username = username;
  }
});

// Hash password before saving the user
userSchema.pre("save", async function (this: IUser) {
  const localProvider = this.providers.some((p) => p.provider === "local");
  if (!this.isModified("password") || !localProvider) {
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
