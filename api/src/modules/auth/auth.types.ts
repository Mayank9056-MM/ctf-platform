import { Types } from "mongoose";

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
