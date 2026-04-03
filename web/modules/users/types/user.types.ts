
export interface UserProfile {
  data: {
    id: string;
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
    teamId?: {
      id: string;
      name: string;
    };
    score: number;
    isVerified: boolean;
    password?: string;
    role: string;
    lastActive: string;
    isBanned: boolean;
    country?: string;
    createdAt: string;
  };
}

export interface UpdateProfilePayload {
  username?: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
