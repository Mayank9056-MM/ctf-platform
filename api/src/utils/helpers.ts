// scoring Utility

import z from "zod";
import { ApiError } from "./ApiError";

/**
 * Exponential decay: points reduce as more players solve the challenge.
 * max(minPoints, floor(base × (0.5 + 0.5 × e^(−0.05 × (solveCount − 1)))))
 *
 * Examples (base=500, min=100):
 *   0 solves  → 500 pts   |   10 → ~439   |   50 → ~222   |  100 → ~108
 */
export function calculateDynamicPoints(
  basePoints: number,
  solveCount: number,
  scoringType: "static" | "dynamic",
  minPoints: number
): number {
  if (scoringType === "static") return basePoints;

  const decayed = Math.floor(
    basePoints * (0.5 + 0.5 * Math.exp(-0.05 * Math.max(0, solveCount - 1)))
  );

  return Math.max(minPoints, decayed);
}

/**
 * Validate an email address using a regular expression.
 * The regex pattern is: /^[^\s@]+@[^\s@]+\.[^\s@]+$
 * This pattern matches most common email addresses, but may not match all valid email addresses.
 * @param {string} email - The email address to validate.
 * @returns {boolean} true if the email address is valid, false otherwise.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Zod helpers

/**
 * Parse a given body using a zod schema and return the parsed data.
 * If the parsing fails, an ApiError is thrown with a 400 status code and a message describing the error.
 * @template T - The type of the parsed data.
 * @param {z.ZodSchema<T>} schema - The zod schema to use for parsing.
 * @param {unknown} body - The body to parse.
 * @returns {T} The parsed data.
 */
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new ApiError(
      400,
      result.error.message || "Something went wrong while parsing body"
    );
  }

  return result.data;
}
