import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import { extractIp, submissionService } from "./submission.service";
import {
  adminStatsFiltersSchema,
  adminSubmissionFilterSchema,
  mySubmissionsSchema,
  submissionHistorySchema,
  submitFlagSchema,
} from "./submission.validate";

function buildMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

const submitFlag = asyncHandler(async (req, res) => {
  const challengeId = req.params.challengeId as string;

  if (!challengeId) {
    throw new ApiError(400, "Challenge Id missing!");
  }

  const { flag } = parseBody(submitFlagSchema, req.body) as { flag: string };

  const ip = extractIp(
    req.headers["x-forwarded-for"] as string | undefined,
    req.socket?.remoteAddress
  );

  const result = await submissionService.submitFlag({
    userId: req.user!._id,
    teamId: req.user!.teamId,
    challengeId: challengeId,
    flag,
    ip,
    userAgent: req.headers["user-agent"],
  });

  if (!result) {
    throw new ApiError(500, "Something went wrong while submitting flag");
  }

  const statusCode = result.isCorrect ? 200 : 400;

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, result, result.message));
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const filters = parseBody(mySubmissionsSchema, req.query);

  const result = await submissionService.getMySubmissions(
    req.user!._id,
    filters
  );

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while getting your submissions"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        submissions: result.submissions,
        meta: buildMeta(result.page, result.limit, result.total),
      },
      "Your submissions retrieved"
    )
  );
});

const getMyStats = asyncHandler(async (req, res) => {
  const stats = await submissionService.getMyStats(req.user!._id);

  if (!stats) {
    throw new ApiError(500, "Something went wrong while getting your stats");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Your submission stats retrieved"));
});

const getChallengeHistory = asyncHandler(async (req, res) => {
  const challengeId = req.params.challengeId as string;

  if (!challengeId) {
    throw new ApiError(400, "Challenge Id missing!");
  }

  const filters = parseBody(submissionHistorySchema, req.query);

  const result = await submissionService.getChallengeSubmissionHistory(
    req.user!._id,
    challengeId,
    filters
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        submissions: result.submissions,
        meta: buildMeta(result.page, result.limit, result.total),
      },
      "Submission history retrieved"
    )
  );
});

const getChallengeSolves = asyncHandler(async (req, res) => {
  const challengeId = req.params.challengeId as string;

  if (!challengeId) {
    throw new ApiError(400, "Challenge Id missing!");
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

  const result = await submissionService.getChallengeSolves(
    challengeId,
    page,
    limit
  );

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while getting solve challenges"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        solves: result.solves,
        meta: buildMeta(result.page, result.limit, result.total),
      },
      "Challenge solves retrieved"
    )
  );
});

// Admin Controllers

const adminGetSubmissions = asyncHandler(async (req, res) => {
  const filters = parseBody(adminSubmissionFilterSchema, req.query);

  const result = await submissionService.getAdminSubmissions(filters);

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while fetching admin submissions"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        submissions: result.submissions,
        meta: buildMeta(result.page, result.limit, result.total),
      },
      "Submissions retrieved"
    )
  );
});

const adminGetStats = asyncHandler(async (req, res) => {
  const { challengeId, from, to } = parseBody(
    adminStatsFiltersSchema,
    req.query
  ) as { challengeId?: string; from?: Date; to?: Date };

  const stats = await submissionService.getAdminStats(challengeId, from, to);

  if (!stats) {
    throw new ApiError(500, "Something went wrong while getting admin stats");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Submission stats retrieved"));
});

const adminGetSubmissionById = asyncHandler(async (req, res) => {
  const submissionId = req.params.submissionId as string;

  if (!submissionId) {
    throw new ApiError(400, "Submission Id missing!");
  }

  const submission =
    await submissionService.getAdminSubmissionById(submissionId);

  if (!submission) {
    throw new ApiError(500, "Something went wrong while fetching submission");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Submission retrieved"));
});

const adminDeleteSubmission = asyncHandler(async (req, res) => {
  const submissionId = req.params.submissionId as string;

  if (!submissionId) {
    throw new ApiError(400, "Submission Id missing!");
  }

  await submissionService.deleteSubmission(
    submissionId,
    req.user!._id,
    req.user!.username
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Submission deleted and points reversed"));
});

const adminGetUserSubmissions = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;

  if (!userId) {
    throw new ApiError(400, "User Id missing!");
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

  const isCorrect =
    req.query?.isCorrect === "true"
      ? true
      : req.query.isCorrect === "false"
        ? false
        : undefined;

  const result = await submissionService.getUserSubmissions(
    userId,
    page,
    limit,
    isCorrect
  );

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while getting user submissions"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        submissions: result.submissions,
        meta: buildMeta(result.page, result.limit, result.total),
      },
      "User submissions retrieved"
    )
  );
});

export {
  submitFlag,
  getMySubmissions,
  getMyStats,
  getChallengeHistory,
  getChallengeSolves,
  adminGetSubmissions,
  adminGetStats,
  adminGetSubmissionById,
  adminDeleteSubmission,
  adminGetUserSubmissions,
};
