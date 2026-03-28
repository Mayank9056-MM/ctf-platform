import { z } from "zod";

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email address" }).trim().toLowerCase(),

  password: z.string().min(8, "Password must be at least 8 characters"),

  fullName: z
    .string()
    .max(100, "Full name cannot exceed 100 characters")
    .trim(),

  provider: z.literal("local").default("local"),
});

export const OAuthProfileSchema = z.object({
  provider: z.enum(["google", "github"]),
  token: z.string().min(20),
});

export const loginSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const changeCurrentPasswordSchema = z
  .object({
    oldPassword: z.string().min(8, "Password must be at least 8 characters"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New Password must differ from old password",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .trim()
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
