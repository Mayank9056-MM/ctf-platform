import express from "express";
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
import { authRateLimiter } from "../../middlewares/ratelimit.middleware";
import { upload } from "../../middlewares/avatarUpload.middleware";

const authRouter = express.Router();

// Public Routes
authRouter
  .route("/register")
  .post(authRateLimiter, upload.single("avatar"), register);
authRouter.route("/login").post(authRateLimiter, login);
authRouter.route("/forgot-password").post(forgotPassword);
authRouter.route("/reset-password/:token").post(resetPassword);
authRouter.route("/oauth").post(authRateLimiter, oauthLogin);
authRouter.route("/refresh-token").post(refreshAccessToken);

// Protected Routes
authRouter.route("/logout").post(verifyAuth, logout);
authRouter.route("/change-password").patch(verifyAuth, changeCurrentPassword);
authRouter.route("/current-user").get(verifyAuth, currentUser);
authRouter.route("/update-account").patch(verifyAuth, updateAccountDetails);
authRouter
  .route("/update-avatar")
  .patch(verifyAuth, upload.single("avatar"), updateUserAvatar);

export default authRouter;
