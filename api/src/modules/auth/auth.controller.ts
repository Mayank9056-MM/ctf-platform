import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";
import {
  changeCurrentPasswordSchema,
  loginSchema,
  registerSchema,
} from "./auth.validator";
import { CookieOptions } from "express";
import User from "../../models/user.model";

const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  console.log(parsed, "parsed");

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error?.message || "Something went wrong while registering user"
    );
  }

  const avatarPath = req.file?.path;

  if (!avatarPath) {
    throw new ApiError(400, "avatar is required");
  }

  const user = await authService.registerUser({
    ...parsed.data,
    avatarPath,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error?.message || "Something went wrong while login user"
    );
  }

  const { accessToken, refreshToken, user } = await authService.loginUser({
    ...parsed.data,
  });

  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, user, "User login successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; // for mobile app

  if (!incomingRefreshToken) {
    throw new ApiError(401, "refresh token is required");
  }

  const { accessToken, refreshToken } =
    await authService.refreshAccessToken(incomingRefreshToken);

  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {}, "Access token refreshed successfully"));
});

const logout = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $unset: {
      refreshToken: 1,
    },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const parsed = changeCurrentPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error?.message || "Something went wrong while changing password"
    );
  }

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  await authService.changePassword({ ...parsed.data, userId: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const currentUser = asyncHandler(async (req, res) => {});

const updateAccountDetails = asyncHandler(async (req, res) => {});

const updateUserAvatar = asyncHandler(async (req, res) => {});

const changeUserPassword = asyncHandler(async (req, res) => {});

const forgotPassword = asyncHandler(async (req, res) => {});

const resetPassword = asyncHandler(async (req, res) => {});

export { register, login, logout, refreshAccessToken, changeCurrentPassword };
