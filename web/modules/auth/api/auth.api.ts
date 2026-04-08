// Register

import { api } from "@/shared/lib/api";
import {
  AuthResponse,
  ChangePasswordInput,
  OAuthCallbackInput,
  RegisterResponse,
  ResetPasswordInput,
} from "../types/auth.types";
import { LoginFormData, RegisterFormData } from "../schema/auth.schema";

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
  const res = await api.post("/api/v1/auth/logout");
  console.log("logout ", res);
  return res.data.data;
};

// Forgot Password

export const forgotPasswordApi = async (email: string): Promise<void> => {
  await api.post("/api/v1/auth/forgot-password", { email });
};

// change password

export const changePasswordApi = async (
  data: ChangePasswordInput,
): Promise<void> => {
  console.log("I have called change password api");
  const res = await api.post("/api/v1/auth/change-password", {
    data,
  });

  console.log(res, "change password");

  return res.data;
};

// reset password

export const resetPasswordApi = async (
  data: ResetPasswordInput,
): Promise<void> => {
  console.log("I have called reset password api");
  const res = await api.post(`/api/v1/auth/reset-password/${data.token}`, {
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  });

  console.log(res, "reset password");

  return res.data;
};

// Resend Verification

export const resendVerificationApi = async (): Promise<void> => {
  await api.post("/api/v1/auth/resend-verification");
};
