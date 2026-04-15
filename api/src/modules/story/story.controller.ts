import { Request, Response, Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  addCharacterSchema,
  advanceNodeSchema,
  createChapterSchema,
  createNodeSchema,
  createStorySchema,
  makeChoiceSchema,
  setStoryStatusSchema,
  storyFiltersSchema,
  updateChapterSchema,
  updateNodeSchema,
  updateStorySchema,
} from "./story.validator";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { storyService } from "./story.service";
import Story from "../../models/story.model";
import { parseBody } from "../../utils/helpers";

// Helpers

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

// Player Controllers

const getStories = asyncHandler(async (req, res) => {
  const data = parseBody(storyFiltersSchema, req.query);

  const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
  if (!isAdmin) {
    data.status = "published";
  }

  const result = await storyService.getStories(data, req.user?._id);

  if (!result) {
    throw new ApiError(500, "Something went wrong while getting stories");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stories: result.stories,
        meta: buildMeta(result.page, result.limit, result.total),
      },
      "Stories retrieved"
    )
  );
});

const getStoryDetail = asyncHandler(async (req, res) => {
  const idOrSlug = req.params.idOrSlug as string;

  if (!idOrSlug) {
    throw new ApiError(400, "Missing id or slug");
  }

  const adminView =
    !!req.user && ["admin", "superadmin"].includes(req.user.role);

  const story = await storyService.getStoryDetail(
    idOrSlug,
    req.user?._id,
    adminView
  );

  if (!story) {
    throw new ApiError(500, "Something went wrong while getting story");
  }

  return res.status(200).json(new ApiResponse(200, story, "Story retrieved"));
});

const startStory = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const progress = await storyService.startStory({
    storyId: id,
    userId: req.user!._id,
  });

  if (!progress) {
    throw new ApiError(500, "Something went wrong while starting story");
  }

  return res.status(200).json(new ApiResponse(200, progress, "Story started"));
});

const getProgress = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const progress = await storyService.getProgress(id, req.user!._id);

  if (!progress) {
    throw new ApiError(500, "Something went wrong while getting progress");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        progress,
        progress ? "Progress retrieved" : "You have not started this story"
      )
    );
});

const advanceNode = asyncHandler(async (req, res) => {
  const { id, nodeId, chapterId } = req.params as Record<string, string>;

  if (!id || !nodeId || !chapterId) {
    throw new ApiError(400, "Missing id, nodeId, or chapterId");
  }

  const data = parseBody(advanceNodeSchema, req.body);

  const result = await storyService.advanceNode({
    storyId: id,
    chapterId: chapterId,
    nodeId: nodeId,
    userId: req.user!._id,
    elapsedSeconds: data.elapsedSeconds,
  });

  if (!result) {
    throw new ApiError(500, "Something went wrong while advancing node");
  }

  const message = result.storyCompleted
    ? "🎉 Story complete!"
    : result.chapterCompleted
      ? "Chapter complete! Moving to next chapter."
      : "Node advanced";

  return res.status(200).json(new ApiResponse(200, result, message));
});

