import { Types } from "mongoose";
import User, { IUser } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../../utils/cloudinary";
import { updateAccountDetailsInput, updateUserAvatarInput } from "./user.types";

class UserService {
  /**
   * Updates a user's account details.
   * @param {updateAccountDetailsInput} data - The user data to update with.
   * @param {Types.ObjectId} userId - The id of the user to update.
   * @returns {Promise<IUser>} - A promise which resolves to the updated user.
   * @throws {ApiError} 400 - If no fields are provided for update.
   * @throws {ApiError} 409 - If the email already exists.
   * @throws {ApiError} 404 - If something went wrong while updating the user.
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

    // check email if exists or not
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
      throw new ApiError(404, "Something went wrong while updating user");
    }

    return updatedUser;
  }

  /**
   * Updates the user's avatar
   * @param {updateUserAvatarInput} data - The avatar buffer to update the user's avatar
   * @param {IUser} user - The user object to update the avatar for
   * @returns {Promise<IUser>} - The updated user object
   * @throws {ApiError} - If something went wrong while updating the user's avatar
   */
  async updateUserAvatar(data: updateUserAvatarInput, user: IUser) {
    let avatarUrl;
    let avatarPublicId;

    try {
      const res = await uploadOnCloudinary(data.avatarBuffer);

      if (!res?.secure_url) {
        throw new ApiError(500, "Something went wrong while uploading avatar");
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
      throw new ApiError(
        500,
        "Something went wrong while updating user avatar"
      );
    }

    // delete old avatar if exists
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    return updatedUser;
  }
}

export const userService = new UserService();
