import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { challengeFilterSchema } from "./challenge.validator";
import { ApiError } from "../../utils/ApiError";
import { challengeService } from "./challenge.service";
import { ApiResponse } from "../../utils/ApiResponse";

// helpers
const getIp = (req: Request): string => {
  const forwarded = (req.headers["x-forwarded-for"] as string | undefined)
    ?.split(",")[0]
    ?.trim();

  return forwarded || req.socket?.remoteAddress || "unknown";
};

// player controllers
const getChallenges = asyncHandler(async (req, res) => {
  const parsed = challengeFilterSchema.safeParse(req.query);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error.message || "Something went wrong while fetching challenges"
    );
  }

  const result = await challengeService.getChallenges(
    parsed.data,
    req.user!._id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        challenges: result.challenges,
        meta: {
          page: result.page,
          limti: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
          hasNext: result.page * result.limit < result.total,
          hasPrev: result.page > 1,
        },
      },
      "Challenges retrieved successfully"
    )
  );
});

const getChallengeDetail = asyncHandler(async (req, res) => {});

const submitFlag = asyncHandler(async (req, res) => {});

const purchaseHint = asyncHandler(async (req, res) => {});

const getChallengeSolves = asyncHandler(async (req, res) => {});

// admin controllers

const adminGetChallenges = asyncHandler(async (req, res) => {});

const adminCreateChallenge = asyncHandler(async (req, res) => {});

const adminUpdateChallenge = asyncHandler(async (req, res) => {});

const adminPublishChallenge = asyncHandler(async (req, res) => {});

const adminUnpublishChallenge = asyncHandler(async (req, res) => {});

const adminDeleteChallenge = asyncHandler(async (req, res) => {});

const adminRemoveHint = asyncHandler(async (req, res) => {});

const adminAttachment = asyncHandler(async (req, res) => {});

const adminRemoveAttachment = asyncHandler(async (req, res) => {});

const adminGetStats = asyncHandler(async (req, res) => {});

const adminGetSubmissions = asyncHandler(async (req, res) => {});

export { getChallenges };
