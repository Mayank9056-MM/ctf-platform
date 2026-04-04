import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import { parseBody } from "../../utils/helpers";
import {
  adminRecomputeSchema,
  leaderboardQuerySchema,
} from "./leaderboard.validators";
import { LeaderboardScope } from "../../models/leaderboard.model";
import { leaderboardService } from "./leaderboard.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

// GET /leaderboard

export const getLeaderboard = asyncHandler(async (req, res) => {
  const query = parseBody(leaderboardQuerySchema, req.query) as {
    scope: LeaderboardScope;
    eventId?: string;
    page: number;
    limit: number;
  };

  const result = await leaderboardService.getLeaderboard(
    query,
    req.user?._id as Types.ObjectId | undefined
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Leaderboard retrieved"));
});

// GET /leaderboard/me

export const getMyRank = asyncHandler(async (req, res) => {
  const userId = req.user!._id as Types.ObjectId;

  // Fetch global_user board and find this user
  const board = await leaderboardService.getLeaderboard(
    { scope: "global_user", page: 1, limit: 1 },
    userId
  );

  if (!board.myEntry) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { rank: null, message: "No solves yet" },
          "Rank not available"
        )
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, board.myEntry, "Your rank retrieved"));
});

// Admin: POST /admin/leaderboard/recompute
export const adminRecompute = asyncHandler(async (req, res) => {
  const { scope, eventId, all } = parseBody(
    adminRecomputeSchema,
    req.query
  ) as {
    scope?: LeaderboardScope;
    eventId?: string;
    all?: boolean;
  };

  if (all) {
    const results = await leaderboardService.recomputeStale();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { recomputed: results },
          `Recomputed ${results.length} stale leaderboard(s)`
        )
      );
  }

  if (!scope) {
    throw new ApiError(400, "Provide scope= or all=true");
  }

  const eventObjId = eventId ? new Types.ObjectId(eventId) : undefined;

  const t = Date.now();
  await leaderboardService.recompute(scope, eventObjId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { scope, durationMs: Date.now() - t },
        "Leaderboard recomputed"
      )
    );
});
