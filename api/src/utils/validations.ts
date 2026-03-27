import { z } from "zod";

export const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const paginationBase = {
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
        .max(100, "Limit cannot exceed 100")
    ),
};

export const booleanString = z
  .string()
  .optional()
  .transform((v) => (v === "true" ? true : v === "false" ? false : undefined));

export const isoDate = z.iso
  .datetime("Invalid ISO 8601 datetime")
  .transform((v) => new Date(v));

export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color e.g. #e11d48")
  .optional();
