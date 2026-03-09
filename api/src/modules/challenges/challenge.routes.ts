import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.middleware";
import { getChallenges } from "./challenge.controller";

const challengeRouter = express.Router();

/**
 * GET  /challenges
 * Public list of visible challenges.
 * Optional auth: authenticated users get isSolved annotation.
 * Query params: category, difficulty, tags, search, page, limit, sortBy, sortOrder
 */
challengeRouter.route("/").get(verifyAuth, getChallenges);

export default challengeRouter;
