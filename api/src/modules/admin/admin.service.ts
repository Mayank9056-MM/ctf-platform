import { Types } from "mongoose";
import AuditLog, { IAuditLogModel } from "../../models/auditlog.model";
import User from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { createAdminInput, getAdminsInput } from "./admin.types";

class AdminService {
  // helpers
  buildMeta(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  // main
  async getAdmins(data: getAdminsInput) {
    const { role, search, page = 1, limit = 20 } = data;

    const query: Record<string, unknown> = {
      role: role ?? { $in: ["admin", "superadmin"] },
      isDeleted: false,
    };

    if (search) {
      query.$or = [
        { username: { $regex: data.search, $options: "i" } },
        { email: { $regex: data.search, $options: "i" } },
        { fullName: { $regex: data.search, $options: "i" } },
      ];
    }

    const [admins, total] = await Promise.all([
      User.find(query)
        .select(
          "username email fullName role isVerified isBanned createdAt lastActive"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(query),
    ]);

    const result = {
      admins,
      meta: this.buildMeta(page, limit, total),
    };

    return result;
  }

  async createAdmin(data: createAdminInput) {
    const {
      email,
      password,
      fullName,
      role,
      requesterId,
      requesterRole,
      requesterUsername,
    } = data;

    // role gaurd
    if (role === "superadmin" && requesterRole !== "superadmin") {
      throw new ApiError(403, "Only superadmin can create superadmin accounts");
    }

    // email uniqueness
    const emailTaken = await User.findOne({ email });

    if (emailTaken) {
      throw new ApiError(409, `An account with email ${email} already exists`);
    }

    const admin = await User.create({
      email,
      password,
      fullName,
      role,
      isVerified: true,
      providers: [
        {
          provider: "local",
          providerId: email,
        },
      ],
    });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "user:role_change",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: requesterRole,
        type: "admin",
      },
      target: {
        id: admin._id as Types.ObjectId,
        collection: "User",
        label: admin.username,
      },
      diff: {
        before: { role: "none" },
        after: { role },
        changedFields: ["role"],
      },
      metadata: {
        action: "admin_account_created",
        createdRole: role,
      },
    });

    return admin;
  }

  async revokeAdmin(
    userId: string,
    requesterId: Types.ObjectId,
    requesterUsername: string
  ) {
    if (userId === requesterId.toString()) {
      throw new ApiError(400, "You cannot revoke you own admin privileges");
    }

    const target = await User.findOne({
      _id: userId,
      role: {
        $in: ["admin", "superadmin"],
      },
      isDeleted: false,
    });

    if (!target) {
      throw new ApiError(404, "Admin account not found");
    }

    // prevent removing the last superadmin
    if (target.role === "superadmin") {
      const count = await User.countDocuments({
        role: "superadmin",
        isDeleted: false,
      });

      if (count <= 1) {
        throw new ApiError(
          409,
          "Cannot revoke the last superadmin. Promote another user first"
        );
      }
    }

    const previousRole = target.role;
    target.role = "user";

    await target.save({ validateBeforeSave: false });

    await (AuditLog as unknown as IAuditLogModel).record({
      action: "user:role_change",
      outcome: "success",
      actor: {
        userId: requesterId,
        username: requesterUsername,
        role: "user",
        type: "admin",
      },
      target: {
        id: target._id as Types.ObjectId,
        collection: "User",
        label: target.username,
      },
      diff: {
        before: {
          role: previousRole,
        },
        after: {
          role: "user",
        },
        changedFields: ["role"],
      },
      metadata: {
        action: "admin_revoked",
      },
    });

    return true;
  }
}

export const adminService = new AdminService();
