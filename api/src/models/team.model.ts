import mongoose, { Document, Types } from "mongoose";
import crypto from "crypto";

export interface ITeam extends Document {
  name: string;
  description?: string;

  owner: Types.ObjectId;

  members: Types.ObjectId[];

  invites: {
    user: Types.ObjectId;
    invitedBy: Types.ObjectId;
    invitedAt: Date;
  }[];
  solvedChallenges: Types.ObjectId[];
  avatar?: string;

  maxMembers: number;
  score: number;

  joinCode?: string;
  joinCodeExpire?: Date;

  isPrivate: boolean;

  createdAt: Date;
  updatedAt: Date;

  isActive: boolean;
  country?: string;

  generateJoinCode(): string;
  isJoinCodeValid(code: string): boolean;
}

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    description: {
      type: String,
      maxlength: [500, "Description must be less than 500 characters"],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team owner is required"],
    },
    avatar: {
      type: String,
      default: "/images/default-team-avatar.png",
    },
    solvedChallenges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Challenge",
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
      },
    ],
    invites: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        invitedAt: { type: Date, default: Date.now },
      },
    ],
    maxMembers: {
      type: Number,
      default: 4,
      min: 1,
      max: 10,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    joinCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    joinCodeExpire: {
      type: Date,
      default: null,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    country: {
      type: String,
      maxlength: 2,
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

teamSchema.index({ name: 1 });
teamSchema.index({ score: -1 });
teamSchema.index({ owner: 1 });
teamSchema.index({ joinCode: 1 });
teamSchema.index({ isActive: 1, score: -1 });
teamSchema.index({ isActive: 1, isPrivate: 1, score: -1 });
teamSchema.index({ isActive: 1, isPrivate: 1, country: 1, score: -1 });
teamSchema.index({ isActive: 1, isPrivate: 1, name: 1 });

// Virtual for member count
teamSchema.virtual("memberCount").get(function () {
  return this.members?.length || 0;
});

/**
 * Check if the given join code is valid.
 * @param {string} code - The join code to validate.
 * @returns {boolean} true if the join code is valid, false otherwise.
 * A join code is valid if it matches the team's join code, the join code has not expired, and the team is active.
 */
teamSchema.methods.isJoinCodeValid = function (code: string): Promise<boolean> {
  return (
    this.joinCode === code &&
    this.joinCodeExpire &&
    this.joinCodeExpire > new Date()
  );
};

// Ensure user is not already a member of another team
teamSchema.pre("save", async function () {
  const User = mongoose.model("User");

  const users = await User.find({ _id: { $in: this.members } });

  for (const user of users) {
    if (user.teamId && user.teamId.toString() !== this._id.toString()) {
      throw new Error("User already belongs to another team");
    }
  }
});

// Ensure owner is always a member and member limit is not exceeded
teamSchema.pre("save", function () {
  if (
    this.owner &&
    !this.members.some((m) => m.toString() === this.owner.toString())
  ) {
    this.members.push(this.owner);
  }

  if (this.members.length > this.maxMembers) {
    throw new Error("Team member limit exceeded");
  }
});

teamSchema.methods.generateJoinCode = function (): string {
  const code = crypto.randomBytes(3).toString("hex").toUpperCase();
  this.joinCode = `TEAM-${code}`;
  this.joinCodeExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return this.joinCode;
};

const Team = mongoose.model<ITeam>("Team", teamSchema);

export default Team;
