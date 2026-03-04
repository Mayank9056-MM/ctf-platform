import User, { IUser } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { uploadOnCloudinary } from "../../utils/cloudinary";
import logger from "../../utils/logger";
import { LoginInput, RegisterInput } from "./auth.types";

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

  /**
   * Registers a new user based on the provided data.
   * @param {RegisterInput} data - The data to register the user with.
   * @returns {Promise<User>} - A promise that resolves to the newly registered user.
   * @throws {ApiError} - If the user already exists, or if there is an error while registering the user.
   */
  async registerUser(data: RegisterInput): Promise<IUser> {
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

    return user;
  }

  /**
   * Login user
   * @param {LoginInput} data - Email and password of the user
   * @returns {Promise<{accessToken: string, refreshToken: string, user: IUser}>} - Object containing access token, refresh token and user object
   * @throws {ApiError} - If user is not found or invalid credentials are provided
   */
  async loginUser(data: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<IUser, "password">;
  }> {
    const user = await User.findOne({ email: data.email }).select("+password");

    if (!user) {
      throw new ApiError(400, "user not found please register");
    }

    const isPasswordMatch = await user.comparePassword(data.password);

    if (!isPasswordMatch) {
      throw new ApiError(400, "invalid credentials");
    }

    const { accessToken, refreshToken } =
      await this.generateAccessAndRefreshToken(user._id.toString());

    // remove password
    const userObj = user.toObject();
    delete userObj.password;

    return { accessToken, refreshToken, user: userObj };
  }

  // OAuth Login (Google/Github)
  async oauthLogin() {}

  async logoutUser() {}
}

export const authService = new AuthService();
