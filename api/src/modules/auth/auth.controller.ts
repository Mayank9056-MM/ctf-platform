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
  updateAccountDetailsSchema,
} from "./auth.validator";
import { CookieOptions } from "express";
import User from "../../models/user.model";
import { verifyGoogleToken } from "../oauth/google.verify";
import { verifyGithubToken } from "../oauth/github.verify";

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

const oauthLogin = asyncHandler(async (req, res) => {
  const parsed = OAuthProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error?.message || "Something went wrong while login user"
    );
  }

  const { provider, token } = parsed.data;

  let profile;

  if (provider === "google") {
    profile = await verifyGoogleToken(token);
  }

  if (provider === "github") {
    profile = await verifyGithubToken(token);
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
  });

  if (!user) {
    throw new ApiError(500, "Something went wrong while login/register user");
  }

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

const currentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const parsed = updateAccountDetailsSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error?.message || "Something went wrong while updating details"
    );
  }

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const updatedUser = await authService.updateAccountDetails(
    parsed.data,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "User details updated succesfully"
      )
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const avatarPath = req.file?.path;

  if (!avatarPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const updatedUser = await authService.updateUserAvatar(
    { avatarPath },
    req.user
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "User avatar updated successfully"
      )
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error?.message || "Something went wrong while resetting password"
    );
  }

  await authService.forgotPassword(parsed.data);

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

  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error?.message || "Something went wrong while resetting password"
    );
  }

  await authService.resetPassword({
    ...parsed.data,
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
  refreshAccessToken,
  changeCurrentPassword,
  currentUser,
  updateAccountDetails,
  updateUserAvatar,
  forgotPassword,
  resetPassword,
  oauthLogin,
};
