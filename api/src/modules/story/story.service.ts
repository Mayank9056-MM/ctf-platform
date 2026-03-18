import { Types } from "mongoose";
import Story, { IStoryNode, StoryChapter } from "../../models/story.model";
import {
  CompleteNodePayload,
  CompleteNodeResult,
  StartStoryPayload,
  StoryFilters,
  StoryProgressView,
} from "./story.types";
import escapeStringRegexp from "escape-string-regexp";
import { ApiError } from "../../utils/ApiError";
import UserStoryProgress from "../../models/userProgressStory.model";

class StoryService {
  // Helpers

  /**
   * Builds a StoryProgressView object from a UserStoryProgress document.
   * @param progressId The id of the UserStoryProgress document.
   * @param _userId The id of the user who owns the progress.
   * @returns A StoryProgressView object with the following properties:
   *   - storyId: The id of the story.
   *   - status: The status of the story progress (in_progress, completed, etc.).
   *   - currentChapterId: The id of the current chapter.
   *   - currentNodeId: The id of the current node.
   *   - completedNodeIds: An array of completed node ids.
   *   - completedChapterIds: An array of completed chapter ids.
   *   - totalXpEarned: The total XP earned.
   *   - playTimeSeconds: The total play time in seconds.
   *   - playTimeFormatted: The total play time formatted as "Xh Ym".
   *   - unlockedNodeIds: An array of unlocked node ids.
   */
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
   * Compute the list of unlocked nodes given a list of nodes and a set of completed node ids.
   * A node is considered unlocked if its unlockAfter list is empty or if all the prerequisite nodes are in the completed node ids set.
   * @returns An array of unlocked node ids.
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
   * Checks if a chapter is complete by checking if all the required nodes in the chapter
   * have been completed.
   * @param nodes - The list of nodes in the chapter.
   * @param completedNodeIds - A set of completed node ids.
   * @returns true if the chapter is complete, false otherwise.
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

  /**
   * Completes a node in a story.
   * @param payload - The payload of the request with the following properties:
   *   - storyId: The id of the story.
   *   - chapterId: The id of the chapter.
   *   - nodeId: The id of the node to complete.
   *   - userId: The id of the user.
   *   - pointsEarned: The points earned for completing the node (default 0).
   *   - attempts: The number of attempts made to complete the node (default 1).
   *   - elapsedSeconds: The time taken to complete the node in seconds (default 0).
   *   - choiceLabel: The label of the choice made by the user (optional).
   * @returns A promise that resolves with an object containing the following properties:
   *   - nodeId: The id of the completed node.
   *   - xpBonus: The XP bonus of the node.
   *   - chapterCompleted: Whether the chapter has been completed.
   *   - storyCompleted: Whether the story has been completed.
   *   - completionXpBonus: The XP bonus for completing the story.
   *   - nextNodeId: The id of the next node to complete.
   *   - nextChapterId: The id of the next chapter to complete.
   *   - postNarrative: The post-narrative of the completed node.
   *   - totalXpEarned: The total XP earned by the user in the story.
   */
  private async _completeNode(
    payload: CompleteNodePayload & { choiceLabel?: string }
  ): Promise<CompleteNodeResult> {
    const {
      storyId,
      chapterId,
      nodeId,
      userId,
      pointsEarned = 0,
      attempts = 1,
      elapsedSeconds = 0,
      choiceLabel,
    } = payload;

    const [story, chapter, progress] = await Promise.all([
      Story.findById(storyId)
        .select("completionXpBonus completionCount")
        .lean(),
      StoryChapter.findOne({ _id: chapterId, story: storyId }),
      UserStoryProgress.findOne({ user: userId, story: storyId }),
    ]);

    if (!story) {
      throw new ApiError(404, "Story not found");
    }

    if (!chapter) {
      throw new ApiError(404, "Chapter not found");
    }

    if (!progress) {
      throw new ApiError(
        400,
        "You must start the story before completing nodes."
      );
    }

    const node = chapter.nodes.find((n) => n._id.toString() === nodeId);

    if (!node) {
      throw new ApiError(404, "Node not found");
    }

    // Idempotency gaurd - already completed
    const alreadyDone = progress.completedNodes.some(
      (n) => n.nodeId.toString() === nodeId
    );

    if (alreadyDone) {
      return {
        nodeId,
        xpBonus: node.xpBonus,
        chapterCompleted: progress.completedChapters.some(
          (c) => c.chapterId.toString() === chapterId
        ),
        storyCompleted: progress.status === "completed",
        completionXpBonus: 0,
        totalXpEarned: progress.totalXpEarned,
        postNarrative: node.postNarrative ?? undefined,
      };
    }

    // Record the node completion
    progress.completedNodes.push({
      nodeId: new Types.ObjectId(nodeId),
      challengeId: node.challenge ?? undefined,
      completedAt: new Date(),
      pointsEarned,
      xpBonus: node.xpBonus,
      attempts,
    });

    progress.totalXpEarned += pointsEarned + node.xpBonus;
    progress.playTimeSeconds += elapsedSeconds;

    if (choiceLabel) {
      progress.choicesMade.push({
        nodeId: new Types.ObjectId(nodeId),
        choiceLabel,
        madeAt: new Date(),
      });
    }

    const completedNodeIds = new Set(
      progress.completedNodes.map((n) => n.nodeId.toString())
    );

    // Check chapter completion
    const chapterCompleted = this.isChapterComplete(
      chapter.nodes,
      completedNodeIds
    );

    let chapterJustCompleted = false;
    // Check story completion - all published chapters complete
    let storyCompleted = false;
    let completionXpBonus = 0;

    if (
      chapterCompleted &&
      !progress.completedChapters.some(
        (c) => c.chapterId.toString() === chapterId
      )
    ) {
      progress.completedChapters.push({
        chapterId: new Types.ObjectId(chapterId),
        completedAt: new Date(),
      });
      chapterJustCompleted = true;

      if (chapterJustCompleted) {
        const allPublishedChapters = await StoryChapter.find({
          story: storyId,
          status: "published",
        })
          .select("_id")
          .lean();

        const allChapterDone = allPublishedChapters.every((c) =>
          progress.completedChapters.some(
            (pc) => pc.chapterId.toString() === c._id.toString()
          )
        );

        if (allChapterDone && progress.status !== "completed") {
          storyCompleted = true;
          completionXpBonus = story.completionXpBonus;
          progress.status = "completed";
          progress.completedAt = new Date();
          progress.totalXpEarned += completionXpBonus;

          // Increment story completionCount
          await Story.findByIdAndUpdate(storyId, {
            $inc: { completionCount: 1 },
          });
        }
      }
    }

    // Advance currentNodeId to next unlocked node
    const nextNode = chapter.nodes
      .filter((n) => !completedNodeIds.has(n._id.toString()))
      .filter((n) =>
        n.unlockAfter.every((prereq) => completedNodeIds.has(prereq.toString()))
      )
      .sort((a, b) => a.order - b.order)[0];

    progress.currentNodeId = nextNode?._id ?? undefined;

    if (!nextNode && chapterJustCompleted) {
      // Advance to next chapter
      const nextChapter = await StoryChapter.findOne({
        story: storyId,
        status: "published",
        order: {
          $gt: chapter.order,
        },
      })
        .sort({ order: 1 })
        .lean();

      if (nextChapter) {
        progress.currentChapterId = nextChapter._id;

        const firstNextNode = nextChapter.nodes.sort(
          (a, b) => a.order - b.order
        )[0];

        progress.currentNodeId = firstNextNode._id ?? undefined;
      }
    }

    await progress.save({ validateBeforeSave: false });

    return {
      nodeId,
      xpBonus: node.xpBonus,
      chapterCompleted: chapterJustCompleted,
      storyCompleted,
      completionXpBonus,
      nextNodeId: progress.currentNodeId?.toString(),
      nextChapterId: progress.currentChapterId?.toString(),
      postNarrative: node.postNarrative ?? undefined,
      totalXpEarned: progress.totalXpEarned,
    };
  }

