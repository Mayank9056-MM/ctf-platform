import { ref } from "node:process";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";
import { registerSchema } from "./auth.validator";
import { CookieOptions } from "express";

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

  const { accessToken, refreshToken, user } = await authService.registerUser({
    ...parsed.data,
    avatarPath,
  });

  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

export { register };
