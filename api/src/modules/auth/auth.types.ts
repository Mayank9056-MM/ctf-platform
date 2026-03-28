import { Types } from "mongoose";

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  provider: "local";
  avatarLocalPath: string;
};

export type OAuthProfileInput = {
  provider: "google" | "github";
  fullName: string;
  providerId: string;
  email: string;
  avatar?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type changeCurrentPasswordInput = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  userId: Types.ObjectId;
};

export type forgotPasswordInput = {
  email: string;
};

export type resetPasswordInput = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};
