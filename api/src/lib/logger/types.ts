// src/utils/logger/types.ts

// Log Levels
// trace  — ultra-verbose: loop internals, raw query params (dev only)
// debug  — flow markers, branch decisions (dev + staging)
// info   — normal operational lifecycle events (all environments)
// warn   — degraded / recoverable state — needs monitoring, not paging
// error  — operation failed, human attention required
// fatal  — process-level failure, shutdown imminent
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

// Structured Metadata

export interface LogMeta {
  // Request tracing
  requestId?: string; // per-request correlation ID (UUID v4)
  traceId?: string; // distributed tracing span ID (OpenTelemetry / Jaeger)
  spanId?: string;
  sessionId?: string;

  // Identity
  userId?: string;
  teamId?: string;
  ip?: string;

  // HTTP
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  contentLength?: number;
  userAgent?: string;
  referer?: string;

  // Infrastructure
  service?: string;
  component?: string; // "socket" | "redis" | "mongo" | "email" …
  signal?: string; // OS signal name
  port?: number | string;
  env?: string;
  hostname?: string;
  pid?: number;

  // DB / cache
  db?: unknown;
  collection?: string;
  query?: unknown; // sanitised query representation only — never raw

  // Error
  err?: unknown; // accepts Error objects; serialized automatically
  reason?: unknown; // unhandledRejection payload
  stack?: string;

  // Shutdown
  timeoutMs?: number;
  timeout_ms?: number; // legacy field kept for compat; prefer timeoutMs

  // Email
  email?: string; // masked at serialization layer

  // Socket.IO
  socketId?: string;
  room?: string;
  namespace?: string;

  // Allow arbitrary extension fields
  [key: string]: unknown;
}

export type LogMethod = (message: string, meta?: LogMeta) => void;

// Logger Interface
export interface ILogger {
  trace: LogMethod;
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  fatal: LogMethod;

  child(defaultMeta: LogMeta): ILogger;
}

// Request Logging
export interface RequestLogData extends LogMeta {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string;
}
