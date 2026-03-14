import { Types } from "mongoose";
import { config } from "../../config/config";
import { TokenPayload } from "../../middlewares/verifyAuth.middleware";
import User, { IUser } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../../utils/cloudinary";
import logger from "../../utils/logger";
import {
  changeCurrentPasswordInput,
  forgotPasswordInput,
  LoginInput,
  OAuthProfileInput,
  RegisterInput,
  resetPasswordInput,
  updateAccountDetailsInput,
  updateUserAvatarInput,
} from "./auth.types";
import jwt from "jsonwebtoken";
import { EmailService } from "../../services/emailService";
import crypto from "crypto";

type tokenPair = {
  accessToken: string;
  refreshToken: string;
};

class AuthService {
  // helper methods

  /**
   * Issues a new access token and refresh token for a user and saves it to the database.
   * @param {IUser} user - The user to issue the tokens for.
   * @returns {Promise<{user: IUser, accessToken: string, refreshToken: string}>} - A promise that resolves to an object containing the user, access token and refresh token.
   * @throws {ApiError} - If there is an error generating the tokens or saving the user.
   */
  private async issueTokens(user: IUser) {
    const { accessToken, refreshToken } =
      await this.generateAccessAndRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { user, accessToken, refreshToken };
  }

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
   * Registers a new user or updates an existing user created via OAuth.
   * If the user already has a password, a 409 error is thrown.
   * If the user is created via OAuth, their password is updated.
   * If the user is newly created, they are created with a local provider.
   * @param {RegisterInput} data - The user data to register the user with.
   * @returns {Promise<IUser>} - A promise that resolves to the registered user.
   * @throws {ApiError} - If the user already exists and has a password, or if there is an error registering the user.
   */
  async registerUser(data: RegisterInput): Promise<IUser> {
    const existedUser = await User.findOne({ email: data.email });

    if (existedUser) {
      // If user already has password -> normal login

      if (existedUser.password) {
        throw new ApiError(409, "User already exists. Please login.");
      }

      // User created via OAuth

      existedUser.password = data.password;

      const alreadyLinked = existedUser.providers.some(
        (p) => p.provider === "local"
      );

      if (!alreadyLinked) {
        existedUser.providers.push({
          provider: "local",
          providerId: existedUser.email,
        });
      }

      await existedUser.save();

      return existedUser;
    }

    let avatarUrl: string | null;
    let avatarPublicId: string;

    try {
      const upload = await uploadOnCloudinary(data.avatarBuffer);

      if (!upload?.secure_url) {
        throw new ApiError(500, "something went wrong while uploading avatar");
      }

      avatarUrl = upload.secure_url;
      avatarPublicId = upload.public_id;
    } catch (error) {
      logger.error("something went wrong while uploading avatar", error);
      throw new ApiError(400, "something went wrong while uploading avatar");
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      providers: [{ provider: "local", providerId: data.email }],
      avatar: {
        url: avatarUrl,
        publicId: avatarPublicId,
      },
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

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    // remove password
    const userObj = user.toObject();
    delete userObj.password;

    return { accessToken, refreshToken, user: userObj };
  }

  /**
   * Logs in a user with their OAuth profile
   * @param {OAuthProfileInput} data - OAuth profile data
   * @returns {Promise<{accessToken: string, refreshToken: string, user: IUser}>} - Object containing access token, refresh token and user object
   * @throws {ApiError} - If user is not found or invalid credentials are provided
   */
  async oauthLogin(data: OAuthProfileInput) {
    let user = await User.findOne({
      "providers.provider": data.provider,
      "providers.providerId": data.providerId,
    });

    // user exits with provider
    if (user) {
      return await this.issueTokens(user);
    }

    // find by email

    user = await User.findOne({ email: data.email });

    if (user) {
      const alreadyLinked = user.providers.some(
        (p) => p.provider === data.provider
      );

      if (!alreadyLinked) {
        user.providers.push({
          provider: data.provider,
          providerId: data.providerId,
        });

        await user.save();
      }

      return this.issueTokens(user);
    }

    // create new user

    user = await User.create({
      email: data.email,
      fullName: data.fullName,
      providers: [
        {
          provider: data.provider,
          providerId: data.providerId,
        },
      ],
      avatar: data.avatar ? { url: data.avatar, publicId: "" } : undefined,
      isVerified: true,
    });

    return this.issueTokens(user);
  }

  /**
   * Refresh access token
   * @param {string} incomingRefreshToken - incoming refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string}>} - Object containing access token and refresh token
   * @throws {ApiError} - If invalid refresh token is provided
   */
  async refreshAccessToken(incomingRefreshToken: string) {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      config.REFRESH_TOKEN_SECRET
    ) as TokenPayload;

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(403, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(403, "Invalid refresh token");
    }

    const { accessToken, refreshToken } =
      await this.generateAccessAndRefreshToken(user._id.toString());

    return { accessToken, refreshToken };
  }

