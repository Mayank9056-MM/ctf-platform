import express from "express";
import {
  requireRole,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import { createAdmin, getAdmins, revokeAdmin } from "./admin.controllers";

const adminRouter = express.Router();

const isSuperAdmin = [verifyAuth, requireRole("superadmin")];

adminRouter.route("/").get(isSuperAdmin, getAdmins);
adminRouter.route("/").post(isSuperAdmin, createAdmin);
adminRouter.route("/:userId").delete(isSuperAdmin, revokeAdmin);

export default adminRouter;
