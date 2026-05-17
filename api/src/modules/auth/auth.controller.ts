import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";
import {
  changeCurrentPasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  OAuthProfileSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validator";
import { CookieOptions } from "express";
import { verifyGoogleToken } from "../oauth/google.verify";
import {
  getGithubAccessToken,
  verifyGithubToken,
} from "../oauth/github.verify";
import jwt from "jsonwebtoken";
import { getClientIp, parseBody } from "../../utils/helpers";
import { refreshTokenService } from "../refreshToken/refreshToken.service";
import { config } from "../../config/config";
import ms from "ms";
import { cacheService, revocationCache } from "../../services/cacheService";

const register = asyncHandler(async (req, res) => {
  const data = parseBody(registerSchema, req.body);

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required");
  }

  const userwithPassword = await authService.registerUser({
    ...data,
    avatarLocalPath,
  });

  const user = userwithPassword.toObject();
  delete user.password;

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const data = parseBody(loginSchema, req.body);

  const { accessToken, refreshToken, user } = await authService.loginUser({
    ...data,
    userAgent: req.headers["user-agent"] as string,
    ipAddress: getClientIp(req) as string,
  });

  const isProd = config.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("strict" as const) : ("lax" as const),
    path: "/",
    maxAge: ms(config.ACCESS_TOKEN_EXPIRY as ms.StringValue),
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("strict" as const) : ("lax" as const),
    path: "/",
    maxAge: ms(config.REFRESH_TOKEN_EXPIRY as ms.StringValue),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User login successfully"));
});

const oauthLogin = asyncHandler(async (req, res) => {
  const data = parseBody(OAuthProfileSchema, req.body);

  const { provider, token } = data;

  let profile;

  if (provider === "google") {
    profile = await verifyGoogleToken(token);
  }

  if (provider === "github") {
    const accessToken = await getGithubAccessToken(token);
    profile = await verifyGithubToken(accessToken);
  }

  if (!profile) {
    throw new ApiError(400, "Invalid OAuth provider");
  }

  if (!profile?.email || !profile.providerId) {
    throw new ApiError(401, "Invalid OAuth profile");
  }

  const { user, accessToken, refreshToken } = await authService.oauthLogin({
    email: profile.email,
    fullName: profile.name,
    avatar: profile.avatar,
    provider,
    providerId: profile.providerId,
    userAgent: req.headers["user-agent"] as string,
    ipAddress: getClientIp(req) as string,
  });

  if (!user) {
    throw new ApiError(500, "Something went wrong while login/register user");
  }

  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, user, "User login successfully"));
});

const logout = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  const rawToken = req.cookies?.refreshToken;

  if (rawToken) {
    await refreshTokenService.revokeByRaw(rawToken);
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  const accessToken = req.cookies?.accessToken;
  if (accessToken) {
    const decoded = jwt.decode(accessToken) as { exp: number };
    const ttl = decoded?.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) await revocationCache.blacklistAccessToken(accessToken, ttl);
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const data = parseBody(changeCurrentPasswordSchema, req.body);

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  await authService.changePassword({ ...data, userId: req.user._id });

  res.clearCookie("refreshToken", { path: "/" });
  res.clearCookie("accessToken", { path: "/" });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = parseBody(forgotPasswordSchema, req.body);

  await authService.forgotPassword(data);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "If the email exists, a password reset link has been sent"
      )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  const token = req.params.token as string;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const data = parseBody(resetPasswordSchema, req.body);

  if (data.newPassword !== data.confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  await authService.resetPassword({
    ...data,
    token,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

export {
  register,
  login,
  logout,
  changeCurrentPassword,
  forgotPassword,
  resetPassword,
  oauthLogin,
};
