import { z } from "zod";

export const updateAccountDetailsSchema = z.object({
  fullName: z
    .string()
    .max(100, "Full name cannot exceed 100 characters")
    .trim()
    .optional(),

  email: z
    .email({ message: "Invalid email address" })
    .trim()
    .toLowerCase()
    .optional(),

  mobileNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid mobile number")
    .optional(),

  bio: z
    .string()
    .max(5000, "Bio should be less than 5000 characters")
    .optional(),

  country: z.string().max(2, "Please enter a valid country").optional(),
});
