import z from "zod";

export const createAdminSchema = z.object({
  email: z.email("Must be a valid email").trim().toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Passoword must contain at least one special character"
    ),

  fullName: z
    .string()
    .max(100, "Full name must be under 100 characters")
    .trim(),

  role: z
    .enum(["admin", "superadmin"], {
      error: () => ({ message: "Role must be 'admin' or 'superadmin'" }),
    })
    .optional()
    .default("admin"),
});

export const adminListFilterSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1)),

  role: z.enum(["admin", "superadmin"]).optional(),

  search: z.string().max(100).trim().optional(),
});
