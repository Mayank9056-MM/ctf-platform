import User from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadOnCloudinary } from "../../utils/cloudinary";
import logger from "../../utils/logger";
import { RegisterInput } from "./auth.types";

type tokenPair = {
  accessToken: string;
  refreshToken: string;
};

class AuthService {
  // helper methods

  // helper functions

  /**
   * Generates an access token and refresh token for a user based on their id.
   * @param {string} userId - The id of the user.
   * @returns {Promise<{accessToken: string, refreshToken: string}>} - A promise that resolves to an object containing the access token and refresh token.
   * @throws {ApiError} - If the user is not found or if there is an error generating the tokens.
   */
  async generateAccessAndRefreshToken(userId: string): Promise<tokenPair> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(400, "user not found please register");
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;

      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error("error generating access and refresh token", error);
      throw new ApiError(
        500,
        "something went wrong while generating access token and refresh token"
      );
    }
  }

  // main methods
  async registerUser(data: RegisterInput) {
    const existedUser = await User.findOne({ email: data.email });

    if (existedUser) {
      throw new ApiError(400, "user already exists please login");
    }

    let avatarUrl: string | undefined;

    if (data.avatarPath) {
      try {
        const upload = await uploadOnCloudinary(data.avatarPath);

        if (!upload?.secure_url) {
          throw new ApiError(
            400,
            "something went wrong while uploading avatar"
          );
        }

        avatarUrl = upload.secure_url;
      } catch (error) {
        logger.error("something went wrong while uploading avatar", error);
        throw new ApiError(400, "something went wrong while uploading avatar");
      }
    } else {
      throw new ApiError(400, "avatar is required");
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      provider: data.provider,
      avatar: avatarUrl,
    });

    if (!user) {
      throw new ApiError(400, "something went wrong while registering user");
    }

    const { accessToken, refreshToken } =
      await this.generateAccessAndRefreshToken(user._id.toString());

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async loginUser() {}

  // OAuth Login (Google/Github)
  async oauthLogin() {}

  async logoutUser() {}
}

export const authService = new AuthService();
