export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  provider: "local";
  avatarPath: string;
};

export type OAuthProfile = {
  provider: "google" | "github";
  fullName: string;
  providerId: string;
  email: string;
  avatar: string;
};
