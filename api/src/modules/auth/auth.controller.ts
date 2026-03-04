import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validator";
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

export { register, login, logout };
