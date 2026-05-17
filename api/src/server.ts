//src/server.ts

import "dotenv/config";
import http from "http";
import net from "net";
import mongoose from "mongoose";

import { config } from "./config/config";
import { app } from "./index";
import connectDB, { getDBStatus } from "./db/index";
import { EmailService } from "./services/emailService";
import { initSocket, getIO } from "./socket/socket.gateway";
import logger, {
  emailLogger,
  mongoLogger,
  redisLogger,
  shutdownLogger,
  socketLogger,
} from "./lib/logger";
import { connectRedis, disconnectRedis } from "./lib/redis";

// Constants

const PORT = config.PORT;
const SHUTDOWN_TIMEOUT = 30_000;

// HTTP Server

const httpServer = http.createServer(app);

// Connection Tracking

interface TrackedSocket extends net.Socket {
  _isActive?: boolean;
}

const openSockets = new Set<TrackedSocket>();

httpServer.on("connection", (socket: TrackedSocket) => {
  openSockets.add(socket);
  socket.on("close", () => openSockets.delete(socket));
});

app.use((_req, _res, next) => {
  const socket = _req.socket as TrackedSocket;
  if (socket) socket._isActive = true;

  _res.on("finish", () => {
    if (socket) {
      socket._isActive = false;
      if (isShuttingDown) socket.destroy();
    }
  });
  next();
});

// Shutdown State

let isShuttingDown = false;
let forceExitTimer: NodeJS.Timeout | null = null;

function scheduleForceExit(): void {
  forceExitTimer = setTimeout(() => {
    shutdownLogger.fatal("Force exit — clean shutdown exceeded timeout", {
      timeoutMs: SHUTDOWN_TIMEOUT,
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  forceExitTimer.unref();
}

function cancelForceExit(): void {
  if (forceExitTimer !== null) {
    clearTimeout(forceExitTimer);
    forceExitTimer = null;
  }
}

// Graceful Shutdown

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    shutdownLogger.warn("Already shutting down — ignoring duplicate signal", {
      signal,
    });
    return;
  }

  isShuttingDown = true;
  shutdownLogger.info("Graceful shutdown initiated", { signal });
  scheduleForceExit();

  // Close HTTP server
  await new Promise<void>((resolve) => {
    httpServer.close((err) => {
      if (err) {
        shutdownLogger.warn("HTTP server was not listening", {
          err,
          signal,
        });
      } else {
        shutdownLogger.info("HTTP server closed — no new connections accepted");
      }
      resolve();
    });

    for (const socket of openSockets) {
      if (!socket._isActive) {
        socket.destroy();
        openSockets.delete(socket);
      }
    }
  });

  // Close Socket.IO
  await new Promise<void>((resolve) => {
    try {
      const io = getIO();
      io.close(() => {
        socketLogger.info("Socket.IO closed");
        resolve();
      });
    } catch (err) {
      socketLogger.warn("Socket.IO was not initialised — skipping", { err });
      resolve();
    }
  });

  // Close Email transporter
  try {
    const transporter = EmailService.getTransporter();
    if (transporter) {
      transporter.close();
      emailLogger.info("Email transporter closed");
    }
  } catch (err) {
    emailLogger.warn("Error closing email transporter — continuing", { err });
  }

  // Close Redis
  try {
    await disconnectRedis();
    redisLogger.info("Redis connection closed");
  } catch (err) {
    redisLogger.warn("Error closing redis — continuing", { err });
  }

  // Close MongoDB
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      mongoLogger.info("MongoDB connection closed");
    } else {
      mongoLogger.info("MongoDB was already disconnected — skipping");
    }
  } catch (err) {
    mongoLogger.warn("Error closing MongoDB — continuing", { err });
  }

  cancelForceExit();
  shutdownLogger.info("Graceful shutdown complete");
  process.exit(0);
}

// Signal Handlers

(["SIGINT", "SIGTERM", "SIGQUIT"] as const).forEach((signal) => {
  process.once(signal, () => gracefulShutdown(signal));
});

// Unhandled Error Handlers

process.on("uncaughtException", (error: Error) => {
  // logger.fatal so it maps to our highest severity level
  logger.fatal("Uncaught exception — initiating shutdown", {
    err: error,
    component: "process",
  });
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal("Unhandled promise rejection — initiating shutdown", {
    reason,
    component: "process",
  });
  gracefulShutdown("unhandledRejection");
});

// Startup

(async () => {
  try {
    await connectDB();
    mongoLogger.info("MongoDB connected", { db: getDBStatus() });

    await connectRedis();
    redisLogger.info("Redis connected");

    await initSocket(httpServer);
    socketLogger.info("Socket.IO initialised");

    EmailService.initialize();
    emailLogger.info("Email service initialised", {
      smtp: config.SMTP_HOST ? "enabled" : "disabled",
    });

    httpServer.listen(PORT, () => {
      logger.info("Server listening", {
        port: PORT,
        env: config.NODE_ENV,
        db: getDBStatus(),
      });
    });
  } catch (error) {
    // Use fatal for startup failures — process cannot continue
    logger.fatal("Fatal: failed to start server", {
      err: error,
      component: "startup",
    });
    process.exit(1);
  }
})();
