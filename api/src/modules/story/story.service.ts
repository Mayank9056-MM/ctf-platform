import { Types } from "mongoose";
import Story, { IStoryNode, StoryChapter } from "../../models/story.model";
import {
  StartStoryPayload,
  StoryFilters,
  StoryProgressView,
} from "./story.types";
import escapeStringRegexp from "escape-string-regexp";
import { ApiError } from "../../utils/ApiError";
import UserStoryProgress from "../../models/userProgressStory.model";

class StoryService {
  // Helpers

  private async buildProgressView(
    progressId: string,
    _userId: Types.ObjectId
  ): Promise<StoryProgressView> {
    const progress = await UserStoryProgress.findById(progressId).lean();

    if (!progress) {
      throw new ApiError(404, "Progress not found");
    }

    const completedNodeIds = new Set(
      progress.completedNodes.map((n) => n.nodeId.toString())
    );

    // Load current chapters to compute unlocked nodes
    let unlockedNodeIds: string[] = [];

    if (progress.currentChapterId) {
      const chapter = await StoryChapter.findById(
        progress.currentChapterId
      ).lean();

      if (chapter) {
        unlockedNodeIds = this.computeUnlockedNodes(
          chapter.nodes,
          completedNodeIds
        );
      }
    }

    const h = Math.floor(progress.playTimeSeconds / 3600);
    const m = Math.floor((progress.playTimeSeconds % 3600) / 60);
    const playTimeFormatted = h > 0 ? `${h}h ${m}m` : `${m}m`;

    return {
      storyId: progress.story.toString(),
      status: progress.status,
      currentChapterId: progress.currentChapterId?.toString(),
      currentNodeId: progress.currentNodeId?.toString(),
      completedNodeIds: [...completedNodeIds],
      completedChapterIds: progress.completedChapters.map((c) =>
        c.chapterId.toString()
      ),
      totalXpEarned: progress.totalXpEarned,
      playTimeSeconds: progress.playTimeSeconds,
      playTimeFormatted,
      unlockedNodeIds,
    };
  }

  /**
   * Given a flat list of nodes and the set of already-completed node IDs,
   * compute which nodes are currently unlocked (all unlock prerequistites met)
   */
  private computeUnlockedNodes(
    nodes: IStoryNode[],
    completedNodeIds: Set<string>
  ): string[] {
    const completedNodeIdSet = new Set(completedNodeIds);
    return nodes
      .filter((node) => {
        if (node.unlockAfter.length === 0) {
          return true;
        }
        return node.unlockAfter.every((prereq) =>
          completedNodeIdSet.has(prereq.toString())
        );
      })
      .map((node) => node._id.toString());
  }

  /**
   * Check if all required (non-optional) nodes in a chapter are completed.
   */
  private isChapterComplete(
    nodes: IStoryNode[],
    completedNodeIds: Set<string>
  ): boolean {
    const completedNodeIdSet = new Set(completedNodeIds);

    return nodes
      .filter((n) => !n.isOptional && n.type === "challenge")
      .every((n) => completedNodeIdSet.has(n._id.toString()));
  }

  // serives

