import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.middleware";
import {
  currentUser,
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

export default userRouter;
