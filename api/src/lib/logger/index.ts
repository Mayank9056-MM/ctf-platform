// src/utils/logger/index.ts

import { config } from "../../config/config";
import { createCoreLogger } from "./factory";
import { ILogger, LogMeta } from "./types";
export { runWithContext, getContext } from "./context";
export { serializeError, normalizeMeta } from "./serializers";

// Singleton

const coreLogger = createCoreLogger({
  nodeEnv: config.NODE_ENV,
  service: "CTF-Platform",
  // Set to true when deploying to Kubernetes / Docker to disable file transports
  stdoutOnly: process.env.LOG_STDOUT_ONLY === "true",
  logDir: process.env.LOG_DIR,
  logLevel: process.env.LOG_LEVEL,
});

const logger = coreLogger;

export default logger;

export function createChildLogger(defaultMeta: LogMeta): ILogger {
  return logger.child(defaultMeta);
}

// Component Loggers

export const redisLogger = createChildLogger({ component: "redis" });
export const mongoLogger = createChildLogger({ component: "mongo" });
export const socketLogger = createChildLogger({ component: "socket" });
export const emailLogger = createChildLogger({ component: "email" });
export const httpLogger = createChildLogger({ component: "http" });
export const shutdownLogger = createChildLogger({ component: "shutdown" });
