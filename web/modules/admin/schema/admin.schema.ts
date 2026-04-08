import { z } from "zod";

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");
const pagination = {
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
};

export const adminUserFiltersSchema = z.object({
  ...pagination,
  search: z.string().max(100).trim().optional(),
  role: z.enum(["user", "admin", "superadmin"]).optional(),
  isBanned: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  hasTeam: z.boolean().optional(),
  country: z.string().length(2).toUpperCase().optional(),
  sortBy: z
    .enum(["score", "createdAt", "lastActive", "username", "email"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const adminUpdateUserSchema = z
  .object({
    fullName: z.string().max(100).trim().optional(),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .optional(),
    email: z.string().email().toLowerCase().optional(),
    score: z.number().int().min(0).optional(),
    country: z.string().length(2).toUpperCase().optional(),
    isVerified: z.boolean().optional(),
    bio: z.string().max(200).trim().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type AdminUpdateUserFormData = z.infer<typeof adminUpdateUserSchema>;

export const banUserSchema = z.object({
  reason: z.string().min(5).max(500).trim(),
  expiresAt: z.iso
    .datetime()
    .refine((v) => new Date(v) > new Date(), "Must be in the future")
    .optional(),
});

export type BanUserFormData = z.infer<typeof banUserSchema>;

export const changeRoleSchema = z.object({
  role: z.enum(["user", "admin", "superadmin"], {
    error: () => ({ message: "Role must be user, admin, or superadmin" }),
  }),
});

export type ChangeRoleFormData = z.infer<typeof changeRoleSchema>;

export const manualScoreAdjustSchema = z.object({
  delta: z
    .number()
    .int()
    .refine((n) => n !== 0, "Delta cannot be zero"),
  reason: z.string().min(5).max(500).trim(),
});

export type ManualScoreAdjustFormData = z.infer<typeof manualScoreAdjustSchema>;

export const createAdminSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
  fullName: z.string().max(100).trim().optional(),
  role: z.enum(["admin", "superadmin"]).default("admin"),
});

export type CreateAdminFormData = z.infer<typeof createAdminSchema>;

export const auditLogFiltersSchema = z.object({
  ...pagination,
  action: z.string().trim().optional(),
  outcome: z.enum(["success", "failure", "error"]).optional(),
  actorId: mongoId.optional(),
  targetId: mongoId.optional(),
  collection: z.string().trim().optional(),
  ipAddress: z.ipv4().or(z.ipv6()).optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});