  /**
   * Fetches a list of stories, with optional filters and pagination.
   *
   * @param filters - A set of filters to apply to the query.
   * @param userId - The ID of the user whose progress should be annotated.
   *
   * @returns An object containing the list of stories, the total number of stories,
   *  the current page number, and the limit per page.
   *
   * @throws {ApiError} 404 - If no stories are found.
   */
  async getStories(filters: StoryFilters, userId?: Types.ObjectId) {
    const { status, difficulty, tags, search, page, limit } = filters;

    const query: Record<string, unknown> = {};

    // Non-admin callers only see published stories
    if (status) {
      query.status = status;
    } else if (!userId) {
      query.status = "published";
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (tags?.length) {
      query.tags = { $in: tags };
    }

    if (search) {
      query.$or = [
        { title: { $regex: escapeStringRegexp(search), $options: "i" } },
        { tags: { $regex: escapeStringRegexp(search), $options: "i" } },
      ];
    }

    const [stories, total] = await Promise.all([
      Story.find(query)
        .select(
          "title slug tagline difficulty status tags coverImageUrl accentColor completionXpBonus completionCount estimatedMinutes publishedAt"
        )
        .populate("author", "username avatar")
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Story.countDocuments(query),
    ]);

    if (!total) {
      throw new ApiError(404, "No stories found");
    }

    // Annotate with user's progress
    let progressMap = new Map<string, string>();

    if (userId) {
      const progresses = await UserStoryProgress.find({
        user: userId,
        story: {
          $in: stories.map((s) => s._id),
        },
      })
        .select("story status")
        .lean();

      progressMap = new Map(
        progresses.map((p) => [p.story.toString(), p.status])
      );
    }

    return {
      stories: stories.map((s) => ({
        ...s,
        userStatus: progressMap.get(s._id.toString()) ?? "not_started",
      })),
      total,
      page,
      limit,
    };
  }

  async getStoryDetail(
    idOrSlug: string,
    userId?: Types.ObjectId,
    adminView = false
  ) {
    const query = Types.ObjectId.isValid(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    if (!adminView) {
      (query as Record<string, unknown>).status = "published";
    }

    const story = await Story.findOne(query)
      .populate("author", "username avatar")
      .lean();

    if (!story) {
      throw new ApiError(404, "Story not found");
    }

    const chaptersQuery: Record<string, unknown> = {
      story: story._id,
      ...(adminView ? {} : { status: "published" }),
    };

    const chapters = await StoryChapter.find(chaptersQuery)
      .sort({ order: 1 })
      .lean();

    // Fetch user progress
    let progress = null;
    let completedNodeIds = new Set<string>();

    if (userId) {
      progress = await UserStoryProgress.findOne({
        user: userId,
        story: story._id,
      }).lean();

      completedNodeIds = new Set(
        progress?.completedNodes.map((n) => n.nodeId.toString()) ?? []
      );
    }

    // Build chapters with node annotations
    const enrichedChapters = chapters.map((chapter) => {
      const unlockedNodeIds = this.computeUnlockedNodes(
        chapter.nodes,
        completedNodeIds
      );

      const chapterCompleted =
        progress?.completedChapters.some(
          (c) => c.chapterId.toString() === chapter._id.toString()
        ) ?? false;

      // For player view: mask challenge details on locked nodes
      const nodes = chapter.nodes
        .sort((a, b) => a.order - b.order)
        .map((node) => {
          const isCompleted = completedNodeIds.has(node._id.toString());
          const isUnlocked =
            adminView || unlockedNodeIds.includes(node._id.toString());

          if (!isUnlocked && !adminView) {
            // Locked node - reveal only minimal info
            return {
              _id: node._id,
              type: node.type,
              order: node.order,
              isOptional: node.isOptional,
              isLocked: true,
              isCompleted: false,
            };
          }

          return {
            ...node,
            isLocked: false,
            isCompleted,
            isUnlocked,
            // Strip postNarrative from uncompleted nodes to avoid spoilers
            postNarrative: isCompleted ? node.postNarrative : null,
          };
        });

      return {
        ...chapter,
        nodes,
        isCompleted: chapterCompleted,
        isUnlocked:
          adminView ||
          chapter.unlockAfterChapters.length === 0 ||
          chapter.unlockAfterChapters.every((id) =>
            progress?.completedChapters.some(
              (c) => c.chapterId.toString() === id.toString()
            )
          ),
      };
    });

    return {
      ...story,
      chapters: enrichedChapters,
      userProgress: progress
        ? {
            status: progress.status,
            totalXpEarned: progress.totalXpEarned,
            completedNodeIds: progress.completedChapters.map((c) =>
              c.chapterId.toString()
            ),
            playTimeSeconds: progress.playTimeSeconds,
          }
        : null,
    };
  }

  async startStory(payload: StartStoryPayload): Promise<StoryProgressView> {
    const { storyId, userId } = payload;

    const story = await Story.findOne({ _id: storyId, status: "published" });

    if (!story) {
      throw new ApiError(404, "Story not found");
    }

    // Idempotent
    const existing = await UserStoryProgress.findOne({
      user: userId,
      story: storyId,
    });

    if (existing) {
      return this.buildProgressView(existing._id.toString(), userId);
    }

    // Find the first chapter and fist node
    const firstChapter = await StoryChapter.findOne({
      story: storyId,
      status: "published",
      unlockAfterChapters: { $size: 0 },
    }).sort({ order: 1 });

    if (!firstChapter) {
      throw new ApiError(
        400,
        "This story has no published chapter yet. Check back soon."
      );
    }

    const firstNode = firstChapter.nodes.sort((a, b) => a.order - b.order)[0];

    const progress = await UserStoryProgress.create({
      user: userId,
      story: storyId,
      status: "in_progress",
      currentChapterId: firstChapter._id,
      currentNodeId: firstNode._id ?? null,
    });

    return this.buildProgressView(progress._id.toString(), userId);
  }
}

export const storyService = new StoryService();
