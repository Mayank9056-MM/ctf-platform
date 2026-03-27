import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import { userService } from "./user.service";
import { updateAccountDetailsSchema } from "./user.validate";

const currentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const data = parseBody(updateAccountDetailsSchema, req.body);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const updatedUser = await userService.updateAccountDetails(
    data,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "User details updated successfully"
      )
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const avatarBuffer = req.file?.buffer;

  if (!avatarBuffer) {
    throw new ApiError(400, "Avatar is required");
  }

  const updatedUser = await userService.updateUserAvatar(
    { avatarBuffer },
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

export { currentUser, updateAccountDetails, updateUserAvatar };
