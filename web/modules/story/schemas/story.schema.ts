// modules/story/validations/story.schema.ts
import { z } from "zod";
import {
  STORY_DIFFICULTIES,
  STORY_STATUSES,
  NODE_TYPES,
} from "../types/story.types";

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");
const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour e.g. #ff4500")
  .optional();
const url = z.url("Must be a valid URL").optional();

// Story

export const createStorySchema = z.object({
  title: z.string().min(3).max(120).trim(),
  tagline: z.string().max(180).trim().optional(),
  description: z.string().max(10000).trim().optional(),
  difficulty: z.enum(STORY_DIFFICULTIES).optional().default("medium"),
  tags: z
    .array(z.string().max(30).toLowerCase().trim())
    .max(15)
    .optional()
    .default([]),
  coverImageUrl: url,
  accentColor: hexColor,
  completionXpBonus: z.number().int().min(0).optional().default(0),
  estimatedMinutes: z.number().int().min(1).optional(),
});

export type CreateStoryFormData = z.infer<typeof createStorySchema>;
export type CreateStoryInput = z.input<typeof createStorySchema>;

export const updateStorySchema = z
  .object({
    title: z.string().min(3).max(120).trim().optional(),
    tagline: z.string().max(180).trim().nullable().optional(),
    description: z.string().max(10000).trim().nullable().optional(),
    difficulty: z.enum(STORY_DIFFICULTIES).optional(),
    tags: z.array(z.string().max(30).toLowerCase().trim()).max(15).optional(),
    coverImageUrl: z.string().url().nullable().optional(),
    accentColor: hexColor,
    completionXpBonus: z.number().int().min(0).optional(),
    estimatedMinutes: z.number().int().min(1).nullable().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateStoryFormData = z.infer<typeof updateStorySchema>;

export const setStoryStatusSchema = z.object({
  status: z.enum(STORY_STATUSES, {
    error: () => ({ message: "Status must be draft, published, or archived" }),
  }),
});

export type SetStoryStatusFormData = z.infer<typeof setStoryStatusSchema>;

export const addCharacterSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Must be lowercase alphanumeric")
    .trim(),
  name: z.string().min(1).max(80).trim(),
  avatarUrl: z.url("Must be a valid URL").optional(),
  bio: z.string().max(300).trim().optional(),
});

export type AddCharacterFormData = z.infer<typeof addCharacterSchema>;

// Chapter

export const createChapterSchema = z.object({
  title: z.string().min(1).max(120).trim(),
  order: z.number().int().min(1),
  openingNarrative: z.string().max(5000).trim().optional(),
  closingNarrative: z.string().max(5000).trim().optional(),
  coverImageUrl: url,
  accentColor: hexColor,
  estimatedMinutes: z.number().int().min(1).optional(),
  unlockAfterChapters: z.array(mongoId).optional().default([]),
});

export type CreateChapterFormData = z.infer<typeof createChapterSchema>;

export const updateChapterSchema = z
  .object({
    title: z.string().min(1).max(120).trim().optional(),
    order: z.number().int().min(1).optional(),
    openingNarrative: z.string().max(5000).trim().nullable().optional(),
    closingNarrative: z.string().max(5000).trim().nullable().optional(),
    coverImageUrl: z.string().url().nullable().optional(),
    accentColor: hexColor,
    estimatedMinutes: z.number().int().min(1).nullable().optional(),
    unlockAfterChapters: z.array(mongoId).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateChapterFormData = z.infer<typeof updateChapterSchema>;

// Node

const choiceInputSchema = z.object({
  label: z.string().min(1).max(120).trim(),
  description: z.string().max(300).trim().optional(),
  targetNode: mongoId.optional(),
});

export const createNodeSchema = z
  .object({
    type: z.enum(NODE_TYPES, {
      error: () => ({
        message: "Type must be: challenge, cutscene, briefing, or choice",
      }),
    }),
    order: z.number().int().min(1),
    isEntryPoint: z.boolean().optional().default(false),
    challengeId: mongoId.optional(),
    preNarrative: z.string().max(5000).trim().optional(),
    postNarrative: z.string().max(5000).trim().optional(),
    characterId: z.string().max(30).trim().optional(),
    nextNode: mongoId.optional(),
    choices: z.array(choiceInputSchema).optional(),
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
    },
  )
  .refine(
    (d) => {
      if (d.type !== "choice") return true;
      if (!d.choices || d.choices.length === 0) return true;
      const labels = d.choices.map((c) => c.label);
      return new Set(labels).size === labels.length;
    },
    {
      message: "Choice labels must be unique within a node",
      path: ["choices"],
    },
  );

export type CreateNodeFormData = z.infer<typeof createNodeSchema>;

export const updateNodeSchema = z
  .object({
    type: z.enum(NODE_TYPES).optional(),
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
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateNodeFormData = z.infer<typeof updateNodeSchema>;

// Player

export const makeChoiceSchema = z.object({
  choiceLabel: z.string().min(1).max(120).trim(),
});

export type MakeChoiceFormData = z.infer<typeof makeChoiceSchema>;

export const advanceNodeSchema = z.object({
  elapsedSeconds: z.number().int().min(0).optional().default(0),
});

export type AdvanceNodeFormData = z.infer<typeof advanceNodeSchema>;

// Filters

export const storyFiltersSchema = z.object({
  status: z.enum(STORY_STATUSES).optional(),
  difficulty: z.enum(STORY_DIFFICULTIES).optional(),
  tags: z.string().optional(),
  search: z.string().max(100).trim().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export type StoryFiltersFormData = z.infer<typeof storyFiltersSchema>;
