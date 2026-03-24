import { z } from "zod";

// Shared

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const paginationSchema = {
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1, "Page must be at least 1")),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100, "Limit cannot exceed 100")),
};

// User Filters

export const adminUserFiltersSchema = z.object({
  ...paginationSchema,

  search: z
    .string()
    .max(100, "Search query must be under 100 characters")
    .trim()
    .optional(),

  role: z.enum(["user", "admin", "superadmin"]).optional(),

  isBanned: z
    .string()
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined
    ),

  isVerified: z
    .string()
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined
    ),

  isDeleted: z
    .string()
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined
    ),

  hasTeam: z
    .string()
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined
    ),

  country: z
    .string()
    .length(2, "Country must be a 2-letter ISO code (e.g. IN, US)")
    .toUpperCase()
    .optional(),

  sortBy: z
    .enum(["score", "createdAt", "lastActive", "username", "email"])
    .optional()
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Update User

export const adminUpdateUserSchema = z
  .object({
    fullName: z
      .string()
      .max(100, "Full name must be under 100 characters")
      .trim()
      .optional(),

    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be under 30 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores and hyphens"
      )
      .optional(),

    email: z.email("Must be a valid email address").toLowerCase().optional(),

    score: z
      .number()
      .int("Score must be a whole number")
      .min(0, "Score cannot be negative")
      .optional(),

    country: z
      .string()
      .length(2, "Country must be a 2-letter ISO code")
      .toUpperCase()
      .optional(),

    isVerified: z.boolean().optional(),

    bio: z
      .string()
      .max(200, "Bio cannot exceed 200 characters")
      .trim()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// Ban User

export const banUserSchema = z.object({
  reason: z
    .string()
    .min(5, "Ban reason must be at least 5 characters")
    .max(500, "Ban reason must be under 500 characters")
    .trim(),

  expiresAt: z.iso
    .datetime({ message: "expiresAt must be a valid ISO 8601 datetime" })
    .transform((v) => new Date(v))
    .refine((d) => d > new Date(), "Ban expiry must be in the future")
    .optional(),
});

// ─── Change Role ──────────────────────────────────────────────────────────────

export const changeRoleSchema = z.object({
  role: z.enum(["user", "admin", "superadmin"], {
    error: () => ({
      message: "Role must be one of: user, admin, superadmin",
    }),
  }),
});

// ─── Score Adjust ─────────────────────────────────────────────────────────────

export const manualScoreAdjustSchema = z.object({
  delta: z
    .number()
    .int("Delta must be a whole number")
    .refine((n) => n !== 0, "Delta cannot be zero"),

  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason must be under 500 characters")
    .trim(),
});

// ─── Admin Account Management ─────────────────────────────────────────────────

export const createAdminSchema = z.object({
  email: z.email("Must be a valid email address").toLowerCase().trim(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),

  fullName: z
    .string()
    .max(100, "Full name must be under 100 characters")
    .trim()
    .optional(),

  role: z
    .enum(["admin", "superadmin"], {
      error: () => ({ message: "Role must be 'admin' or 'superadmin'" }),
    })
    .default("admin"),
});

export const adminListFilterSchema = z.object({
  ...paginationSchema,

  role: z.enum(["admin", "superadmin"]).optional(),

  search: z
    .string()
    .max(100, "Search query must be under 100 characters")
    .trim()
    .optional(),
});

// Audit Log Filters

export const auditLogFiltersSchema = z.object({
  ...paginationSchema,

  action: z.string().trim().optional(),

  outcome: z.enum(["success", "failure", "error"]).optional(),

  actorId: mongoId.optional(),

  targetId: mongoId.optional(),

  collection: z.string().trim().optional(),

  ipAddress: z.ipv4().or(z.ipv6()).optional(),

  from: z.iso
    .datetime({ message: "to must be a valid ISO 8601 datetime" })
    .transform((v) => new Date(v))
    .optional(),

  to: z.iso
    .datetime({ message: "to must be a valid ISO 8601 datetime" })
    .transform((v) => new Date(v))
    .optional(),
});
