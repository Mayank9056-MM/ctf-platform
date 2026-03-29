// Register

import { api } from "@/shared/lib/api";
import {
  AuthResponse,
  MeResponse,
  OAuthCallbackInput,
  RegisterResponse,
} from "../types/auth.types";
import { LoginFormData, RegisterFormData } from "../validation/auth.validator";

export const registerApi = async (
  data: RegisterFormData,
): Promise<RegisterResponse> => {
  const formData = new FormData();
  formData.append("email", data.email);
  formData.append("password", data.password);
  formData.append("fullName", data.fullName);
  if (data.avatar) formData.append("avatar", data.avatar);

  const res = await api.post<RegisterResponse>(
    "/api/v1/auth/register",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return res.data;
};

// Login

export const loginApi = async (data: LoginFormData): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/api/v1/auth/login", data);
  return res.data;
};

// OAuth

export const googleOAuthApi = async (
  payload: OAuthCallbackInput,
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/api/v1/auth/oauth", payload);
  return res.data;
};

export const githubOAuthApi = async (
  payload: OAuthCallbackInput,
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/api/v1/auth/oauth", payload);
  return res.data;
};

// Logout

export const logoutApi = async (): Promise<void> => {
  await api.post("/api/v1/auth/logout");
};

// Me

export const getMeApi = async (): Promise<MeResponse> => {
  const res = await api.get<MeResponse>("/api/v1/user/current-user");
  return res.data;
};

// Refresh

export const refreshTokenApi = async (): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/api/v1/auth/refresh");
  return res.data;
};

// Forgot Password

export const forgotPasswordApi = async (email: string): Promise<void> => {
  await api.post("/api/v1/auth/forgot-password", { email });
};

// Resend Verification

export const resendVerificationApi = async (): Promise<void> => {
  await api.post("/api/v1/auth/resend-verification");
};
