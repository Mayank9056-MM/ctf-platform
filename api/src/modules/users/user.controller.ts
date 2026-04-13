import Submission from "../../models/submission.model";
import Team from "../../models/team.model";
import User from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import { submissionService } from "../submissions/submission.service";
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

const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const user = await User.findOne({ username, isDeleted: false })
    .select("-email -password -resetPasswordToken -emailVerificationToken")
    .lean();

  if (!user) throw new ApiError(404, "User not found");

  // Fetch stats from submissions
  const stats = await submissionService.getMyStats(user._id);

  // Recent solves with challenge details
  const recentSolves = await Submission.find({
    user: user._id,
    isCorrect: true,
  })
    .populate(
      "challenge",
      "title slug category difficulty points currentPoints"
    )
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Team
  const team = user.teamId
    ? await Team.findById(user.teamId).select("name score").lean()
    : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...user,
        stats: {
          ...stats,
          // solvesByCategory: buildCategoryBreakdown(recentSolves),
        },
        recentSolves,
        team,
      },
      "Profile retrieved"
    )
  );
});

export { currentUser, updateAccountDetails, updateUserAvatar, getUserProfile };