  /**
   * Updates user account details.
   * @param {updateAccountDetailsInput} data - object containing fields to be updated
   * @param {Types.ObjectId} userId - id of the user to be updated
   * @returns {Promise<IUser>} - updated user object
   * @throws {ApiError} - If no fields are provided for update, if email already exists or if there is an error while updating user
   */
  async updateAccountDetails(
    data: updateAccountDetailsInput,
    userId: Types.ObjectId
  ): Promise<IUser> {
    // remove undefined fields
    const updateData: Record<string, unknown> = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    // check email if exitsts or not
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new ApiError(409, "Email already in use");
      }

      updateData.isVerified = false;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      throw new ApiError(404, "Somthing went wrong while updating user");
    }

    return updatedUser;
  }

  /**
   * Update user avatar
   * @param {updateUserAvatarInput} data - The data to update user avatar with
   * @param {IUser} user - The user to update avatar for
   * @returns {Promise<IUser>} - A promise that resolves to the updated user
   * @throws {ApiError} - If there is an error while updating user avatar
   */
  async updateUserAvatar(data: updateUserAvatarInput, user: IUser) {
    let avatarUrl;
    let avatarPublicId;

    try {
      const res = await uploadOnCloudinary(data.avatarBuffer);

      if (!res?.secure_url) {
        throw new ApiError(500, "Something went wrong while uplading avatar");
      }

      avatarUrl = res.secure_url;
      avatarPublicId = res.public_id;
    } catch (error) {
      console.log(error);
      throw new ApiError(500, "Something went wrong while uploading avatar");
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        avatar: {
          url: avatarUrl,
          publicId: avatarPublicId,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      throw new ApiError(500, "Somthing went wrong while updating user avatar");
    }

    // delete old avatar if exists
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    return updatedUser;
  }

  /**
   * Change the password of a user
   * @param {changeCurrentPasswordInput} data - The data to change the password with
   * @throws {ApiError} - If the user is not found, or if the old password is invalid, or if the new password and confirm password do not match
   * @returns {Promise<void>} - A promise that resolves when the password has been changed successfully
   */
  async changePassword(data: changeCurrentPasswordInput) {
    const user = await User.findById(data.userId).select("+password");

    if (!user) {
      throw new ApiError(400, "user not found");
    }

    const isPasswordValid = await user.comparePassword(data.oldPassword);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid old password");
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new ApiError(406, "confirm password not match");
    }

    user.password = data.newPassword; // auto encrypt before save

    await user.save({ validateBeforeSave: false });

    return;
  }

  /**
   * Forgot password
   * @param {forgotPasswordInput} data - The data to forgot the password with
   * @throws {ApiError} - If the user is not found, or if the email could not be sent
   * @returns {Promise<void>} - A promise that resolves when the password reset email has been sent successfully
   */
  async forgotPassword(data: forgotPasswordInput) {
    const user = await User.findOne({ email: data.email });

    if (!user) {
      return;
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    try {
      await EmailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      throw new ApiError(500, "Failed to send password reset email");
    }

    return;
  }

  /**
   * Resets the password of a user using a reset token
   * @param {resetPasswordInput} data - The data to reset the password with
   * @throws {ApiError} - If the reset token is invalid or expired
   * @returns {Promise<void>} - A promise that resolves when the password has been reset successfully
   */
  async resetPassword(data: resetPasswordInput) {
    const user = await User.findOne({
      resetPasswordToken: crypto
        .createHash("sha256")
        .update(data.token)
        .digest("hex"),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = data.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return;
  }
}

export const authService = new AuthService();
