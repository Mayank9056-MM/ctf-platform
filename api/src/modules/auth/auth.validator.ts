import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .trim()
    .toLowerCase(),

  password: z.string().min(8, "Password must be at least 8 characters"),

  fullName: z
    .string()
    .max(100, "Full name cannot exceed 100 characters")
    .trim(),

  provider: z.literal("local").default("local"),
});

export const OAuthProfileSchema = z.object({
  provider: z.enum(["google", "github"]),
  fullName: z.string(),
  providerId: z.string(),
  email: z.string().email({ message: "Invalid email address" }),
  avatar: z.string().url({ message: "Avatar must be a valid URL" }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const changeCurrentPasswordSchema = z.object({
  oldPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
});