const makeChoice = asyncHandler(async (req, res) => {
  const { storyId, chapterId, nodeId } = req.params as Record<string, string>;

  if (!storyId || !chapterId || !nodeId) {
    throw new ApiError(400, "Missing id, nodeId, or chapterId");
  }

  const data = parseBody(makeChoiceSchema, req.body);

  const result = await storyService.makeChoice({
    storyId: storyId,
    chapterId: chapterId,
    nodeId: nodeId,
    userId: req.user!._id,
    choiceLabel: data.choiceLabel,
  });

  if (!result) {
    throw new ApiError(500, "Something went wrong while making choice");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Choice "${data.choiceLabel}" recorded. Story continues...`
      )
    );
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  const leaderboard = await storyService.getStoryLeaderboard(id, limit);

  if (!leaderboard) {
    throw new ApiError(
      500,
      "Something went wrong while retrieving leaderboard"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, leaderboard, "Story leaderboard retrieved"));
});

// Admin: Story Controllers

const adminCreateStory = asyncHandler(async (req, res) => {
  const data = parseBody(createStorySchema, req.body);

  const story = await storyService.createStory({
    ...data,
    authorId: req.user!._id,
  });

  if (!story) {
    throw new ApiError(500, "Something went wrong while creating story");
  }

  return res.status(201).json(new ApiResponse(201, story, "Story created"));
});

const adminUpdateStory = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const data = parseBody(updateStorySchema, req.body);

  const story = await storyService.updateStory({
    storyId: id,
    requesterId: req.user!._id,
    ...data,
  } as Parameters<typeof storyService.updateStory>[0]);

  if (!story) {
    throw new ApiError(500, "Something went wrong while updating story");
  }

  return res.status(200).json(new ApiResponse(200, story, "Story updated"));
});

const adminSetStoryStatus = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const data = parseBody(setStoryStatusSchema, req.body);

  const story = await storyService.setStoryStatus(id, data.status);

  if (!story) {
    throw new ApiError(500, "Something went wrong while setting story status");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, story, `Story is now ${data.status}`));
});

const adminDeleteStory = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  await storyService.deleteStory(id);
  return res.status(200).json(new ApiResponse(200, {}, "Story deleted"));
});

const adminAddCharacter = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const data = parseBody(addCharacterSchema, req.body);

  const story = await Story.findById(id);

  if (!story) throw new ApiError(400, "Story not found");

  if (story.characters.some((c) => c.id === data.id)) {
    throw new ApiError(409, `Character with id "${data.id}" already exists`);
  }
  story.characters.push(data);

  await story.save({ validateBeforeSave: false });

  return res.status(201).json(new ApiResponse(201, story, "Character added"));
});

const adminRemoveCharacter = asyncHandler(async (req, res) => {
  const { id, characterId } = req.params as Record<string, string>;

  if (!id || !characterId) {
    throw new ApiError(400, "Missing id or characterId");
  }

  const story = await Story.findById(id);

  if (!story) throw new ApiError(404, "Story not found");

  const idx = story.characters.findIndex((c) => c.id === characterId);

  if (idx === -1) throw new ApiError(404, "Character not found");

  story.characters.splice(idx, 1);

  await story.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, story, "Character removed"));
});

const adminCreateChapter = asyncHandler(async (req, res) => {
  const id = req.params.id as string;

  if (!id) {
    throw new ApiError(400, "Missing id");
  }

  const data = parseBody(createChapterSchema, req.body);

  const chapter = await storyService.createChapter({
    ...data,
    storyId: id,
    requesterId: req.user!._id,
  });

  if (!chapter) {
    throw new ApiError(500, "Something went wrong while creating chapter");
  }

  return res.status(201).json(new ApiResponse(201, chapter, "Chapter created"));
});

const adminUpdateChapter = asyncHandler(async (req, res) => {
  const { id, chapterId } = req.params as Record<string, string>;

  if (!id || !chapterId) {
    throw new ApiError(400, "Missing id or chapterId");
  }

  const parsed = updateChapterSchema.safeParse(req.body);

  const data = parsed.data;

  const chapter = await storyService.updateChapter({
    ...data,
    chapterId: chapterId,
    storyId: id,
    requesterId: req.user!._id,
  } as Parameters<typeof storyService.updateChapter>[0]);

  if (!chapter) {
    throw new ApiError(500, "Something went wrong while updating chapter");
  }

  return res.status(200).json(new ApiResponse(200, chapter, "Chapter updated"));
});

const adminValidateChapter = asyncHandler(async (req, res) => {
  const { id, chapterId } = req.params as Record<string, string>;

  if (!chapterId || !id) {
    throw new ApiError(400, "Missing id or chapterId");
  }

  const result = await storyService.validateChapterGraph(chapterId, id);

  if (!result) {
    throw new ApiError(500, "Something went wrong while validating chapter");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.valid
          ? "Chapter graph is valid ✅"
          : `Chapter graph has ${result.errors.length} error(s) ❌`
      )
    );
});

const adminPublishChapter = asyncHandler(async (req, res) => {
  const { chapterId, id } = req.params as Record<string, string>;

  if (!chapterId || !id) {
    throw new ApiError(400, "Missing id or chapterId");
  }

  const { chapter, validation } = await storyService.publishChapter(
    chapterId,
    id
  );

  if (!chapter) {
    throw new ApiError(500, "Something went wrong while publishing node");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { chapter, validation }, "Chapter published"));
});

const adminDeleteChapter = asyncHandler(async (req, res) => {
  const { chapterId, id } = req.params as Record<string, string>;

  if (!id || !chapterId) {
    throw new ApiError(400, "Missing id or chapterId");
  }

  await storyService.deleteChapter(chapterId, id);
  return res.status(200).json(new ApiResponse(200, {}, "Chapter deleted"));
});

const adminCreateNode = asyncHandler(async (req, res) => {
  const data = parseBody(createNodeSchema, req.body);

  const chapter = await storyService.createNode({
    ...(data as Record<string, unknown>),
    chapterId: req.params.chapterId,
    storyId: req.params.id,
    requesterId: req.user!._id,
  } as Parameters<typeof storyService.createNode>[0]);

  if (!chapter) {
    throw new ApiError(500, "Something went wrong while creating node");
  }

  return res.status(201).json(new ApiResponse(201, chapter, "Node added"));
});

const adminUpdateNode = asyncHandler(async (req, res) => {
  const { nodeId, chapterId } = req.params as Record<string, string>;

  if (!nodeId || !chapterId) {
    throw new ApiError(400, "Missing nodeId or chapterId");
  }

  const data = parseBody(updateNodeSchema, req.body);

  const chapter = await storyService.updateNode({
    ...(data as Record<string, unknown>),
    nodeId: req.params.nodeId,
    chapterId: req.params.chapterId,
    requesterId: req.user!._id,
  } as Parameters<typeof storyService.updateNode>[0]);

  if (!chapter) {
    throw new ApiError(500, "Something went wrong while updating node");
  }

  return res.status(200).json(new ApiResponse(200, chapter, "Node updated"));
});

const adminDeleteNode = asyncHandler(async (req, res) => {
  const { nodeId, chapterId } = req.params as Record<string, string>;

  if (!nodeId || !chapterId) {
    throw new ApiError(400, "Missing nodeId or chapterId");
  }

  const chapter = await storyService.deleteNode(nodeId, chapterId);

  if (!chapter) {
    throw new ApiError(500, "Something went wrong while deleting node");
  }

  return res.status(200).json(new ApiResponse(200, chapter, "Node deleted"));
});

const adminGetStory = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  if (!id) throw new ApiError(400, "Missing id");

  const story = await storyService.getStoryAdmin(id);

  return res.status(200).json(new ApiResponse(200, story, "Story retrieved"));
});

export {
  getStories,
  getStoryDetail,
  startStory,
  getProgress,
  advanceNode,
  makeChoice,
  getLeaderboard,
  adminCreateStory,
  adminUpdateStory,
  adminSetStoryStatus,
  adminDeleteStory,
  adminAddCharacter,
  adminRemoveCharacter,
  adminCreateChapter,
  adminUpdateChapter,
  adminValidateChapter,
  adminPublishChapter,
  adminDeleteChapter,
  adminCreateNode,
  adminUpdateNode,
  adminDeleteNode,
  adminGetStory,
};
