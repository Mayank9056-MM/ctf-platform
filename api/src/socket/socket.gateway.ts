// src/socket/socket.gateway.ts

import { Server as HTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { config } from "../config/config";
import { createQueueConnection } from "../lib/redis";
import { verifySocketAuth } from "./socket.middleware";
import { socketLogger } from "../lib/logger";

// Event Type Maps

type ServerToClientEvents = {
  "leaderboard:updated": (data: { scope: string; eventId?: string }) => void;
  "submission:first_blood": (data: {
    challengeId: string;
    challengeTitle: string;
    userId: string;
    username: string;
    avatar?: string;
    teamId?: string;
    teamName?: string;
    pointsAwarded: number;
  }) => void;
  "submission:correct": (data: {
    challengeId: string;
    challengeTitle: string;
    pointsAwarded: number;
    newScore: number;
    rank: number;
  }) => void;
  "notification:new": (data: {
    _id: string;
    type: string;
    title: string;
    body: string;
    actionUrl?: string;
    createdAt: string;
  }) => void;
  "event:status_changed": (data: {
    eventId: string;
    slug: string;
    name: string;
    status: string;
  }) => void;
  "event:scoreboard_frozen": (data: {
    eventId: string;
    frozen: boolean;
    frozenAt?: string;
  }) => void;
  "announcement:published": (data: {
    _id: string;
    title: string;
    severity: string;
    audience: string;
  }) => void;
  "team:member_joined": (data: {
    teamId: string;
    userId: string;
    username: string;
  }) => void;
  "team:challenge_solved": (data: {
    teamId: string;
    challengeId: string;
    challengeTitle: string;
    solverUsername: string;
    pointsAwarded: number;
  }) => void;
};

type ClientToServerEvents = {
  "room:join": (data: { userId: string; teamId?: string }) => void;
  "room:join_event": (data: { eventId: string }) => void;
  "room:leave_event": (data: { eventId: string }) => void;
};

// Singleton

let io: SocketServer<ClientToServerEvents, ServerToClientEvents> | null = null;

// Room Naming Helpers

/** Personal room — only this user receives events here */
export const userRoom = (userId: string) => `user:${userId}`;
/** Team room — all team members receive events here */
export const teamRoom = (teamId: string) => `team:${teamId}`;
/** Event room — all participants in a live CTF event */
export const eventRoom = (eventId: string) => `event:${eventId}`;
/** Global room — everyone on the platform (first blood, announcements) */
export const GLOBAL_ROOM = "global";

// Init

export async function initSocket(
  httpServer: HTTPServer
): Promise<SocketServer<ClientToServerEvents, ServerToClientEvents>> {
  // Redis adapter requires two dedicated connections — one for publishing,
  // one for subscribing. A client in subscribe mode can only run SUB commands,
  // so we cannot reuse the main getRedis() singleton.
  //
  // createQueueConnection() returns an ioredis client configured for
  // long-lived connections (no commandTimeout, maxRetriesPerRequest: null).
  // This is correct for pub/sub which holds a persistent blocking connection.
  const pubClient = createQueueConnection();
  const subClient = createQueueConnection();

  // Register error handlers BEFORE connect so errors during the handshake
  // are caught. The original code registered these after connect() returned,
  // meaning a connection error in the first few ms would be unhandled.
  pubClient.on("error", (err) =>
    socketLogger.error("Redis pub client error", { err })
  );
  subClient.on("error", (err) =>
    socketLogger.error("Redis sub client error", { err })
  );

  // ioredis with lazyConnect: true requires explicit connect()
  await Promise.all([pubClient.connect(), subClient.connect()]);

  io = new SocketServer(httpServer, {
    adapter: createAdapter(pubClient, subClient),
    cors: {
      origin: config.FRONTEND_URL,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  // Auth middleware — validates httpOnly refresh cookie or bearer token
  io.use(verifySocketAuth);

  // Connection Handler

  io.on("connection", (socket) => {
    const userId = (socket.data as { userId?: string }).userId;

    socketLogger.info("Client connected", {
      socketId: socket.id,
      userId: userId ?? "anonymous",
    });

    socket.join(GLOBAL_ROOM);

    socket.on("room:join", ({ userId: uid, teamId }) => {
      socket.join(userRoom(uid));
      if (teamId) socket.join(teamRoom(teamId));

      socketLogger.debug("Client joined rooms", {
        socketId: socket.id,
        userId: uid,
        teamId,
      });
    });

    socket.on("room:join_event", ({ eventId }) => {
      socket.join(eventRoom(eventId));
      socketLogger.debug("Client joined event room", {
        socketId: socket.id,
        userId,
        eventId,
      });
    });

    socket.on("room:leave_event", ({ eventId }) => {
      socket.leave(eventRoom(eventId));
      socketLogger.debug("Client left event room", {
        socketId: socket.id,
        userId,
        eventId,
      });
    });

    socket.on("disconnect", (reason) => {
      socketLogger.info("Client disconnected", {
        socketId: socket.id,
        userId: userId ?? "anonymous",
        reason,
      });
    });
  });

  socketLogger.info("Socket.IO server initialised", {
    transport: ["websocket", "polling"],
    adapter: "redis",
  });

  return io;
}

// Getter

export function getIO(): SocketServer<
  ClientToServerEvents,
  ServerToClientEvents
> {
  if (!io)
    throw new Error(
      "Socket.IO not initialised — call initSocket(httpServer) first"
    );
  return io;
}
