import express from "express";
import {
  optionalAuth,
  verifyAuth,
} from "../../middlewares/verifyAuth.middleware";
import {
  currentUser,
  getUserProfile,
  updateAccountDetails,
  updateUserAvatar,
} from "./user.controller";
import { upload } from "../../middlewares/avatarUpload.middleware";

const userRouter = express.Router();

userRouter.route("/current-user").get(verifyAuth, currentUser);
userRouter.route("/update-account").patch(verifyAuth, updateAccountDetails);
userRouter
  .route("/update-avatar")
  .patch(verifyAuth, upload.single("avatar"), updateUserAvatar);
userRouter.route("/profile/:username").get(optionalAuth, getUserProfile);

export default userRouter;
