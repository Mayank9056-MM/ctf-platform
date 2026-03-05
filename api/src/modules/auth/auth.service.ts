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
      throw new ApiError(409, "user already exists please login");
    }

    let avatarUrl: string | null;
    let avatarPublicId: string;

    if (data.avatarPath) {
      try {
        const upload = await uploadOnCloudinary(data.avatarPath);

        if (!upload?.secure_url) {
          throw new ApiError(
            500,
            "something went wrong while uploading avatar"
          );
        }

        avatarUrl = upload.secure_url;
        avatarPublicId = upload.public_id;
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

    // remove password
    const userObj = user.toObject();
    delete userObj.password;

    return { accessToken, refreshToken, user: userObj };
  }

  // OAuth Login (Google/Github)
  async oauthLogin() {}

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

  async updateAccountDetails(
    data: updateAccountDetailsInput,
    userId: Types.ObjectId
  ) {
    // remove undefined fields
    const updateData = Object.fromEntries(
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

  async updateUserAvatar(data: updateUserAvatarInput, user: IUser) {
    let avatarUrl;
    let avatarPublicId;

    try {
      const res = await uploadOnCloudinary(data.avatarPath);

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
