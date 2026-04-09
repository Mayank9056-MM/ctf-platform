import "dotenv/config";
import { config } from "./config/config";
import { app } from "./index";
import connectDB, { getDBStatus } from "./db/index";
import { connectRedis } from "./config/redis";
import logger from "./utils/logger";
import { EmailService } from "./services/emailService";
import { initSocket } from "./socket/socket.gateway";
import { getRedis } from "./lib/redis";
import http from "http";

const PORT = config.PORT;

const httpServer = http.createServer(app);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Give some time for ongoing requests to complete
  setTimeout(() => {
    logger.info("Graceful shutdown completed");
    process.exit(0);
  }, 5000);
};

// Process event handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start server
(async () => {
  try {
    await connectDB();
    await connectRedis();
    await getRedis();

    await initSocket(httpServer);

    // Initialize email service
    EmailService.initialize();

    httpServer.listen(PORT, () => {
      logger.info(
        `🚀 Server is running on port ${PORT} in ${config.NODE_ENV} mode`
      );

      logger.info("📦 Database connection:", getDBStatus());
      logger.info("📊 Available endpoints:");
      logger.info(`   Health check: http://localhost:${PORT}/api/v1/health`);
      logger.info(`   API Base: http://localhost:${PORT}/api/v1`);
      logger.info(`   Database: ${config.MONGODB_URI.split("@")[1]}`);
      logger.info(
        `   Email Service: ${config.SMTP_HOST ? "Enabled" : "Disabled"}`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
})();
