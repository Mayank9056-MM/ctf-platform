import { z } from "zod";

export const editProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ and - only")
    .optional(),
  fullName: z.string().max(100).trim().optional(),
  bio: z.string().max(200).trim().optional(),
  country: z.string().length(2).toUpperCase().optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Needs uppercase")
      .regex(/[0-9]/, "Needs number")
      .regex(/[^a-zA-Z0-9]/, "Needs special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type EditProfileData = z.infer<typeof editProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
