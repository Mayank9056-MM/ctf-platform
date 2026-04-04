import express from "express";
import {
  listSessions,
  revokeAllSessions,
  revokeSession,
  rotateRefreshToken,
} from "./refreshToken.controller";
import { verifyAuth } from "../../middlewares/verifyAuth.middleware";

const refreshTokenRouter = express.Router();

/**
 * POST   /auth/refresh              → rotate refresh token (no auth required — uses cookie)
 * GET    /auth/sessions             → list active sessions
 * DELETE /auth/sessions             → revoke ALL sessions (logout all)
 * DELETE /auth/sessions/:sessionId  → revoke specific session
 */
refreshTokenRouter.post("/auth/refresh", rotateRefreshToken);
refreshTokenRouter.get("/auth/sessions", verifyAuth, listSessions);
refreshTokenRouter.delete("/auth/sessions", verifyAuth, revokeAllSessions);
refreshTokenRouter.delete(
  "/auth/sessions/:sessionId",
  verifyAuth,
  revokeSession
);

export default refreshTokenRouter;
