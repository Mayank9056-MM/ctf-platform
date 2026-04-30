import mongoose, { Types, ClientSession } from "mongoose";
import Story, {
  IStory,
  IStoryChapter,
  IStoryNode,
  StoryChapter,
  StoryStatus,
} from "../../models/story.model";
import { ApiError } from "../../utils/ApiError";
import {
  AdvanceNodePayload,
  CommitNodePayload,
  CreateChapterPayload,
  CreateNodePayload,
  CreateStoryPayload,
  GraphValidationResult,
  MakeChoicePayload,
  NodeCompleteResult,
  StartStoryPayload,
  StoryFilters,
  StoryProgressView,
  UpdateChapterPayload,
  UpdateNodePayload,
  UpdateStoryPayload,
} from "./story.types";
import UserStoryProgress, {
  IUserStoryProgress,
} from "../../models/userProgressStory.model";
import Submission from "../../models/submission.model";
import logger from "../../utils/logger";
import User from "../../models/user.model";
import { uploadOnCloudinary } from "../../utils/cloudinary";
import { publicDecrypt } from "node:crypto";

function requireNode(chapter: IStoryChapter, nodeId: string): IStoryNode {
  const node = chapter.nodes.find((n) => n._id.toString() === nodeId);
  if (!node) throw new ApiError(404, `Node ${nodeId} not found in chapter`);
  return node;
}

function collectBranch(
  nodes: IStoryNode[],
  startNodeId: string,
  chosenChoiceLabel?: string
): Set<string> {
  const nodeMap = new Map(nodes.map((n) => [n._id.toString(), n]));
  const visited = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodeMap.get(id);
    if (!node) continue;

    if (node.type === "choice" && node.choices.length > 0) {
      // Follow the chosen path only if this is the choice node;
      // for other choice nodes downstream, follow all (they'll be traversed later)
      for (const c of node.choices) {
        const nextId = c.targetNode.toString();
        if (!visited.has(nextId)) queue.push(nextId);
      }
    } else if (node.nextNode) {
      const nextId = node.nextNode.toString();
      if (!visited.has(nextId)) queue.push(nextId);
    }
  }

  return visited;
}

function computeBypassedNodes(
  nodes: IStoryNode[],
  choiceNode: IStoryNode,
  chosenLabel: string
): string[] {
  const chosen = choiceNode.choices.find((c) => c.label === chosenLabel);
  if (!chosen) return [];

  const chosenReachable = collectBranch(nodes, chosen.targetNode.toString());

  const bypassed: string[] = [];
  for (const c of choiceNode.choices) {
    if (c.label === chosenLabel) continue;
    const unchosen = collectBranch(nodes, c.targetNode.toString());
    for (const id of unchosen) {
      if (!chosenReachable.has(id)) {
        bypassed.push(id);
      }
    }
  }

  return bypassed;
}

/**
 * Checks if all required nodes in a chapter have been completed.
 *
 * Required nodes are those that are not optional and have not been bypassed.
 * A node is considered completed if its id is present in the completedNodeIds set.
 * A node is considered bypassed if its id is present in the bypassedNodeIds set.
 * @returns {boolean} True if the chapter is complete, false otherwise.
 */
function isChapterComplete(
  nodes: IStoryNode[],
  completedNodeIds: Set<string>,
  bypassedNodeIds: Set<string>
): boolean {
  const required = nodes.filter(
    (n) => !n.isOptional && !bypassedNodeIds.has(n._id.toString())
  );
  return required.every((n) => completedNodeIds.has(n._id.toString()));
}

// Service

class StoryService {
  /**
   * Retrieve a list of stories based on the provided filters.
   * @param {StoryFilters} filters - The filters to apply to the query.
   * @param {Types.ObjectId} [userId] - The id of the user to retrieve progress for.
   * @returns {Promise<object>} A promise that resolves to an object containing the stories, total count, and pagination information.
   */
  async getStories(filters: StoryFilters, userId?: Types.ObjectId) {
    const { status, difficulty, tags, search, page, limit } = filters;

    const escapeStringRegexp = (await import("escape-string-regexp")).default;

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    } else if (!userId) {
      query.status = "published";
    }
    if (difficulty) query.difficulty = difficulty;
    if (tags?.length) query.tags = { $in: tags };
    if (search) {
      query.$or = [
        { title: { $regex: escapeStringRegexp(search), $options: "i" } },
        { tags: { $regex: escapeStringRegexp(search), $options: "i" } },
      ];
    }

