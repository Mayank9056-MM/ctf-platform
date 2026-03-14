import { Types } from "mongoose";

export type getAdminsInput = {
  page?: number;
  limit?: number;
  role?: "admin" | "superadmin";
  search?: string;
};

export type createAdminInput = {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "superadmin";
  requesterId: Types.ObjectId;
  requesterRole: string;
  requesterUsername: string;
};
