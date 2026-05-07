// src/db/index.ts

import mongoose from "mongoose";
import { DB_NAME, MAX_RETRIES, RETRY_INTERVAL } from "../utils/constants";
import { config } from "../config/config";
import { mongoLogger } from "../lib/logger";

// Types

export interface DBStatus {
  isConnected: boolean;
  readyState: number;
  host: string | undefined;
  name: string | undefined;
}

// Mongoose Debug Integration

function mongooseDebugLogger(
  collectionName: string,
  method: string,
  query: unknown,
  doc: unknown
): void {
  mongoLogger.trace("Mongoose query", {
    collectionName,
    method,
    queryShape:
      query && typeof query === "object"
        ? Object.keys(query as object)
        : undefined,
    hasDoc: doc != null,
  });
}

// DatabaseConnection

class DatabaseConnection {
  private retryCount: number = 0;
  private isConnected: boolean = false;

  constructor() {
    mongoose.set("strictQuery", true);

    mongoose.set("debug", mongooseDebugLogger);

    this.registerMongooseEvents();
  }

  // Event Registration

  private registerMongooseEvents(): void {
    mongoose.connection.on("connected", () => {
      this.isConnected = true;
      mongoLogger.info("MongoDB connected", {
        host: mongoose.connection.host,
        db: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
      });
    });

    mongoose.connection.on("error", (err: Error) => {
      this.isConnected = false;
      mongoLogger.error("MongoDB connection error", {
        err,
        host: mongoose.connection.host,
        readyState: mongoose.connection.readyState,
      });
    });

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
      mongoLogger.warn("MongoDB disconnected", {
        host: mongoose.connection.host,
        readyState: mongoose.connection.readyState,
      });
    });

    mongoose.connection.on("reconnected", () => {
      this.isConnected = true;
      mongoLogger.info("MongoDB reconnected", {
        host: mongoose.connection.host,
        db: mongoose.connection.name,
      });
    });

    // Fires when the connection pool is exhausted — useful for capacity planning
    mongoose.connection.on("fullsetup", () => {
      mongoLogger.debug("MongoDB replica set fully connected");
    });
  }

  // Connect

  async connectDB(): Promise<void> {
    try {
      if (!config.MONGODB_URI) {
        throw new Error("MONGODB_URI is not set in environment variables");
      }

      const connectionOptions: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        dbName: DB_NAME,
      };

      mongoLogger.debug("Connecting to MongoDB", {
        uri: config.MONGODB_URI.replace(/:\/\/[^@]+@/, "://<credentials>@"), // mask credentials in URI
        db: DB_NAME,
        maxPoolSize: connectionOptions.maxPoolSize,
      });

      await mongoose.connect(config.MONGODB_URI, connectionOptions);

      // Reset retry counter on successful connection
      this.retryCount = 0;
    } catch (error) {
      mongoLogger.error("MongoDB connection attempt failed", {
        err: error,
        attempt: this.retryCount + 1,
        maxRetries: MAX_RETRIES,
      });
      await this.handleConnectionError(error);
    }
  }

  // Retry Logic

  private async handleConnectionError(originalError?: unknown): Promise<void> {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;

      const MAX_BACKOFF_MS = 30_000;
      const exponential = Math.min(
        RETRY_INTERVAL * Math.pow(2, this.retryCount - 1),
        MAX_BACKOFF_MS
      );
      const jitter = Math.floor(Math.random() * 1000);
      const delayMs = exponential + jitter;

      mongoLogger.warn("Retrying MongoDB connection", {
        attempt: this.retryCount,
        maxRetries: MAX_RETRIES,
        delayMs,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return this.connectDB();
    }

    // All retries exhausted — this is a fatal startup failure
    mongoLogger.fatal("MongoDB connection failed after all retries — exiting", {
      maxRetries: MAX_RETRIES,
      err: originalError,
    });
    process.exit(1);
  }

  // Manual Reconnect

  async handleDisconnection(): Promise<void> {
    if (!this.isConnected) {
      mongoLogger.info("Attempting manual reconnect to MongoDB");
      await this.connectDB();
    }
  }

  // Status

  getConnectionStatus(): DBStatus {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

// Singleton

const dbConnection = new DatabaseConnection();

export default dbConnection.connectDB.bind(dbConnection);
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
