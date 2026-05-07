// src/utils/logger/middleware/errorLogger.middleware.ts

import { Request, Response, NextFunction } from "express";
import { getContext, httpLogger, serializeError } from "../lib/logger";

// HTTP Error Shape

export interface HttpError extends Error {
  statusCode?: number;
  status?: number;
  expose?: boolean; // if true, message is safe to send to the client
  code?: string;
  isOperational?: boolean; // operational errors are expected; programming bugs are not
}

// Logger Middleware

export function errorLoggerMiddleware(
  err: HttpError,
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode ?? err.status ?? 500;
  const ctx = getContext();

  const meta = {
    ...ctx,
    err: serializeError(err),
    method: req.method,
    path: req.path,
    statusCode,
    isOperational: err.isOperational ?? statusCode < 500,
  };

  // Operational errors (4xx, known 5xx) are warnings; bugs are errors.
  if (statusCode < 500) {
    httpLogger.warn("Request error (operational)", meta);
  } else {
    httpLogger.error("Request error (unhandled)", meta);
  }

  next(err);
}

// Responder Middleware

/**
 * Send a sanitised error response to the client.
 *
 * Rules:
 *   - Never leak stack traces to clients
 *   - Never leak internal error messages unless err.expose === true
 *   - Always return consistent JSON shape
 */
export function errorResponderMiddleware(
  err: HttpError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? err.status ?? 500;
  const ctx = getContext();

  const clientMessage =
    err.expose === true
      ? err.message
      : statusCode < 500
        ? err.message // 4xx: safe to expose
        : "An unexpected error occurred"; // 5xx: never expose internals

  res.status(statusCode).json({
    success: false,
    error: {
      message: clientMessage,
      code: err.code,
      requestId: ctx.requestId,
    },
  });
}
