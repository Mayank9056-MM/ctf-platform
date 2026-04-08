import { Types } from "mongoose";
import { config } from "../../config/config";
import { TokenPayload } from "../../middlewares/verifyAuth.middleware";
import User, { IUser } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { uploadOnCloudinary } from "../../utils/cloudinary";
import logger from "../../utils/logger";
import {
  changeCurrentPasswordInput,
  forgotPasswordInput,
  LoginInput,
  OAuthProfileInput,
  RegisterInput,
  resetPasswordInput,
} from "./auth.types";
import { EmailService } from "../../services/emailService";
import crypto from "crypto";
import { refreshTokenService } from "../refreshToken/refreshToken.service";
import mongoose from "mongoose";

class AuthService {
  // Helper methods

  /**
   * Issues a new access and refresh token pair for the given user.
   * @param {IUser} user - The user to issue tokens for.
   * @param {OAuthProfileInput} data - The user's OAuth profile data.
   * @returns {Promise<{accessToken: string, refreshToken: string, user: IUser}>}
   * A promise that resolves to an object containing the access token, refresh token, and user.
   */
  private async issueTokens(user: IUser, data: OAuthProfileInput) {
    const accessToken = user.generateAccessToken();

    const issuedToken = await refreshTokenService.issue({
      userId: user._id,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    });

    return {
      accessToken,
      refreshToken: issuedToken.rawToken,
      user,
    };
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
    const existedUser = await User.findOne({ email: data.email }).select(
      "+password"
    );

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
      const upload = await uploadOnCloudinary(data.avatarLocalPath);

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

  async loginUser(data: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<IUser, "password">;
  }> {
    const user = await User.findOne({ email: data.email }).select("+password");

    if (!user) {
      throw new ApiError(400, "user not found please register");
    }

    if (user.isBanned || user.isDeleted) {
      throw new ApiError(403, "Account is inactive");
    }

    const isPasswordMatch = await user.comparePassword(data.password);

    if (!isPasswordMatch) {
      throw new ApiError(400, "invalid credentials");
    }

    const accessToken = user.generateAccessToken();

    const issuedToken = await refreshTokenService.issue({
      userId: user?._id,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    });

    // remove password
    const userObj = user.toObject();
    delete userObj.password;

    return { accessToken, refreshToken: issuedToken.rawToken, user: userObj };
  }

  /**
   * Authenticates a user with the given OAuth provider and providerId.
   * If a user with the given provider and providerId is found, issues a new access and refresh token pair.
   * If a user with the given email is found, adds the given provider and providerId to the user's providers list and issues a new access and refresh token pair.
   * If a user with the given email is not found, creates a new user with the given email and OAuth provider data, and issues a new access and refresh token pair.
   * @param {OAuthProfileInput} data - The OAuth profile data.
   * @returns {Promise<{accessToken: string, refreshToken: string, user: Omit<IUser, "password">}>}
   */
  async oauthLogin(data: OAuthProfileInput) {
    let user = await User.findOne({
      "providers.provider": data.provider,
      "providers.providerId": data.providerId,
    });

    if (user) {
      if (user.isBanned || user.isDeleted) {
        throw new ApiError(403, "Account is inactive");
      }

      return this.issueTokens(user, data);
    }

    // find by email
    user = await User.findOne({ email: data.email });

    if (user) {
      if (user.isBanned || user.isDeleted) {
        throw new ApiError(403, "Account is inactive");
      }

      const alreadyLinked = user.providers.some(
        (p) => p.provider === data.provider && p.providerId === data.providerId
      );

      if (!alreadyLinked) {
        user.providers.push({
          provider: data.provider,
          providerId: data.providerId,
        });

        await user.save({ validateBeforeSave: false });
      }

      return this.issueTokens(user, data);
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

    return this.issueTokens(user, data);
  }

  /**
   * Changes the current password for a user
   * @param {changeCurrentPasswordInput} data - The data to change the current password with
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      user.password = data.newPassword; // auto encrypt before save

      await user.save({ validateBeforeSave: false });

      await refreshTokenService.revokeAllForUser(user._id, "password_change");

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
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

    await refreshTokenService.revokeAllForUser(user._id, "password_reset");

    return;
  }
}

export const authService = new AuthService();
