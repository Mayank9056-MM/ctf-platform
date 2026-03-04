import express from "express";
import { upload } from "../../middlewares/multer.midderware";
import { login, register } from "./auth.controller";

const authRouter = express.Router();

authRouter.route("/register").post(upload.single("avatar"), register);
authRouter.route("/login").post(login);

export default authRouter;
