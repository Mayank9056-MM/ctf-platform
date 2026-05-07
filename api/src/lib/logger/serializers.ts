// src/utils/logger/serializers.ts

// Sensitive Field Masking
/**
 * Fields whose values must never appear in logs at any log level.
 *
 * Log aggregators (Datadog, Loki, ELK) have long retention and are often
 * shared across teams.  Treat this list as a security boundary, not a hint.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "hashedPassword",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "secret",
  "clientSecret",
  "apiKey",
  "apiSecret",
  "authorization",
  "cookie",
  "cookies",
  "creditCard",
  "cardNumber",
  "cvv",
  "ssn",
  "otp",
  "pin",
  "flag", // CTF flags must never appear in logs
  "resetToken",
  "verifyToken",
  "confirmToken",
  "privateKey",
  "publicKey",
  "smtp_pass",
  "SMTP_PASS",
  "smtp_password",
  "DATABASE_URL", // contains credentials
  "REDIS_URL",
]);

// Stateless regex — create a new one per call to avoid lastIndex bugs
// eslint-disable-next-line no-useless-escape
const emailPattern = () => /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

function maskEmail(value: string): string {
  return value.replace(emailPattern(), (match) => {
    const atIdx = match.indexOf("@");
    const local = match.slice(0, atIdx);
    const domain = match.slice(atIdx + 1);
    // Keep first 2 chars of local part so log readers can distinguish accounts
    return `${local.slice(0, 2)}***@${domain}`;
  });
}

function maskValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key)) return "[REDACTED]";
  if (typeof value === "string" && emailPattern().test(value)) {
    return maskEmail(value);
  }
  return value;
}

// Circular-Safe Deep Cloner

/**
 * Recursively clone and sanitise an arbitrary value for JSON serialization.
 *
 * Handles:
 *   Circular refs   → "[Circular]"
 *   Error objects   → structured plain object (see serializeError)
 *   BigInt          → string
 *   Function        → "[Function: name]"
 *   Symbol          → symbol description string
 *   undefined       → omitted (JSON-safe output)
 */
function safeClone(value: unknown, seen = new WeakSet(), depth = 0): unknown {
  // Hard depth cap — prevents pathological nested objects from blowing the
  // call stack.  10 levels is sufficient for virtually all real payloads.
  if (depth > 10) return "[MaxDepthExceeded]";

  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return `${value.toString()}n`;
  if (typeof value === "function")
    return `[Function: ${value.name || "anonymous"}]`;
  if (typeof value === "symbol") return value.toString();

  if (value instanceof Error) {
    return serializeError(value, seen, depth);
  }

  if (typeof value !== "object") return value;

  if (seen.has(value as object)) return "[Circular]";
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => safeClone(item, seen, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const raw = (value as Record<string, unknown>)[key];
    const masked = maskValue(key, raw);
    result[key] = safeClone(masked, seen, depth + 1);
  }
  return result;
}

// Error Serializer
/**
 * Converts an Error (or anything thrown) into a plain loggable object.
 *
 * Critical detail: Error.message, Error.stack, and any custom properties are
 * NON-ENUMERABLE by default.  JSON.stringify(error) produces "{}".
 * We must explicitly read every property we want to capture.
 *
 * This function is exported so the request middleware can use it directly.
 */
export function serializeError(
  err: unknown,
  seen = new WeakSet(),
  depth = 0
): Record<string, unknown> {
  if (!(err instanceof Error)) {
    // Handles: throw "string", throw 42, throw { code: 500 }
    return { type: typeof err, value: safeClone(err, seen, depth) };
  }

  const serialized: Record<string, unknown> = {
    type: err.constructor?.name ?? "Error",
    message: err.message,
    stack: err.stack,
  };

  // Node.js system errors (ENOENT, ECONNREFUSED …)
  const nodeErr = err as NodeJS.ErrnoException;
  if (nodeErr.code !== undefined) serialized.code = nodeErr.code;
  if (nodeErr.errno !== undefined) serialized.errno = nodeErr.errno;
  if (nodeErr.syscall !== undefined) serialized.syscall = nodeErr.syscall;
  if (nodeErr.path !== undefined) serialized.path = nodeErr.path;

  // Mongoose / MongoDB driver duplicate-key errors
  const mongoErr = err as Error & {
    keyValue?: unknown;
    keyPattern?: unknown;
    code?: unknown;
  };
  if (mongoErr.keyValue !== undefined)
    serialized.keyValue = safeClone(mongoErr.keyValue, seen, depth + 1);
  if (mongoErr.keyPattern !== undefined)
    serialized.keyPattern = safeClone(mongoErr.keyPattern, seen, depth + 1);

  // Axios / fetch errors
  const httpErr = err as Error & {
    response?: { status?: number; data?: unknown };
    config?: { url?: string; method?: string };
  };
  if (httpErr.response !== undefined) {
    serialized.response = {
      status: httpErr.response.status,
      // Never log response body blindly — could contain PII
    };
  }
  if (httpErr.config !== undefined) {
    serialized.request = {
      url: httpErr.config.url,
      method: httpErr.config.method,
    };
  }

  // Copy any enumerable custom properties added by application code
  for (const key of Object.keys(err)) {
    if (!(key in serialized)) {
      const masked = maskValue(
        key,
        (err as unknown as Record<string, unknown>)[key]
      );
      serialized[key] = safeClone(masked, seen, depth + 1);
    }
  }

  return serialized;
}

// Meta Normalizer

/**
 * Sanitise and normalise the metadata bag before it reaches Winston transports.
 *
 * Responsibilities:
 *   1. Serialize Error objects in known carrier fields (err, reason, error)
 *   2. Mask sensitive values recursively across the whole object
 *   3. Remove undefined keys (cleaner JSON output)
 *   4. Guard against circular references anywhere in the object graph
 *   5. Flatten legacy aliases (timeout_ms → timeoutMs)
 */
export function normalizeMeta(
  meta: Record<string, unknown>
): Record<string, unknown> {
  const seen = new WeakSet();
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(meta)) {
    if (meta[key] === undefined) continue;

    // Known error-carrier fields get first-class serialization
    if (
      (key === "err" || key === "reason" || key === "error") &&
      meta[key] instanceof Error
    ) {
      result[key] = serializeError(meta[key] as Error, seen);
      continue;
    }

    if (key === "timeout_ms" && !("timeoutMs" in meta)) {
      result["timeoutMs"] = meta[key];
      continue;
    }

    result[key] = safeClone(maskValue(key, meta[key]), seen);
  }

  return result;
}
