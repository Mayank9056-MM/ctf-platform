import { z } from "zod";
import { hexColor, mongoId } from "../../utils/validations";

// Story

export const createStorySchema = z.object({
  title: z.string().min(3).max(120).trim(),
  tagline: z.string().max(180).trim().optional(),
  description: z.string().max(10000).trim().optional(),
  difficulty: z
    .enum(["beginner", "easy", "medium", "hard", "insane"])
    .optional()
    .default("medium"),
  tags: z
    .array(z.string().max(30).toLowerCase().trim())
    .max(15)
    .optional()
    .default([]),
  accentColor: hexColor,
  completionXpBonus: z.number().int().min(0).optional().default(0),
  estimatedMinutes: z.number().int().min(1).optional(),
});

export const updateStorySchema = z
  .object({
    title: z.string().min(3).max(120).trim().optional(),
    tagline: z.string().max(180).trim().nullable().optional(),
    description: z.string().max(10000).trim().nullable().optional(),
    difficulty: z
      .enum(["beginner", "easy", "medium", "hard", "insane"])
      .optional(),
    tags: z.array(z.string().max(30).toLowerCase().trim()).max(15).optional(),
    accentColor: hexColor,
    completionXpBonus: z.number().int().min(0).optional(),
    estimatedMinutes: z.number().int().min(1).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

export const setStoryStatusSchema = z.object({
  status: z.enum(["draft", "published", "archived"], {
    error: () => ({
      message: "Status must be draft, published, or archived",
    }),
  }),
});

export const addCharacterSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Must be lowercase alphanumeric")
    .trim(),
  name: z.string().min(1).max(80).trim(),
  bio: z.string().max(300).trim().optional(),
});

// Chapter

export const createChapterSchema = z.object({
  title: z.string().min(1).max(120).trim(),
  order: z.number().int().min(1),
  openingNarrative: z.string().max(5000).trim().optional(),
  closingNarrative: z.string().max(5000).trim().optional(),
  accentColor: hexColor,
  estimatedMinutes: z.number().int().min(1).optional(),
  unlockAfterChapters: z.array(mongoId).optional().default([]),
});

