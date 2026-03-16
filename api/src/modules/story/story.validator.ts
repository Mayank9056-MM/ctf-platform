import {  z } from "zod";
import { DIFFICULTY_LEVELS } from "../../utils/constants";

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour")
  .optional();

// Story

export const createStorySchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be under 120 characters")
    .trim(),

  tagline: z.string().max(180).trim().optional(),
  description: z.string().max(10000).trim().optional(),

  difficulty: z.enum(DIFFICULTY_LEVELS).optional().default("medium"),

  tags: z
    .array(z.string().max(30).toLowerCase().trim())
    .max(15, "Cannot have more than 15 tags")
    .optional()
    .default([]),

  coverImageUrl: z.url("Must be a valid URL").optional(),
  accentColor: hexColor,

  completionXpBonus: z
    .number()
    .int()
    .min(0, "XP bonus cannot be negative")
    .optional()
    .default(0),

  estimatedMinutes: z
    .number()
    .int()
    .min(1, "Estimated minutes must be at least 1")
    .optional(),
});

export const updateStorySchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title must be under 120 characters")
      .trim()
      .optional(),

    tagline: z
      .string()
      .max(180, "Tagline must be under 180 characters")
      .trim()
      .nullable()
      .optional(),

    description: z
      .string()
      .max(10000, "Description must be under 10000 characters")
      .trim()
      .nullable()
      .optional(),

    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
    tags: z
      .array(
        z
          .string()
          .max(30, "Tag must be under 30 characters")
          .toLowerCase()
          .trim()
      )
      .max(15, "Cannot have more than 15 tags")
      .optional(),
    coverImageUrl: z.url().nullable().optional(),
    accentColor: hexColor,
    completionXpBonus: z
      .number()
      .int()
      .min(0, "XP bonus cannot be negative")
      .optional(),
    estimatedMinutes: z
      .number()
      .int()
      .min(1, "Estimated minutes must be at least 1")
      .nullable()
      .optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

export const publishStorySchema = z.object({
  status: z.enum(["draft", "published", "archived"], {
    error: () => ({
      message: "Status must be draft, published or archived",
    }),
  }),
});

// Characters

export const addCharacterSchema = z.object({
  id: z
    .string()
    .min(1, "Character ID is required")
    .max(30, "Character ID must be under 30 characters")
    .regex(/^[a-z0-9_-]+$/, "Character id must be lowercase alphanumeric")
    .trim(),
  name: z
    .string()
    .min(1, "Character name is required")
    .max(80, "Character name must be under 80 characters")
    .trim(),
  avatarUrl: z.url().optional(),
  bio: z
    .string()
    .max(300, "Character bio must be under 300 characters")
    .trim()
    .optional(),
});

// Chapter

export const createChapterSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters")
    .trim(),
  order: z
    .number()
    .int("Order must be a whole number")
    .min(1, "Order must be at least 1"),

  openingNarrative: z
    .string()
    .max(5000, "Opening narrative must be under 5000 characters")
    .trim()
    .optional(),
  closingNarrative: z
    .string()
    .max(5000, "Closing narrative must be under 5000 characters")
    .trim()
    .optional(),
  coverImageUrl: z.url().optional(),
  accentColor: hexColor,
  estimatedMinutes: z
    .number()
    .int()
    .min(1, "Estimated minutes must be at least 1")
    .optional(),

  unlockAfterChapters: z.array(mongoId).optional().default([]),
});

export const updateChapterSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(120, "Title must be 120 characters")
      .trim()
      .optional(),
    openingNarrative: z
      .string()
      .max(5000, "Opening narrative must be under 5000 characters")
      .trim()
      .nullable()
      .optional(),
    closingNarrative: z
      .string()
      .max(5000, "Closing narrative must be under 5000 characters")
      .trim()
      .nullable()
      .optional(),
    coverImageUrl: z.url().nullable().optional(),
    accentColor: hexColor,
    estimatedMinutes: z
      .number()
      .int()
      .min(1, "Estimated minutes must be at least 1")
      .nullable()
      .optional(),
    unlockAfterChapters: z.array(mongoId).optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

// Story Node

const choiceSchema = z.object({
  label: z
    .string()
    .min(1, "Label is required")
    .max(120, "Label must be under 120 characters")
    .trim(),
  unlocksNode: mongoId,
});

export const createNodeSchema = z
  .object({
    type: z.enum(["challenge", "cutscene", "briefing", "choice"], {
      error: () => ({
        message: "Type must be: challenge, cutscene, briefing, or choice",
      }),
    }),

    order: z
      .number()
      .int("Order must be a whole number")
      .min(1, "Order must be at least 1"),

    challengeId: mongoId.optional(),

    preNarrative: z
      .string()
      .max(5000, "Pre-narrative must be under 5000 chars")
      .trim()
      .optional(),
    postNarrative: z
      .string()
      .max(5000, "Post-narrative must be under 5000 chars")
      .trim()
      .optional(),

    characterId: z.string().max(30).trim().optional(),

    unlockAfter: z.array(mongoId).optional().default([]),

    isOptional: z.boolean().optional().default(false),

    xpBonus: z
      .number()
      .int()
      .min(0, "Xp bonus must be at least 0")
      .optional()
      .default(0),

    content: z.string().max(10000).trim().optional(),

    choices: z
      .array(choiceSchema)
      .min(2, "Choices must have at least 2 choices")
      .optional(),
  })
  .refine((d) => d.type !== "challenge" || !!d.challengeId, {
    message: "challengeId is required when type is challenge",
    path: ["challengeId"],
  })
  .refine((d) => d.type === "challenge" || !!d.content || !!d.preNarrative, {
    message: "Non-challenge nodes must have content or pre-narrative",
    path: ["content"],
  });

export const updateNodeSchema = z
  .object({
    type: z.enum(["challenge", "cutscene", "briefing", "choice"]).optional(),
    order: z.number().int().min(1, "Order must be at least 1").optional(),
    challengeId: mongoId.nullable().optional(),
    preNarrative: z
      .string()
      .max(5000, "Pre-narrative must be under 5000 chars")
      .trim()
      .nullable()
      .optional(),
    postNarrative: z
      .string()
      .max(5000, "Post-narrative must be under 5000 chars")
      .trim()
      .nullable()
      .optional(),
    characterId: z
      .string()
      .max(30, "Character ID must be under 30 characters")
      .trim()
      .nullable()
      .optional(),
    unlockAfter: z.array(mongoId).optional(),
    isOptional: z.boolean().optional(),
    xpBonus: z.number().int().min(0, "Xp bonus must be at least 0").optional(),
    content: z.string().max(10000).trim().nullable().optional(),
    choices: z
      .array(choiceSchema)
      .min(2, "Choices must have at least 2 choices")
      .optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

// Player

export const makeChoiceSchema = z.object({
  choiceLabel: z
    .string()
    .min(1, "Choice label is required")
    .max(120, "Choice label must be under 120 characters")
    .trim(),
});

export const advanceNodeSchema = z.object({
  /** Client-reported elapsed seconds since last node for play-time tracking */
  elapsedSeconds: z
    .number()
    .int()
    .min(0, "Elapsed seconds must be at least 0")
    .optional()
    .default(0),
});

// Filters

export const storyFilterSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
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
  search: z
    .string()
    .max(100, "Search query must be under 100 characters")
    .trim()
    .optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1, "Page must be at least 1")),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(
      z
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(100, "Limit must be under 100")
    ),
});
