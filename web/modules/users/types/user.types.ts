export interface UserProfile {
  _id: string;
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
  teamId?: string;
  solvedChallenges: string[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  score: number;
  isVerified: boolean;
  password?: string;
  role: "user" | "admin" | "superadmin";
  lastActive: Date;
  isBanned: boolean;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  hintsPurchased?: {
    challengeId: string;
    hintIndex: number;
    purchasedAt: Date;
  }[];
  country?: string;
  isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfilePayload {
  username?: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
