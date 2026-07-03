import { z } from "zod";

export const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour e.g. #ff4500")
  .optional();

export const url = z.url("Must be a valid URL").optional();
