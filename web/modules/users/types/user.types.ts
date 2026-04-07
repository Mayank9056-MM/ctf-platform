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
  score: number;
  isVerified: boolean;
  password?: string;
  role: "user" | "admin" | "superadmin";
  lastActive: string;
  isBanned: boolean;
  country?: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  username?: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