  // services

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
        {
          tags: {
            $elemMatch: { $regex: escapeStringRegexp(search), $options: "i" },
          },
        },
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

  /**
   * Retrieve a story by its ID or slug. If `adminView` is set to `true`,
   * all stories are returned, regardless of their status. If `userId` is
   * provided, the user's progress on the story is returned.
   *
   * @param idOrSlug The ID or slug of the story to retrieve.
   * @param userId The ID of the user whose progress to retrieve.
   * @param adminView Whether to return all stories, regardless of their status.
   * @returns The story, its chapters, and the user's progress.
   */
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
            completedNodeIds: progress.completedNodes.map((c) =>
              c.nodeId.toString()
            ),
            playTimeSeconds: progress.playTimeSeconds,
          }
        : null,
    };
  }

  /**
   * Start a new story for a user.
   * @param payload The user ID and story ID to start.
   * @returns The initial story progress view.
   * @throws {ApiError} If the story is not found or if the user already started the story.
   */
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

    if (!firstChapter.nodes.length) {
      throw new ApiError(400, "First chapter has no nodes");
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

  /**
   * Advances the user's progress in a story by completing a node.
   * If the node is not found, a 404 error is thrown.
   * If the node is a challenge, a 400 error is thrown, as challenge nodes are completed
   * via flag submission, not this endpoint.
   * @param payload - An object containing the following properties:
   *   - storyId: The id of the story.
   *   - chapterId: The id of the chapter.
   *   - nodeId: The id of the node to complete.
   *   - userId: The id of the user.
   *   - pointsEarned: The points earned for completing the node (default 0).
   *   - attempts: The number of attempts made to complete the node (default 1).
   *   - elapsedSeconds: The time taken to complete the node in seconds (default 0).
   * @returns A promise that resolves with an object containing the following properties:
   *   - nodeId: The id of the completed node.
   *   - xpBonus: The XP bonus of the node.
   *   - chapterCompleted: Whether the chapter has been completed.
   *   - storyCompleted: Whether the story has been completed.
   *   - completionXpBonus: The XP bonus for completing the story.
   *   - nextNodeId: The id of the next node to complete.
   *   - nextChapterId: The id of the next chapter to complete.
   *   - postNarrative: The post-narrative of the completed node.
   *   - totalXpEarned: The total XP earned by the user in the story.
   */
  async advanceNode(payload: CompleteNodePayload): Promise<CompleteNodeResult> {
    const { storyId, chapterId, nodeId, userId, elapsedSeconds = 0 } = payload;

    const chapter = await StoryChapter.findOne({
      _id: chapterId,
      story: storyId,
    });

    if (!chapter) {
      throw new ApiError(404, "Chapter not found");
    }
    const node = chapter.nodes.find((n) => n._id.toString() === nodeId);

    if (!node) {
      throw new ApiError(404, "Node not found");
    }

    if (node.type === "challenge") {
      throw new ApiError(
        400,
        "Challenge nodes are completed via flag submission, not this endpoint."
      );
    }

    return this._completeNode({
      storyId,
      chapterId,
      nodeId,
      userId,
      pointsEarned: 0,
      attempts: 1,
      elapsedSeconds,
    });
  }
}

export const storyService = new StoryService();
