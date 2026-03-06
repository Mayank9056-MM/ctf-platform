import express from "express";
import { upload } from "../../middlewares/multer.middlerware";
import {
  changeCurrentPassword,
  currentUser,
  forgotPassword,
  login,
  logout,
  oauthLogin,
  refreshAccessToken,
  register,
  resetPassword,
  updateAccountDetails,
  updateUserAvatar,
} from "./auth.controller";
import { verifyAuth } from "../../middlewares/verifyAuth.middleware";

const authRouter = express.Router();

// Public Routes
authRouter.route("/register").post(upload.single("avatar"), register);
authRouter.route("/login").post(login);
authRouter.route("/forgot-password").post(forgotPassword);
authRouter.route("/reset-password/:token").post(resetPassword);
authRouter.route("/oauth-login").post(oauthLogin);

// Protected Routes
authRouter.route("/logout").post(verifyAuth, logout);
authRouter.route("/refresh-token").get(verifyAuth, refreshAccessToken);
authRouter.route("/change-password").patch(verifyAuth, changeCurrentPassword);
authRouter.route("/current-user").get(verifyAuth, currentUser);
authRouter.route("/update-account").patch(verifyAuth, updateAccountDetails);
authRouter
  .route("/update-avatar")
  .patch(verifyAuth, upload.single("avatar"), updateUserAvatar);

export default authRouter;