    const [stories, total, stats] = await Promise.all([
      Story.find(query)
        .select(
          "title slug tagline difficulty status tags coverImageUrl accentColor completionXpBonus completionCount estimatedMinutes publishedAt"
        )
        .populate("author", "username avatar")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Story.countDocuments(query),
      Story.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    let progressMap = new Map<string, string>();
    if (userId) {
      const progresses = await UserStoryProgress.find({
        user: userId,
        story: { $in: stories.map((s) => s._id) },
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
      stats,
    };
  }

  /**
   * Retrieves a story by its ID or slug, with an optional user ID to
   * include progress information.
   *
   * @param {string} idOrSlug - The ID or slug of the story to retrieve.
   * @param {Types.ObjectId} [userId] - The ID of the user to retrieve progress for.
   * @param {boolean} [adminView=false] - If true, the story will be retrieved even if it is not published.
   *
   * @returns {Promise<object>} A promise that resolves to an object containing the story, chapters, and user progress information.
   */
  async getStoryDetail(
    idOrSlug: string,
    userId?: Types.ObjectId,
    adminView = false
  ) {
    const query: Record<string, unknown> = Types.ObjectId.isValid(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    if (!adminView) query.status = "published";

    const story = await Story.findOne(query)
      .populate("author", "username avatar")
      .lean();

    if (!story) throw new ApiError(404, "Story not found");

    const chaptersQuery: Record<string, unknown> = {
      story: story._id,
      ...(adminView ? {} : { status: "published" }),
    };

    const chapters = await StoryChapter.find(chaptersQuery)
      .sort({ order: 1 })
      .lean();

    let progress: IUserStoryProgress | null = null;
    let completedNodeIds = new Set<string>();
    let bypassedNodeIds = new Set<string>();

    if (userId) {
      progress = await UserStoryProgress.findOne({
        user: userId,
        story: story._id,
      }).lean();

      completedNodeIds = new Set(
        progress?.completedNodes.map((n) => n.nodeId.toString()) ?? []
      );
      bypassedNodeIds = new Set(
        progress?.bypassedNodeIds.map((id) => id.toString()) ?? []
      );
    }

    const enrichedChapters = chapters.map((chapter) => {
      const chapterCompleted =
        progress?.completedChapters.some(
          (c) => c.chapterId.toString() === chapter._id.toString()
        ) ?? false;

      const chapterUnlocked =
        adminView ||
        chapter.unlockAfterChapters.length === 0 ||
        chapter.unlockAfterChapters.every((id) =>
          progress?.completedChapters.some(
            (c) => c.chapterId.toString() === id.toString()
          )
        );

      const nodes = chapter.nodes
        .sort((a, b) => a.order - b.order)
        .map((node) => {
          const nodeId = node._id.toString();
          const isCompleted = completedNodeIds.has(nodeId);
          const isBypassed = bypassedNodeIds.has(nodeId);

          // A node is unlocked if all its unlockAfter prereqs are done
          const prereqsMet =
            node.unlockAfter.length === 0 ||
            node.unlockAfter.every((prereqId) =>
              completedNodeIds.has(prereqId.toString())
            );

          const isCurrentNode = progress?.currentNodeId?.toString() === nodeId;

          if (!adminView && !prereqsMet && !isCompleted && !isBypassed) {
            return {
              _id: node._id,
              type: node.type,
              order: node.order,
              isOptional: node.isOptional,
              isEntryPoint: node.isEntryPoint,
              isLocked: true,
              isCompleted: false,
              isBypassed: false,
              isCurrent: false,
            };
          }

          return {
            ...node,
            isLocked: false,
            isCompleted,
            isBypassed,
            isCurrent: isCurrentNode,
            postNarrative: isCompleted ? node.postNarrative : null,
          };
        });

      return {
        ...chapter,
        nodes,
        isCompleted: chapterCompleted,
        isUnlocked: chapterUnlocked,
      };
    });

    return {
      ...story,
      chapters: enrichedChapters,
      userProgress: progress
        ? {
            status: progress.status,
            totalXpEarned: progress.totalXpEarned,
            currentNodeId: progress.currentNodeId?.toString(),
            currentChapterId: progress.currentChapterId?.toString(),
            completedNodeIds: [...completedNodeIds],
            bypassedNodeIds: [...bypassedNodeIds],
            activePath: progress.activePath.map((id) => id.toString()),
            playTimeSeconds: progress.playTimeSeconds,
          }
        : null,
    };
  }

  /**
   * Start a new story progress session for a user.
   * If the user already has a progress session for this story, it will be returned.
   * Otherwise, a new progress session will be created.
   *
   * @param payload - The payload containing the storyId and userId.
   * @returns A Promise resolving to a StoryProgressView object.
   * @throws ApiError - If the story is not found, or if there's an error creating the progress session.
   */
  async startStory(payload: StartStoryPayload): Promise<StoryProgressView> {
    const { storyId, userId } = payload;

    const story = await Story.findOne({
      _id: storyId,
      status: "published",
    }).lean();
    if (!story) throw new ApiError(404, "Story not found");

    // Idempotent — return existing progress
    const existing = await UserStoryProgress.findOne({
      user: userId,
      story: storyId,
    }).lean();
    if (existing) {
      return this.buildProgressView(existing);
    }

    const firstChapter = await StoryChapter.findOne({
      story: storyId,
      status: "published",
      unlockAfterChapters: { $size: 0 },
    }).sort({ order: 1 });

    if (!firstChapter) {
      throw new ApiError(
        400,
        "This story has no published chapters. Check back soon."
      );
    }

    const entryNode = firstChapter.nodes.find((n) => n.isEntryPoint);
    if (!entryNode) {
      throw new ApiError(
        500,
        "Chapter has no entry point node. Contact an admin."
      );
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const progress = await UserStoryProgress.create(
        [
          {
            user: userId,
            story: storyId,
            status: "in_progress",
            currentChapterId: firstChapter._id,
            currentNodeId: entryNode._id,
            activePath: [entryNode._id],
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return this.buildProgressView(progress[0]);
    } catch (err: unknown) {
      await session.abortTransaction();
      // If duplicate key (race condition) — return existing
      if ((err as { code?: number }).code === 11000) {
        const existing = await UserStoryProgress.findOne({
          user: userId,
          story: storyId,
        }).lean();
        if (existing) return this.buildProgressView(existing);
      }
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Advance to the next node in the story chapter.
   * If the node is a challenge, throw a 400 error.
   * If the node is a choice, throw a 400 error.
   * If the node has not been completed, update the user's progress.
   * If the node has prerequisites, throw a 400 error if the prerequisites are not met.
   * @param {AdvanceNodePayload} payload - The node to advance to.
   * @returns {Promise<NodeCompleteResult>} - The result of advancing to the node.
   * @throws {ApiError} - If the node is a challenge or choice, or if the prerequisites are not met.
   */
  async advanceNode(payload: AdvanceNodePayload): Promise<NodeCompleteResult> {
    const { storyId, chapterId, nodeId, userId, elapsedSeconds = 0 } = payload;

    const [chapter, progress] = await Promise.all([
      StoryChapter.findOne({ _id: chapterId, story: storyId }),
      UserStoryProgress.findOne({ user: userId, story: storyId }),
    ]);

    if (!chapter) throw new ApiError(404, "Chapter not found");
    if (!progress) {
      throw new ApiError(400, "Start the story before completing nodes");
    }

    const node = requireNode(chapter, nodeId);

    if (node.type === "challenge") {
      throw new ApiError(
        400,
        "Challenge nodes are completed via flag submission. Use POST /challenges/:id/submit"
      );
    }
    if (node.type === "choice") {
      throw new ApiError(
        400,
        "Choice nodes require a choice selection. Use POST .../choose"
      );
    }

    this.assertNodeIsCurrent(progress, nodeId);
    this.assertNodeNotCompleted(progress, nodeId);
    await this.assertPrerequisitesMet(progress, node);

    const resolvedNextNodeId = node.nextNode?.toString() ?? null;

    return this._commitNodeCompletion(
      {
        storyId,
        chapterId,
        nodeId,
        userId,
        pointsEarned: 0,
        attempts: 1,
        elapsedSeconds,
        resolvedNextNodeId,
      },
      chapter
    );
  }

  /**
   * Make a choice in the story.
   *
   * If the node is not a choice node, an error is thrown.
   * If the choice is invalid, an error is thrown.
   * If the node has not been started yet, an error is thrown.
   * If the node has already been completed, an error is thrown.
   * If the node has prerequisites that have not been met, an error is thrown.
   *
   * @param {MakeChoicePayload} payload - The payload to make a choice
   * @returns {Promise<NodeCompleteResult>} - The result of committing the node completion
   */
  async makeChoice(payload: MakeChoicePayload): Promise<NodeCompleteResult> {
    const { storyId, chapterId, nodeId, userId, choiceLabel } = payload;

    const [chapter, progress] = await Promise.all([
      StoryChapter.findOne({ _id: chapterId, story: storyId }),
      UserStoryProgress.findOne({ user: userId, story: storyId }),
    ]);

    if (!chapter) throw new ApiError(404, "Chapter not found");
    if (!progress) {
      throw new ApiError(400, "Start the story before making choices");
    }

    const node = requireNode(chapter, nodeId);

    if (node.type !== "choice") {
      throw new ApiError(
        400,
        `Node [order=${node.order}] is not a choice node`
      );
    }

    this.assertNodeIsCurrent(progress, nodeId);
    this.assertNodeNotCompleted(progress, nodeId);
    await this.assertPrerequisitesMet(progress, node);

    const chosen = node.choices.find((c) => c.label === choiceLabel);
    if (!chosen) {
      const validLabels = node.choices.map((c) => `"${c.label}"`).join(", ");
      throw new ApiError(
        400,
        `Invalid choice "${choiceLabel}". Valid options: ${validLabels}`
      );
    }

    // Compute which nodes the unchosen branches lead to — they get bypassed
    const bypassedNodeIds = computeBypassedNodes(
      chapter.nodes,
      node,
      choiceLabel
    );

    return this._commitNodeCompletion(
      {
        storyId,
        chapterId,
        nodeId,
        userId,
        pointsEarned: 0,
        attempts: 1,
        elapsedSeconds: 0,
        choiceLabel,
        resolvedNextNodeId: chosen.targetNode.toString(),
        bypassedNodeIds,
      },
      chapter
    );
  }

  /**
   * Notifies the story service that a user has solved a challenge.
   * This service will find the relevant StoryChapter and UserStoryProgress documents
   * and advance the user's progress to the next node in the story.
   * If the user has already completed the node, this function does nothing.
   * If no submission record exists for the user, this function logs a warning and does nothing.
   * Errors are logged, not thrown.
   * @param {string} challengeId - The id of the challenge to notify the story service about.
   * @param {Types.ObjectId} userId - The id of the user who solved the challenge.
   * @param {number} pointsEarned - The points the user earned for solving the challenge.
   * @param {number} attempts - The number of attempts the user took to solve the challenge.
   */
  async notifyChallengeSolved(
    challengeId: string,
    userId: Types.ObjectId,
    pointsEarned: number,
    attempts: number
  ): Promise<void> {
    // Find chapters containing a node that wraps this challenge
    const chapters = await StoryChapter.find({
      "nodes.challenge": new Types.ObjectId(challengeId),
      status: "published",
    }).lean();

    if (chapters.length === 0) return;

    for (const chapter of chapters) {
      const node = chapter.nodes.find(
        (n) => n.challenge?.toString() === challengeId
      );
      if (!node) continue;

      const progress = await UserStoryProgress.findOne({
        user: userId,
        story: chapter.story,
        status: "in_progress",
      });

      if (!progress) continue;

      // Must be the current node
      if (progress.currentNodeId.toString() !== node._id.toString()) continue;

      // Already completed guard
      const alreadyDone = progress.completedNodes.some(
        (n) => n.nodeId.toString() === node._id.toString()
      );
      if (alreadyDone) continue;

      // Ground-truth verification: confirm the solve exists in the Submission collection
      const solveExists = await Submission.exists({
        user: userId,
        challenge: challengeId,
        isCorrect: true,
      });

      if (!solveExists) {
        logger.warn(
          `[Story] notifyChallengeSolved called but no Submission record found. ` +
            `userId=${userId} challengeId=${challengeId} — skipping node advance`
        );
        continue;
      }

      const resolvedNextNodeId = node.nextNode?.toString() ?? null;

      // Fire transaction — errors are logged, not thrown (never block flag submission)
      const chapterDoc = await StoryChapter.findById(chapter._id);
      if (!chapterDoc) continue;

      await this._commitNodeCompletion(
        {
          storyId: chapter.story.toString(),
          chapterId: chapter._id.toString(),
          nodeId: node._id.toString(),
          userId,
          pointsEarned,
          attempts,
          elapsedSeconds: 0,
          resolvedNextNodeId,
        },
        chapterDoc
      );
    }
  }

  /**
   * Private transaction that commits a user's node completion.
   * Called by `notifyChallengeSolved`.
   * Errors are logged, not thrown (never block flag submission).
   * @param {CommitNodePayload} payload - transaction payload
   * @param {IStoryChapter} chapter - story chapter document
   * @returns {Promise<NodeCompleteResult>} - transaction result
   */
  private async _commitNodeCompletion(
    payload: CommitNodePayload,
    chapter: IStoryChapter
  ): Promise<NodeCompleteResult> {
    const {
      storyId,
      chapterId,
      nodeId,
      userId,
      pointsEarned,
      attempts,
      elapsedSeconds,
      choiceLabel,
      resolvedNextNodeId,
      bypassedNodeIds = [],
    } = payload;

    const node = requireNode(chapter, nodeId);

    const story = await Story.findById(storyId)
      .select("completionXpBonus completionCount")
      .lean();
    if (!story) throw new ApiError(400, "Story not found");

    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();

    try {
      // Read current progress inside transaction
      const progress = await UserStoryProgress.findOne({
        user: userId,
        story: storyId,
      }).session(session);

      if (!progress) {
        throw new ApiError(
          400,
          "Progress record not found — start the story first"
        );
      }

      // Idempotency guard
      const alreadyDone = progress.completedNodes.some(
        (n) => n.nodeId.toString() === nodeId
      );
      if (alreadyDone) {
        await session.abortTransaction();
        session.endSession();

        return {
          nodeId,
          xpBonus: node.xpBonus,
          postNarrative: node.postNarrative ?? null,
          nextNodeId: progress.currentNodeId?.toString() ?? null,
          nextChapterId: progress.currentChapterId?.toString() ?? null,
          chapterCompleted: progress.completedChapters.some(
            (c) => c.chapterId.toString() === chapterId
          ),
          storyCompleted: progress.status === "completed",
          completionXpBonus: 0,
          totalXpEarned: progress.totalXpEarned,
        };
      }

      // Compute new state
      const xpGained = pointsEarned + node.xpBonus;

      progress.completedNodes.push({
        nodeId: new Types.ObjectId(nodeId),
        challengeId: node.challenge ?? undefined,
        completedAt: new Date(),
        pointsEarned,
        xpBonus: node.xpBonus,
        attempts,
      });

      progress.totalXpEarned += xpGained;
      progress.playTimeSeconds += elapsedSeconds;

      // Add bypassed nodes from the unchosen branch
      for (const bypassedId of bypassedNodeIds) {
        const objId = new Types.ObjectId(bypassedId);
        const alreadyBypassed = progress.bypassedNodeIds.some(
          (id) => id.toString() === bypassedId
        );
        if (!alreadyBypassed) {
          progress.bypassedNodeIds.push(objId);
        }
      }

      // Record choice
      if (choiceLabel && resolvedNextNodeId) {
        progress.choiceMade.push({
          nodeId: new Types.ObjectId(nodeId),
          choiceLabel,
          routedToNodeId: new Types.ObjectId(resolvedNextNodeId),
          madeAt: new Date(),
        });
      }

      // Chapter completion check
      const completedNodeIds = new Set(
        progress.completedNodes.map((n) => n.nodeId.toString())
      );
      const bypassedSet = new Set(
        progress.bypassedNodeIds.map((id) => id.toString())
      );

      const chapterJustCompleted =
        isChapterComplete(chapter.nodes, completedNodeIds, bypassedSet) &&
        !progress.completedChapters.some(
          (c) => c.chapterId.toString() === chapterId
        );

      if (chapterJustCompleted) {
        progress.completedChapters.push({
          chapterId: new Types.ObjectId(chapterId),
          completedAt: new Date(),
        });
      }

      // Story completion check
      let storyCompleted = false;
      let completionXpBonus = 0;

      if (chapterJustCompleted && progress.status !== "completed") {
        const allPublishedChapters = await StoryChapter.find({
          story: storyId,
          status: "published",
        })
          .select("_id")
          .session(session)
          .lean();

        const allDone = allPublishedChapters.every((c) =>
          progress.completedChapters.some(
            (pc) => pc.chapterId.toString() === c._id.toString()
          )
        );

        if (allDone) {
          storyCompleted = true;
          completionXpBonus = story.completionXpBonus;
          progress.status = "completed";
          progress.completedAt = new Date();
          progress.totalXpEarned += completionXpBonus;
        }
      }

      // Resolve next node in graph
      let nextNodeId: string | null = resolvedNextNodeId ?? null;
      let nextChapterId: string | null = null;

      if (nextNodeId) {
        // Advance activePath
        progress.activePath.push(new Types.ObjectId(nextNodeId));
        progress.currentNodeId = new Types.ObjectId(nextNodeId);
      } else if (chapterJustCompleted) {
        // Find next chapter by order
        const nextChapter = await StoryChapter.findOne({
          story: storyId,
          status: "published",
          order: { $gt: chapter.order },
          _id: { $nin: progress.completedChapters.map((c) => c.chapterId) },
        })
          .sort({ order: 1 })
          .session(session)
          .lean();

        if (nextChapter) {
          nextChapterId = nextChapter._id.toString();
          const entryNode = nextChapter.nodes.find((n) => n.isEntryPoint);

          if (entryNode) {
            nextNodeId = entryNode._id.toString();
            progress.currentChapterId = nextChapter._id;
            progress.currentNodeId = entryNode._id;
            progress.activePath.push(entryNode._id);
          }
        }
      }

      // Persist progress
      await progress.save({ session, validateBeforeSave: false });

      // Award completion XP to user score
      if (storyCompleted && completionXpBonus > 0) {
        await User.findByIdAndUpdate(
          userId,
          { $inc: { score: completionXpBonus } },
          { session }
        );
      }

      // Increment story completionCount
      if (storyCompleted) {
        await Story.findByIdAndUpdate(
          storyId,
          { $inc: { completionCount: 1 } },
          { session }
        );
      }

      await session.commitTransaction();

      return {
        nodeId,
        xpBonus: node.xpBonus,
        postNarrative: node.postNarrative ?? null,
        nextNodeId,
        nextChapterId,
        chapterCompleted: chapterJustCompleted,
        storyCompleted,
        completionXpBonus,
        totalXpEarned: progress.totalXpEarned,
      };
    } catch (err) {
      await session.abortTransaction();
      logger.error(
        "[StoryService._commitNodeCompletion] Transaction aborted",
        err
      );
      throw err;
    } finally {
      session.endSession();
    }
  }

  // Validation Helpers

  /**
   * Throws an ApiError if the provided nodeId does not match the current node's id
   * in the user's story progress.
   * @param {IUserStoryProgress} progress - The user's story progress document.
   * @param {string} nodeId - The id of the node to check.
   */
  private assertNodeIsCurrent(
    progress: IUserStoryProgress,
    nodeId: string
  ): void {
    if (progress.currentNodeId.toString() !== nodeId) {
      throw new ApiError(
        400,
        `Node ${nodeId} is not your current node. ` +
          `Your current node is ${progress.currentNodeId}. ` +
          `Complete nodes in graph order.`
      );
    }
  }

  /**
   * Throws an ApiError if the node with the given nodeId has already been completed.
   * @param {IUserStoryProgress} progress - The user's story progress document.
   * @param {string} nodeId - The id of the node to check.
   */
  private assertNodeNotCompleted(
    progress: IUserStoryProgress,
    nodeId: string
  ): void {
    const already = progress.completedNodes.some(
      (n) => n.nodeId.toString() === nodeId
    );
    if (already) {
      throw new ApiError(409, `Node ${nodeId} has already been completed`);
    }
  }

  /**
   * Asserts that the user has completed all the prerequisite nodes for the given node.
   * Throws an ApiError if any of the prerequisites have not been completed.
   * @param {IUserStoryProgress} progress - The user's story progress document.
   * @param {IStoryNode} node - The node to check for completed prerequisites.
   */
  private async assertPrerequisitesMet(
    progress: IUserStoryProgress,
    node: IStoryNode
  ): Promise<void> {
    // Bypassed nodes cannot be completed
    const isBypassed = progress.bypassedNodeIds.some(
      (id) => id.toString() === node._id.toString()
    );
    if (isBypassed) {
      throw new ApiError(
        400,
        `Node ${node._id} is on a story branch you did not take and cannot be completed`
      );
    }

    if (node.unlockAfter.length === 0) return;

    const completedIds = new Set(
      progress.completedNodes.map((n) => n.nodeId.toString())
    );
    const unmet = node.unlockAfter.filter(
      (prereq) => !completedIds.has(prereq.toString())
    );

    if (unmet.length > 0) {
      throw new ApiError(
        400,
        `Cannot complete this node yet. ` +
          `Complete prerequisite node(s) first: ${unmet.join(", ")}`
      );
    }
  }

  /**
   * Retrieves the user's story progress for the given story.
   *
   * @param {string} storyId - The id of the story to retrieve progress for.
   * @param {Types.ObjectId} userId - The id of the user to retrieve progress for.
   * @returns {Promise<StoryProgressView | null>} - The user's story progress object, or null if no progress is found.
   */
  async getProgress(
    storyId: string,
    userId: Types.ObjectId
  ): Promise<StoryProgressView | null> {
    const progress = await UserStoryProgress.findOne({
      user: userId,
      story: storyId,
    }).lean();

    if (!progress) return null;

    if (!progress.currentNodeId || !progress.currentChapterId) {
      throw new ApiError(400, "Invalid progress. Please restart the story.");
    }
    return this.buildProgressView(progress);
  }

  /**
   * Builds a StoryProgressView object from a UserStoryProgress document.
   * @param {IUserStoryProgress} progress - The user's story progress document.
   * @returns {StoryProgressView} - The user's story progress object.
   */
  private buildProgressView(progress: IUserStoryProgress): StoryProgressView {
    const h = Math.floor(progress.playTimeSeconds / 3600);
    const m = Math.floor((progress.playTimeSeconds % 3600) / 60);

    return {
      storyId: progress.story.toString(),
      status: progress.status,
      currentChapterId: progress.currentChapterId?.toString() ?? null,
      currentNodeId: progress.currentNodeId?.toString() ?? null,
      completedNodeIds:
        progress.completedNodes?.map((n) => n?.nodeId?.toString()) ?? [],
      bypassedNodeIds:
        progress.bypassedNodeIds?.map((id) => id?.toString()) ?? [],
      activePath: progress.activePath.map((id) => id.toString()),
      totalXpEarned: progress.totalXpEarned,
      playTimeSeconds: progress.playTimeSeconds,
      playTimeFormatted: h > 0 ? `${h}h ${m}m` : `${m}m`,
      choicesMade: progress.choiceMade.map((c) => ({
        nodeId: c.nodeId.toString(),
        choiceLabel: c.choiceLabel,
        routedToNodeId: c.routedToNodeId.toString(),
        madeAt: c.madeAt,
      })),
    };
  }

  // Leaderboard

  /**
   * Retrieves the leaderboard for a given story, sorted by total XP earned and then completion time.
   * The leaderboard will contain the user's rank, username, avatar, country, status (in_progress/completed), total XP earned, time taken to complete, and the number of nodes completed.
   * @param {string} storyId - The id of the story to retrieve the leaderboard for.
   * @param {number} [limit=20] - The number of entries to return in the leaderboard.
   * @returns {Promise<LeaderboardEntry[]>} - A promise that resolves to an array of leaderboard entries.
   */
  async getStoryLeaderboard(storyId: string, limit = 20) {
    const entries = await UserStoryProgress.find({
      story: storyId,
      status: { $in: ["in_progress", "completed"] },
    })
      .populate("user", "username avatar country")
      .sort({ totalXpEarned: -1, completedAt: 1 })
      .limit(limit)
      .select(
        "user status totalXpEarned playTimeSeconds completedAt completedNodes"
      )
      .lean();

    return entries.map((e, i) => ({
      rank: i + 1,
      user: e.user,
      status: e.status,
      totalXpEarned: e.totalXpEarned,
      playTimeSeconds: e.playTimeSeconds,
      completedAt: e.completedAt,
      nodesCompleted: e.completedNodes.length,
    }));
  }

  /**
   * Creates a new story.
   * Throws 409 if a story with the same title already exists.
   * @param {CreateStoryPayload} payload - The payload containing the story's title, authorId, and other information.
   * @returns {Promise<IStory>} - A promise that resolves to the newly created story.
   */
  async createStory(payload: CreateStoryPayload): Promise<IStory> {
    const escapeStringRegexp = (await import("escape-string-regexp")).default;

    const exists = await Story.findOne({
      title: {
        $regex: new RegExp(`^${escapeStringRegexp(payload.title)}$`, "i"),
      },
    });
    if (exists)
      throw new ApiError(409, "A story with this title already exists");

    let coverImageUrl: string | undefined;
    let publicId: string | undefined;

    if (payload?.coverImageLocalPath) {
      try {
        const res = await uploadOnCloudinary(payload.coverImageLocalPath);

        if (!res) {
          throw new ApiError(
            500,
            "Something went wrong while uploading cover image"
          );
        }
        coverImageUrl = res.secure_url;
        publicId = res.public_id;
      } catch (error) {
        console.log(error, "error while uploading cover image");
        throw new ApiError(
          500,
          "Something went wrong while uploading cover image"
        );
      }
    }

    return Story.create({
      ...payload,
      author: payload.authorId,
      coverImage: {
        url: coverImageUrl,
        publicId,
      },
    });
  }

  /**
   * Updates a story.
   * Throws 404 if the story does not exist.
   * Throws 409 if a story with the same title already exists.
   * @param {UpdateStoryPayload} payload - The payload containing the story's ID, requester ID, and other information.
   * @returns {Promise<IStory>} - A promise that resolves to the updated story.
   */
  async updateStory(payload: UpdateStoryPayload): Promise<IStory> {
    const { storyId, requesterId: _r, ...rest } = payload;
    const story = await Story.findById(storyId);
    if (!story) throw new ApiError(404, "Story not found");

    let coverImageUrl: string | undefined;
    let publicId: string | undefined;

    if (rest.coverImageLocalPath) {
      try {
        const res = await uploadOnCloudinary(rest.coverImageLocalPath);

        if (!res) {
          throw new ApiError(
            500,
            "Something went wrong while uploading cover image"
          );
        }

        coverImageUrl = res.secure_url;
        publicId = res.public_id;
      } catch (error) {
        console.log(error, "error while uploading cover image");
        throw new ApiError(
          500,
          "Something went wrong while uploading cover image"
        );
      }
    }

    const escapeStringRegexp = (await import("escape-string-regexp")).default;

    if (rest.title && rest.title !== story.title) {
      const dup = await Story.findOne({
        title: {
          $regex: new RegExp(`^${escapeStringRegexp(rest.title)}$`, "i"),
        },
        _id: { $ne: storyId },
      });
      if (dup) throw new ApiError(409, "Story title already in use");
    }

    Object.assign({
      story,
      rest,
      coverImage: {
        url: coverImageUrl,
        publicId,
      },
    });
    await story.save();
    return story;
  }

  /**
   * Sets the status of a story.
   * Throws 404 if the story does not exist.
   * Throws 400 if the story has no published chapters when trying to publish.
   * Throws 400 if any of the published chapters have graph errors when trying to publish.
   * @param {string} storyId - The ID of the story to update.
   * @param {StoryStatus} status - The new status of the story.
   * @returns {Promise<IStory>} - A promise that resolves to the updated story.
   */
  async setStoryStatus(storyId: string, status: StoryStatus): Promise<IStory> {
    const story = await Story.findById(storyId);
    if (!story) throw new ApiError(404, "Story not found");

    if (status === "published") {
      const chapters = await StoryChapter.find({
        story: storyId,
        status: "published",
      }).lean();

      if (chapters.length === 0) {
        throw new ApiError(
          400,
          "Cannot publish: story has no published chapters"
        );
      }

      // Validate every published chapter graph
      for (const chapter of chapters) {
        const chapterDoc = await StoryChapter.findById(chapter._id);
        if (!chapterDoc) continue;
        const result: GraphValidationResult = chapterDoc.validateGraph();
        if (!result.valid) {
          throw new ApiError(
            400,
            `Chapter "${chapter.title}" has graph errors:\n` +
              result.errors.join("\n")
          );
        }
      }
    }

    story.status = status;
    await story.save();
    return story;
  }

  /**
   * Deletes a story and all associated chapters and user progress.
   * Throws an error if the story is currently being played by any users.
   *
   * @param {string} storyId - The id of the story to delete.
   * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
   * @throws {ApiError} - If the story is not found, or if users are currently playing the story.
   */
  async deleteStory(storyId: string): Promise<void> {
    const story = await Story.findById(storyId);
    if (!story) throw new ApiError(404, "Story not found");

    const activeCount = await UserStoryProgress.countDocuments({
      story: storyId,
      status: "in_progress",
    });
    if (activeCount > 0) {
      throw new ApiError(
        409,
        `${activeCount} user(s) are actively playing this story. Archive it instead.`
      );
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await Story.findByIdAndDelete(storyId).session(session);

        await StoryChapter.deleteMany({ story: storyId }).session(session);

        await UserStoryProgress.deleteMany({ story: storyId }).session(session);
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Creates a new chapter for a story.
   * Throws an error if the story is not found, or if a chapter with the same order already exists.
   *
   * @param {CreateChapterPayload} payload - The payload containing the storyId, title, order, openingNarrative, closingNarrative, coverImageUrl, accentColor, estimatedMinutes, and unlockAfterChapters.
   * @returns {Promise<IStoryChapter>} - A promise that resolves to the newly created chapter.
   * @throws {ApiError} - If the story is not found, or if a chapter with the same order already exists.
   */
  async createChapter(payload: CreateChapterPayload): Promise<IStoryChapter> {
    const story = await Story.findById(payload.storyId);
    if (!story) throw new ApiError(404, "Story not found");

    const orderExists = await StoryChapter.findOne({
      story: payload.storyId,
      order: payload.order,
    });
    if (orderExists) {
      throw new ApiError(
        409,
        `Chapter with order ${payload.order} already exists`
      );
    }

    let coverImageUrl: string | undefined;
    let publicId: string | undefined;

    if (payload?.coverImageLocalPath) {
      try {
        const res = await uploadOnCloudinary(payload.coverImageLocalPath);

        if (!res) {
          throw new ApiError(500, "Failed to upload cover image to cloudinary");
        }

        coverImageUrl = res.secure_url;
        publicId = res.public_id;
      } catch (error) {
        console.error(error, "Error uploading cover image to cloudinary");
        throw new ApiError(500, "Failed to upload cover image to cloudinary");
      }
    }

    const chapter = await StoryChapter.create({
      story: payload.storyId,
      title: payload.title,
      order: payload.order,
      openingNarrative: payload.openingNarrative,
      closingNarrative: payload.closingNarrative,
      coverImage: { url: coverImageUrl, publicId: publicId },
      accentColor: payload.accentColor,
      estimatedMinutes: payload.estimatedMinutes,
      unlockAfterChapters:
        payload.unlockAfterChapters?.map((id) => new Types.ObjectId(id)) ?? [],
    });

    await Story.findByIdAndUpdate(payload.storyId, {
      $push: { chapters: chapter._id },
    });

    return chapter;
  }

  /**
   * Updates a chapter with the given payload.
   * Throws an error if the chapter is not found, or if a chapter with the same order already exists.
   * @param {UpdateChapterPayload} payload - The payload containing the chapterId, storyId, requesterId, and any updated fields.
   * @returns {Promise<IStoryChapter>} - A promise that resolves to the updated chapter.
   * @throws {ApiError} - If the chapter is not found, or if a chapter with the same order already exists.
   */
  async updateChapter(payload: UpdateChapterPayload): Promise<IStoryChapter> {
    const { chapterId, storyId: _s, requesterId: _r, ...rest } = payload;

    const chapter = await StoryChapter.findById(chapterId);
    if (!chapter) throw new ApiError(404, "Chapter not found");

    let coverImageUrl: string | undefined;
    let publicId: string | undefined;

    if (rest?.coverImageLocalPath) {
      try {
        const res = await uploadOnCloudinary(rest.coverImageLocalPath);

        if (!res) {
          throw new ApiError(500, "Failed to upload cover image to cloudinary");
        }

        coverImageUrl = res.secure_url;
        publicId = res.public_id;
      } catch (error) {
        console.error(error, "Error uploading cover image to cloudinary");
        throw new ApiError(500, "Failed to upload cover image to cloudinary");
      }
    }

    if (rest.order !== undefined && rest.order !== chapter.order) {
      const taken = await StoryChapter.findOne({
        story: chapter.story,
        order: rest.order,
        _id: { $ne: chapterId },
      });
      if (taken)
        throw new ApiError(409, `Chapter order ${rest.order} is taken`);
    }

    Object.assign({
      chapter,
      rest,
      coverImage: { url: coverImageUrl, publicId },
    });
    await chapter.save();
    return chapter;
  }

  /**
   * Publishes a chapter to the story's published chapters list.
   * Throws an error if the chapter is not found, or if the chapter's graph is invalid.
   * @param {string} chapterId - The ID of the chapter to publish.
   * @param {string} storyId - The ID of the story that the chapter belongs to.
   * @returns {Promise<{ chapter: IStoryChapter; validation: GraphValidationResult }>}
   * A promise that resolves to an object containing the published chapter and its graph validation result.
   * @throws {ApiError} - If the chapter is not found, or if the chapter's graph is invalid.
   */
  async publishChapter(
    chapterId: string,
    storyId: string
  ): Promise<{ chapter: IStoryChapter; validation: GraphValidationResult }> {
    const chapter = await StoryChapter.findOne({
      _id: chapterId,
      story: storyId,
    });
    if (!chapter) throw new ApiError(404, "Chapter not found");

    const validation = chapter.validateGraph();
    if (!validation.valid) {
      throw new ApiError(
        400,
        `Chapter graph is invalid:\n${validation.errors.join("\n")}`
      );
    }

    // Cache entry node on the chapter document
    const entryNode = chapter.nodes.find((n) => n.isEntryPoint);
    if (entryNode) {
      chapter.entryNodeId = entryNode._id;
    }

    chapter.status = "published";
    await chapter.save({ validateBeforeSave: false });

    return { chapter, validation };
  }

  /**
   * Deletes a chapter from the story's chapter list.
   * Throws an error if the chapter is not found.
   * @param {string} chapterId - The ID of the chapter to delete.
   * @param {string} storyId - The ID of the story that the chapter belongs to.
   * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
   * @throws {ApiError} - If the chapter is not found.
   */
  async deleteChapter(chapterId: string, storyId: string): Promise<void> {
    const chapter = await StoryChapter.findOne({
      _id: chapterId,
      story: storyId,
    });
    if (!chapter) throw new ApiError(400, "Chapter not found");

    await Promise.all([
      StoryChapter.findByIdAndDelete(chapterId),
      Story.findByIdAndUpdate(storyId, { $pull: { chapters: chapter._id } }),
    ]);
  }

  /**
   * Creates a new node in the given chapter.
   * Throws an error if the chapter is not found, or if a node with the same order already exists.
   * Throws an error if the chapter already has an entry point node and the new node is also an entry point.
   * Throws an error if nextNode or targetNodes in choices reference unknown nodes in the chapter.
   * Throws an error if unlockAfter references unknown nodes in the chapter.
   * @param {CreateNodePayload} payload - The payload containing the chapterId, storyId, requesterId, and any updated fields.
   * @returns {Promise<IStoryChapter>} - A promise that resolves to the updated chapter.
   * @throws {ApiError} - If the chapter is not found, or if a node with the same order already exists, or if the chapter already has an entry point node and the new node is also an entry point, or if nextNode or targetNodes in choices reference unknown nodes in the chapter, or if unlockAfter references unknown nodes in the chapter.
   */
  async createNode(payload: CreateNodePayload): Promise<IStoryChapter> {
    const chapter = await StoryChapter.findOne({
      _id: payload.chapterId,
      story: payload.storyId,
    });
    if (!chapter) throw new ApiError(400, "Chapter not found");

    // Only one entry point allowed
    if (payload.isEntryPoint) {
      const existingEntry = chapter.nodes.find((n) => n.isEntryPoint);
      if (existingEntry) {
        throw new ApiError(
          409,
          `Chapter already has an entry point node [order=${existingEntry.order}]. ` +
            `Update or remove it before setting a new entry point.`
        );
      }
    }

    const orderExists = chapter.nodes.some((n) => n.order === payload.order);
    if (orderExists) {
      throw new ApiError(
        409,
        `Node with order ${payload.order} already exists in this chapter`
      );
    }

    // Validate nextNode and targetNodes exist within chapter
    const nodeIds = new Set(chapter.nodes.map((n) => n._id.toString()));

    if (payload.nextNode && !nodeIds.has(payload.nextNode)) {
      throw new ApiError(
        400,
        `nextNode ${payload.nextNode} does not exist in this chapter`
      );
    }

    for (const choice of payload.choices ?? []) {
      if (choice.targetNode && !nodeIds.has(choice.targetNode)) {
        throw new ApiError(
          400,
          `Choice "${choice.label}" targets unknown node ${choice.targetNode}`
        );
      }
    }

    for (const prereq of payload.unlockAfter ?? []) {
      if (!nodeIds.has(prereq)) {
        throw new ApiError(
          400,
          `unlockAfter references unknown node ${prereq}`
        );
      }
    }

    chapter.nodes.push({
      chapter: chapter._id,
      type: payload.type,
      order: payload.order,
      isEntryPoint: payload.isEntryPoint ?? false,
      challenge: payload.challengeId
        ? new Types.ObjectId(payload.challengeId)
        : null,
      preNarrative: payload.preNarrative ?? null,
      postNarrative: payload.postNarrative ?? null,
      characterId: payload.characterId ?? null,
      nextNode: payload.nextNode ? new Types.ObjectId(payload.nextNode) : null,
      choices:
        payload.choices?.map((c) => ({
          label: c.label,
          description: c.description,
          targetNode: new Types.ObjectId(c.targetNode),
        })) ?? [],
      unlockAfter:
        payload.unlockAfter?.map((id) => new Types.ObjectId(id)) ?? [],
      isOptional: payload.isOptional ?? false,
      xpBonus: payload.xpBonus ?? 0,
      content: payload.content ?? null,
    } as never);

    await chapter.save({ validateBeforeSave: false });
    return chapter;
  }

  /**
   * Updates a node in the story chapter.
   * If the node's order is changed, it will be re-positioned in the chapter.
   * If the node's nextNode or choices are updated, they will be re-validated.
   * If the node is marked as an entry point, the chapter must not already have an entry point.
   * @param {UpdateNodePayload} payload - The payload to update the node
   * @returns {Promise<IStoryChapter>} - The updated chapter document
   * @throws {ApiError} - If the chapter or node is not found, or if the node's order is already taken
   */
  async updateNode(payload: UpdateNodePayload): Promise<IStoryChapter> {
    const { nodeId, chapterId, requesterId: _r, ...rest } = payload;

    const chapter = await StoryChapter.findById(chapterId);
    if (!chapter) throw new ApiError(404, "Chapter not found");

    const nodeIdx = chapter.nodes.findIndex((n) => n._id.toString() === nodeId);
    if (nodeIdx === -1) throw new ApiError(404, "Node not found");

    // Entry point guard
    if (rest.isEntryPoint === true) {
      const existingEntry = chapter.nodes.find(
        (n, i) => n.isEntryPoint && i !== nodeIdx
      );
      if (existingEntry) {
        throw new ApiError(
          409,
          `Chapter already has an entry point. Remove it from node [order=${existingEntry.order}] first.`
        );
      }
    }

    if (rest.order !== undefined) {
      const taken = chapter.nodes.some(
        (n, i) => i !== nodeIdx && n.order === rest.order
      );
      if (taken) {
        throw new ApiError(409, `Node order ${rest.order} is already taken`);
      }
    }

    // Re-validate refs if updating nextNode or choices
    const nodeIds = new Set(chapter.nodes.map((n) => n._id.toString()));

    if (rest.nextNode !== undefined && rest.nextNode !== null) {
      if (!nodeIds.has(rest.nextNode)) {
        throw new ApiError(
          400,
          `nextNode ${rest.nextNode} does not exist in this chapter`
        );
      }
    }

    for (const choice of rest.choices ?? []) {
      if (choice.targetNode && !nodeIds.has(choice.targetNode)) {
        throw new ApiError(
          400,
          `Choice "${choice.label}" targets unknown node ${choice.targetNode}`
        );
      }
    }

    Object.assign(chapter.nodes[nodeIdx], rest);
    await chapter.save({ validateBeforeSave: false });
    return chapter;
  }

  /**
   * Deletes a node from the story chapter.
   * If any other node references this one (via nextNode, choices, or unlockAfter),
   * an error will be thrown, and those nodes must be updated first.
   * @throws {ApiError} - If the chapter or node is not found, or if the node is referenced by another node
   * @returns {Promise<IStoryChapter>} - The updated chapter document
   */
  async deleteNode(nodeId: string, chapterId: string): Promise<IStoryChapter> {
    const chapter = await StoryChapter.findById(chapterId);
    if (!chapter) throw new ApiError(404, "Chapter not found");

    const idx = chapter.nodes.findIndex((n) => n._id.toString() === nodeId);
    if (idx === -1) throw new ApiError(404, "Node not found");

    // Check if any other node references this one
    const referencedBy = chapter.nodes.filter(
      (n, i) =>
        i !== idx &&
        (n.nextNode?.toString() === nodeId ||
          n.choices.some((c) => c.targetNode.toString() === nodeId) ||
          n.unlockAfter.some((id) => id.toString() === nodeId))
    );

    if (referencedBy.length > 0) {
      const refs = referencedBy.map((n) => `[order=${n.order}]`).join(", ");
      throw new ApiError(
        409,
        `Cannot delete node — it is referenced by ${refs}. ` +
          `Update those nodes first.`
      );
    }

    chapter.nodes.splice(idx, 1);
    await chapter.save({ validateBeforeSave: false });
    return chapter;
  }

  /**
   * Validates the node graph of a chapter.
   * Throws 404 if the chapter is not found.
   * @param {string} chapterId - The ID of the chapter to validate.
   * @param {string} storyId - The ID of the story that the chapter belongs to.
   * @returns {Promise<GraphValidationResult>} - A promise that resolves to the graph validation result.
   */
  async validateChapterGraph(
    chapterId: string,
    storyId: string
  ): Promise<GraphValidationResult> {
    const chapter = await StoryChapter.findOne({
      _id: chapterId,
      story: storyId,
    });
    if (!chapter) throw new ApiError(404, "Chapter not found");

    return chapter.validateGraph();
  }

  /**
   * Retrieves a story by its ID, populated with author information.
   * Throws a 404 error if the story is not found.
   * @param {string} storyId - The ID of the story to retrieve.
   * @returns {Promise<IStory>} - A promise that resolves to the retrieved story.
   * @throws {ApiError} - If the story is not found.
   */
  async getStoryAdmin(storyId: string) {
    return this.getStoryDetail(storyId, undefined, true);
  }
}

export const storyService = new StoryService();