export const updateChapterSchema = z
  .object({
    title: z.string().min(1).max(120).trim().optional(),
    order: z.number().int().min(1).optional(),
    openingNarrative: z.string().max(5000).trim().nullable().optional(),
    closingNarrative: z.string().max(5000).trim().nullable().optional(),
    accentColor: hexColor,
    estimatedMinutes: z.number().int().min(1).nullable().optional(),
    unlockAfterChapters: z.array(mongoId).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

// Node

const choiceInputSchema = z.object({
  label: z.string().min(1).max(120).trim(),
  description: z.string().max(300).trim().optional(),
  /** Must be an existing node _id within the same chapter */
  targetNode: mongoId.optional(),
});

export const createNodeSchema = z
  .object({
    type: z.enum(["challenge", "cutscene", "briefing", "choice"], {
      error: () => ({
        message: "Type must be: challenge, cutscene, briefing, or choice",
      }),
    }),

    order: z.number().int().min(1),

    /**
     * True for the node that starts this chapter.
     * Only one node per chapter may be the entry point.
     */
    isEntryPoint: z.boolean().optional().default(false),

    /** Required when type === "challenge" */
    challengeId: mongoId.optional(),

    preNarrative: z.string().max(5000).trim().optional(),
    postNarrative: z.string().max(5000).trim().optional(),
    characterId: z.string().max(30).trim().optional(),

    /**
     * Graph forward edge for linear nodes.
     * Must reference an existing node _id in the same chapter.
     * Forbidden on choice nodes.
     */
    nextNode: mongoId.optional(),

    /**
     * Graph branches for choice nodes.
     * Each targetNode must exist within the same chapter.
     * Required (≥2) for type === "choice".
     */
    choices: z.array(choiceInputSchema).optional(),

    /** AND-gate prerequisites */
    unlockAfter: z.array(mongoId).optional().default([]),

    isOptional: z.boolean().optional().default(false),
    xpBonus: z.number().int().min(0).optional().default(0),
    content: z.string().max(10000).trim().optional(),
  })
  .refine((d) => d.type !== "challenge" || !!d.challengeId, {
    message: "challengeId is required when type is 'challenge'",
    path: ["challengeId"],
  })
  .refine((d) => d.type !== "choice" || (d.choices && d.choices.length >= 2), {
    message: "choices (≥2) is required when type is 'choice'",
    path: ["choices"],
  })
  .refine((d) => d.type !== "choice" || !d.nextNode, {
    message: "Choice nodes must not have nextNode — use choices[].targetNode",
    path: ["nextNode"],
  })
  .refine(
    (d) =>
      d.type === "challenge" ||
      d.type === "choice" ||
      !!d.content ||
      !!d.preNarrative,
    {
      message: "Non-challenge nodes must have content or preNarrative",
      path: ["content"],
    }
  )
  .refine(
    (d) => {
      if (d.type !== "choice") return true;
      const labels = d.choices!.map((c) => c.label);
      return new Set(labels).size === labels.length;
    },
    {
      message: "Choice labels must be unique within a node",
      path: ["choices"],
    }
  );

export const updateNodeSchema = z
  .object({
    type: z.enum(["challenge", "cutscene", "briefing", "choice"]).optional(),
    order: z.number().int().min(1).optional(),
    isEntryPoint: z.boolean().optional(),
    challengeId: mongoId.nullable().optional(),
    preNarrative: z.string().max(5000).trim().nullable().optional(),
    postNarrative: z.string().max(5000).trim().nullable().optional(),
    characterId: z.string().max(30).trim().nullable().optional(),
    nextNode: mongoId.nullable().optional(),
    choices: z.array(choiceInputSchema).min(2).optional(),
    unlockAfter: z.array(mongoId).optional(),
    isOptional: z.boolean().optional(),
    xpBonus: z.number().int().min(0).optional(),
    content: z.string().max(10000).trim().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

// Player

export const makeChoiceSchema = z.object({
  choiceLabel: z.string().min(1).max(120).trim(),
});

export const advanceNodeSchema = z.object({
  elapsedSeconds: z.number().int().min(0).optional().default(0),
});

// Filters

export const storyFiltersSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  difficulty: z
    .enum(["beginner", "easy", "medium", "hard", "insane"])
    .optional(),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : undefined
    ),
  search: z.string().max(100).trim().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

export const connectEdgeSchema = z
  .object({
    fromId: mongoId,
    toId: mongoId,
    edgeType: z.enum(["linear", "choice", "unlock"], {
      error: () => ({ message: "edgeType must be linear, choice, or unlock" }),
    }),
    /** Required when edgeType === "choice". 0-based index into choices array. */
    choiceIndex: z.number().int().min(0).optional(),
    /** Optional: the choice label to set on choices[choiceIndex]. Ignored for non-choice edges. */
    label: z.string().max(120).trim().optional(),
  })
  .refine((d) => d.edgeType !== "choice" || d.choiceIndex !== undefined, {
    message: "choiceIndex is required when edgeType is 'choice'",
    path: ["choiceIndex"],
  })
  .refine((d) => d.fromId !== d.toId, {
    message: "fromId and toId must be different nodes",
    path: ["toId"],
  });

export type ConnectEdgeInput = z.infer<typeof connectEdgeSchema>;

export const disconnectEdgeSchema = z.object({
  edgeId: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-f\d]{24}-(linear|choice|unlock)(-[a-f\d]{24}|-\d+)$/i,
      "Invalid edgeId format. Expected: {nodeId}-{type}-{nodeIdOrIndex}"
    ),
});

export type DisconnectEdgeInput = z.infer<typeof disconnectEdgeSchema>;

const positionEntrySchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const savePositionsSchema = z.object({
  positions: z
    .record(
      // Keys must be valid MongoDB ObjectIds (node _ids)
      z.string().regex(/^[a-f\d]{24}$/i, "Key must be a valid node ObjectId"),
      positionEntrySchema
    )
    .refine((p) => Object.keys(p).length <= 500, {
      message: "Maximum 500 positions per save",
    }),
});

export type SavePositionsInput = z.infer<typeof savePositionsSchema>;
