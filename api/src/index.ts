import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
// import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import {
  errorLoggerMiddleware,
  errorResponderMiddleware,
} from "./middlewares/errorLogger.middleware";
import { requestLoggerMiddleware } from "./middlewares/requestLogger.middleware";

const app = express();

app.use(requestLoggerMiddleware);

// Global rate limiting
import { rateLimiter } from "./middlewares/ratelimit.middleware";
app.use(rateLimiter);

// security middleware
app.use(helmet());

// app.use(mongoSanitize({}));
app.use(hpp());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Access",
      "X-Request-ID",
    ],
  })
);

// Body parser middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Disable ETag generation
app.disable("etag");

// Also disable browser caching
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// compress responses
import compression from "compression";
app.use(compression());

// import routes
import authRouter from "./modules/auth/auth.routes";
import teamRouter from "./modules/teams/team.route";
import challengeRouter from "./modules/challenges/challenge.routes";
import adminRouter from "./modules/admin/admin.routes";
import storyRouter from "./modules/story/story.routes";
import submissionRouter from "./modules/submissions/submission.route";
import eventRouter from "./modules/events/event.routes";
import notificationRouter from "./modules/notification/notification.routes";
import announcementRouter from "./modules/announcement/announcement.routes";
import userRouter from "./modules/users/user.routes";
import refreshTokenRouter from "./modules/refreshToken/refreshToken.routes";
import leaderboardRouter from "./modules/leaderboard/leaderboard.routes";
import healthRouter from "./modules/health-check/healthCheck.route";

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/challenges", challengeRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/story", storyRouter);
app.use("/api/v1/submission", submissionRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/announcement", announcementRouter);
app.use("/api/v1/refresh-token", refreshTokenRouter);
app.use("/api/v1/leaderboard", leaderboardRouter);
app.use("/api/v1/health", healthRouter);

// It should be always at bottom
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found ❌",
  });
});

app.use(errorLoggerMiddleware);
app.use(errorResponderMiddleware);

export { app };
