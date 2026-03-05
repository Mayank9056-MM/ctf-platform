import express from "express";
import { upload } from "../../middlewares/multer.middlerware";
import {
  changeCurrentPassword,
  login,
  logout,
  refreshAccessToken,
  register,
} from "./auth.controller";
import { verifyAuth } from "../../middlewares/verifyAuth.middleware";

const authRouter = express.Router();

authRouter.route("/register").post(upload.single("avatar"), register);
authRouter.route("/login").post(login);
authRouter.route("/logout").post(verifyAuth, logout);
authRouter.route("/refresh-token").get(verifyAuth, refreshAccessToken);
authRouter.route("/change-password").patch(verifyAuth, changeCurrentPassword);

export default authRouter;
