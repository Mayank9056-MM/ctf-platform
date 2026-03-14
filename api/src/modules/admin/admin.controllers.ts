// helpers

import User from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { adminService } from "./admin.service";
import { adminListFilterSchema, createAdminSchema } from "./admin.validators";

const getAdmins = asyncHandler(async (req, res) => {
  const parsed = adminListFilterSchema.safeParse(req.query);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error.message || "Something went wrong while fetching admins"
    );
  }

  const result = await adminService.getAdmins(parsed.data);

  if (!result) {
    throw new ApiError(500, "something went wrong while fetching admins");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        admins: result.admins,
        meta: result.meta,
      },
      "Admin accounts retrieved"
    )
  );
});

const createAdmin = asyncHandler(async (req, res) => {
  const parsed = createAdminSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error.message || "something went wrong while creating admin"
    );
  }

  const admin = await adminService.createAdmin({
    ...parsed.data,
    requesterId: req.user!._id,
    requesterRole: req.user!.role,
    requesterUsername: req.user!.username,
  });

  if (!admin) {
    throw new ApiError(500, "Something went wrong while creating admin");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        admin,
        `${admin.role === "superadmin" ? "Superadmin" : "Admin"} account created successfully`
      )
    );
});

const revokeAdmin = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;
  const requesterId = req.user!._id;

  const success = await adminService.revokeAdmin(
    userId,
    requesterId,
    req.user!.username
  );

  if (!success) {
    throw new ApiError(500, "Something went wrong while revoking admin");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Admin account revoked successfully"));
});

export { getAdmins, createAdmin, revokeAdmin };
