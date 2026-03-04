import express from "express";
import { upload } from "../../middlewares/multer.midderware";
import { register } from "./auth.controller";

const authRouter = express.Router();

authRouter.route("/register").post(upload.single("avatar"), register);

export default authRouter;
