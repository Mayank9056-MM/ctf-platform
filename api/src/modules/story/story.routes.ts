import express from "express";
import {
  optionalAuth,
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  adminAddCharacter,
  adminCreateChapter,
  adminCreateNode,
  adminCreateStory,
  adminDeleteChapter,
  adminDeleteNode,
  adminDeleteStory,
  adminGetStory,
  adminPublishChapter,
  adminRemoveCharacter,
  adminSetStoryStatus,
  adminUpdateChapter,
  adminUpdateNode,
  adminUpdateStory,
  adminValidateChapter,
  advanceNode,
  getLeaderboard,
  getProgress,
  getStories,
  getStoryDetail,
  makeChoice,
  startStory,
} from "./story.controller";
import { upload } from "../../middlewares/avatarUpload.middleware";

const storyRouter = express.Router();
const adminGuard = [verifyAuth, requireRole("admin", "superadmin")];

// Admin: Story
storyRouter.post(
  "/admin",
  adminGuard,
  upload.single("coverImage"),
  adminCreateStory
);
storyRouter.get("/admin/:id", adminGuard, adminGetStory);
storyRouter.patch(
  "/admin/:id",
  adminGuard,
  upload.single("coverImage"),
  adminUpdateStory
);
storyRouter.patch("/admin/:id/status", adminGuard, adminSetStoryStatus);
storyRouter.delete("/admin/:id", adminGuard, adminDeleteStory);
storyRouter.post(
  "/admin/:id/characters",
  adminGuard,
  upload.single("avatar"),
  adminAddCharacter
);
storyRouter.delete(
  "/admin/:id/characters/:characterId",
  adminGuard,
  adminRemoveCharacter
);

// Admin: Chapter
storyRouter.post(
  "/admin/:id/chapters",
  adminGuard,
  upload.single("coverImage"),
  adminCreateChapter
);
storyRouter.patch(
  "/admin/:id/chapters/:chapterId",
  adminGuard,
  upload.single("coverImage"),
  adminUpdateChapter
);
storyRouter.delete(
  "/admin/:id/chapters/:chapterId",
  adminGuard,
  adminDeleteChapter
);

/**
 * GET  /stories/admin/:id/chapters/:chapterId/validate
 *   → Dry-run graph validation. Returns all errors without publishing.
 *
 * POST /stories/admin/:id/chapters/:chapterId/publish
 *   → Validate graph + publish. Fails if graph has errors.
 */
storyRouter.get(
  "/admin/:id/chapters/:chapterId/validate",
  adminGuard,
  adminValidateChapter
);
storyRouter.post(
  "/admin/:id/chapters/:chapterId/publish",
  adminGuard,
  adminPublishChapter
);

// Admin: Node
storyRouter.post(
  "/admin/:id/chapters/:chapterId/nodes",
  adminGuard,
  adminCreateNode
);
storyRouter.patch(
  "/admin/:id/chapters/:chapterId/nodes/:nodeId",
  adminGuard,
  adminUpdateNode
);
storyRouter.delete(
  "/admin/:id/chapters/:chapterId/nodes/:nodeId",
  adminGuard,
  adminDeleteNode
);

// Player
storyRouter.get("/", optionalAuth, getStories);
storyRouter.get("/:idOrSlug", optionalAuth, getStoryDetail);
storyRouter.post("/:id/start", verifyAuth, startStory);
storyRouter.get("/:id/progress", verifyAuth, getProgress);
storyRouter.get("/:id/leaderboard", getLeaderboard);

/**
 * POST /stories/:id/chapters/:chapterId/nodes/:nodeId/advance
 *   → Complete a cutscene or briefing node. Rejects challenge/choice nodes.
 *   → Body: { elapsedSeconds?: number }
 *
 * POST /stories/:id/chapters/:chapterId/nodes/:nodeId/choose
 *   → Make a choice at a choice node. Changes the active story graph path.
 *   → Body: { choiceLabel: string }
 *   → Returns: nextNodeId (the node the choice routed to)
 */
storyRouter.post(
  "/:id/chapters/:chapterId/nodes/:nodeId/advance",
  verifyAuth,
  advanceNode
);
storyRouter.post(
  "/:id/chapters/:chapterId/nodes/:nodeId/choose",
  verifyAuth,
  makeChoice
);

export default storyRouter;
