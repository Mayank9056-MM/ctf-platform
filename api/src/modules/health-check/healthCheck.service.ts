//src/features/healthCheck/healthCheck.service.ts

import os from "os";
import mongoose from "mongoose";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";
import {
  CheckResult,
  HealthResponse,
  HealthResponseSchema,
  OverallStatus,
  ServiceStatus,
  SystemMetrics,
} from "./healthCheck.types";
import { getRedis } from "../../lib/redis";
import { config } from "../../config/config";
import { getIO } from "../../socket/socket.gateway";
import { createChildLogger } from "../../lib/logger";

const log = createChildLogger({ component: "health" });

// Constants

/** Maximum ms we allow any single downstream check to take */
const CHECK_TIMEOUT_MS = 5_000;

// Valid Service Names

export const VALID_SERVICES = [
  "mongodb",
  "redisCache",
  "storage",
  "email",
  "socket",
] as const;

export type ValidService = (typeof VALID_SERVICES)[number];

// HealthService

class HealthService {
  // Private Utilities

  /**
   * Wraps a check in a hard timeout so a hung downstream (e.g. SMTP) can
   * never block the entire health endpoint. Always resolves — never rejects.
   */
  private withTimeout(
    fn: () => Promise<CheckResult>,
    label: string
  ): Promise<CheckResult> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          status: ServiceStatus.UNHEALTHY,
          latencyMs: CHECK_TIMEOUT_MS,
          message: `${label} check timed out after ${CHECK_TIMEOUT_MS}ms`,
        });
      }, CHECK_TIMEOUT_MS);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err: unknown) => {
          clearTimeout(timer);
          resolve({
            status: ServiceStatus.UNHEALTHY,
            latencyMs: CHECK_TIMEOUT_MS,
            message: `${label} check threw: ${
              err instanceof Error ? err.message : String(err)
            }`,
          });
        });
    });
  }

  private now(): number {
    return performance.now();
  }

  private elapsed(start: number): number {
    return Math.round(performance.now() - start);
  }

  private toServiceCheck(result: CheckResult) {
    return {
      status: result.status,
      latencyMs: result.latencyMs,
      message: result.message,
      metadata: result.metadata,
      checkedAt: new Date().toISOString(),
    };
  }

  private deriveOverallStatus(statuses: ServiceStatus[]): OverallStatus {
    if (statuses.some((s) => s === ServiceStatus.UNHEALTHY))
      return OverallStatus.UNHEALTHY;
    if (statuses.some((s) => s === ServiceStatus.DEGRADED))
      return OverallStatus.DEGRADED;
    return OverallStatus.HEALTHY;
  }

  // Individual Checkers

  /**
   * MongoDB — cheap readyState check first, then a live admin ping.
   * readyState: 0=disconnected 1=connected 2=connecting 3=disconnecting
   */
  private async checkMongoDB(): Promise<CheckResult> {
    const start = this.now();
    const readyState = mongoose.connection.readyState;

    const stateLabel: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
      99: "uninitialized",
    };

    if (readyState !== 1) {
      return {
        status:
          readyState === 2 ? ServiceStatus.DEGRADED : ServiceStatus.UNHEALTHY,
        latencyMs: this.elapsed(start),
        message: `MongoDB is ${stateLabel[readyState] ?? "unknown"} (readyState=${readyState})`,
        metadata: { readyState },
      };
    }

    try {
      await mongoose.connection.db!.admin().ping();
      const latencyMs = this.elapsed(start);
      return {
        status:
          latencyMs > 1_000 ? ServiceStatus.DEGRADED : ServiceStatus.HEALTHY,
        latencyMs,
        message:
          latencyMs > 1_000
            ? "MongoDB ping slow"
            : "MongoDB connected and responsive",
        metadata: {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          readyState,
        },
      };
    } catch (err) {
      return {
        status: ServiceStatus.UNHEALTHY,
        latencyMs: this.elapsed(start),
        message: `MongoDB ping failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
        metadata: { readyState },
      };
    }
  }

  private async checkRedisCache(): Promise<CheckResult> {
    const start = this.now();
    try {
      const redis = getRedis(); // synchronous — returns the ioredis singleton
      const pong = await redis.ping();
      const latencyMs = this.elapsed(start);

      if (pong !== "PONG") {
        return {
          status: ServiceStatus.DEGRADED,
          latencyMs,
          message: `Unexpected PING response: ${pong}`,
        };
      }

      const info = await redis.info("server");
      const versionMatch = info.match(/redis_version:(.+)/);
      const version = versionMatch ? versionMatch[1].trim() : "unknown";

      return {
        status:
          latencyMs > 500 ? ServiceStatus.DEGRADED : ServiceStatus.HEALTHY,
        latencyMs,
        message: latencyMs > 500 ? "Redis responding slowly" : "Redis healthy",
        metadata: { version },
      };
    } catch (err) {
      return {
        status: ServiceStatus.UNHEALTHY,
        latencyMs: this.elapsed(start),
        message: `Redis error: ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }
  }

  private async checkStorage(): Promise<CheckResult> {
    const start = this.now();
    try {
      const s3 = new S3Client({
        region: config.AWS_REGION,
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
        ...(config.AWS_S3_ENDPOINT ? { endpoint: config.AWS_S3_ENDPOINT } : {}),
        requestHandler: {
          requestTimeout: 4_000,
          connectionTimeout: 2_000,
        } as never,
      });

      await s3.send(
        new HeadBucketCommand({ Bucket: config.AWS_S3_BUCKET_NAME })
      );
      const latencyMs = this.elapsed(start);

      return {
        status:
          latencyMs > 2_000 ? ServiceStatus.DEGRADED : ServiceStatus.HEALTHY,
        latencyMs,
        message:
          latencyMs > 2_000
            ? "Storage bucket reachable but slow"
            : "Storage bucket healthy",
        metadata: {
          bucket: config.AWS_S3_BUCKET_NAME,
          region: config.AWS_REGION,
        },
      };
    } catch (err) {
      const latencyMs = this.elapsed(start);
      const message = err instanceof Error ? err.message : String(err);
      const is403 = message.includes("403") || message.includes("Forbidden");

      return {
        status: is403 ? ServiceStatus.DEGRADED : ServiceStatus.UNHEALTHY,
        latencyMs,
        message: is403
          ? "Storage: bucket accessible but HeadBucket denied (403) — check IAM permissions"
          : `Storage error: ${message}`,
        metadata: {
          bucket: config.AWS_S3_BUCKET_NAME,
          region: config.AWS_REGION,
        },
      };
    }
  }

  private async checkEmail(): Promise<CheckResult> {
    const start = this.now();

    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
      return {
        status: ServiceStatus.DEGRADED,
        latencyMs: 0,
        message: "Email service not configured — SMTP credentials missing",
        metadata: { configured: false },
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT ?? 587,
        secure: false,
        auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
        connectionTimeout: 4_000,
        greetingTimeout: 4_000,
        socketTimeout: 4_000,
      });

      await transporter.verify();
      transporter.close();
      const latencyMs = this.elapsed(start);

      return {
        status:
          latencyMs > 3_000 ? ServiceStatus.DEGRADED : ServiceStatus.HEALTHY,
        latencyMs,
        message:
          latencyMs > 3_000
            ? "SMTP reachable but slow"
            : "SMTP server verified and healthy",
        metadata: {
          host: config.SMTP_HOST,
          port: config.SMTP_PORT,
          // SMTP_USER omitted — even admin health endpoints shouldn't
          // expose credentials in API responses
        },
      };
    } catch (err) {
      return {
        status: ServiceStatus.UNHEALTHY,
        latencyMs: this.elapsed(start),
        message: `SMTP verify failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
        metadata: { host: config.SMTP_HOST },
      };
    }
  }

  private async checkSocket(): Promise<CheckResult> {
    const start = this.now();
    try {
      const io = getIO();
      const sockets = await io.fetchSockets();
      const latencyMs = this.elapsed(start);

      return {
        status: ServiceStatus.HEALTHY,
        latencyMs,
        message: "Socket.IO server healthy",
        metadata: {
          connectedClients: sockets.length,
          rooms: io.sockets.adapter.rooms.size,
        },
      };
    } catch (err) {
      return {
        status: ServiceStatus.UNHEALTHY,
        latencyMs: this.elapsed(start),
        message: `Socket.IO not initialised: ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }
  }

  // System Metrics

  private collectSystemMetrics(): SystemMetrics {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const load = os.loadavg();
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

    return {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      memory: {
        totalMb: mb(totalMem),
        usedMb: mb(usedMem),
        freeMb: mb(freeMem),
        usagePercent: Math.round((usedMem / totalMem) * 100),
        heapUsedMb: mb(mem.heapUsed),
        heapTotalMb: mb(mem.heapTotal),
        heapUsagePercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
        externalMb: mb(mem.external),
        rssM: mb(mem.rss),
      },
      cpu: {
        loadAvg1m: load[0],
        loadAvg5m: load[1],
        loadAvg15m: load[2],
        cores: os.cpus().length,
      },
      pid: process.pid,
    };
  }

  // Public Methods

  /**
   * Runs all service checks in parallel (each guarded by a 5s timeout) and
   * returns a fully populated HealthResponse.
   * Called by GET /health.
   */
  async runChecks(): Promise<HealthResponse> {
    const globalStart = this.now();

    const [mongodb, redisCache, storage, email, socket] = await Promise.all([
      this.withTimeout(() => this.checkMongoDB(), "MongoDB"),
      this.withTimeout(() => this.checkRedisCache(), "Redis"),
      this.withTimeout(() => this.checkStorage(), "Storage"),
      this.withTimeout(() => this.checkEmail(), "Email"),
      this.withTimeout(() => this.checkSocket(), "Socket"),
    ]);

    const totalDurationMs = this.elapsed(globalStart);

    const overallStatus = this.deriveOverallStatus([
      mongodb.status,
      redisCache.status,
      storage.status,
      email.status,
      socket.status,
    ]);

    const response: HealthResponse = {
      status: overallStatus,
      version: process.env.npm_package_version ?? "unknown",
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
      totalDurationMs,
      services: {
        mongodb: this.toServiceCheck(mongodb),
        redisCache: this.toServiceCheck(redisCache),
        storage: this.toServiceCheck(storage),
        email: this.toServiceCheck(email),
        socket: this.toServiceCheck(socket),
      },
      system: this.collectSystemMetrics(),
    };

    // Dev-time shape guard — safeParse so a schema mismatch never throws
    const parsed = HealthResponseSchema.safeParse(response);
    if (!parsed.success) {
      log.error("Health response schema validation failed", {
        err: parsed.error.format(),
      });
    }

    return response;
  }

  /**
   * Runs only the check for a single named service.
   * Called by GET /health/services/:service.
   */
  async checkSingleService(service: ValidService) {
    const checkerMap: Record<ValidService, () => Promise<CheckResult>> = {
      mongodb: () => this.checkMongoDB(),
      redisCache: () => this.checkRedisCache(),
      storage: () => this.checkStorage(),
      email: () => this.checkEmail(),
      socket: () => this.checkSocket(),
    };

    const raw = await this.withTimeout(checkerMap[service], service);

    return {
      service,
      ...this.toServiceCheck(raw),
    };
  }
}

// Singleton

export const healthService = new HealthService();
