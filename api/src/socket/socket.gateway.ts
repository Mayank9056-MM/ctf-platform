import { Server as HTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { config } from "../config/config";
import logger from "../utils/logger";
import { verifySocketAuth } from "./socket.middleware";

// Types that mirror the frontend types

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

// Room naming helpers

/** Personal room — only this user receives events here */
export const userRoom = (userId: string) => `user:${userId}`;

/** Team room — all team members receive events here */
export const teamRoom = (teamId: string) => `team:${teamId}`;

/** Event room — all participants in a live CTF event */
export const eventRoom = (eventId: string) => `event:${eventId}`;

/** Global room — everyone on the platform (first blood, announcements) */
export const GLOBAL_ROOM = "global";

// Initialise

export async function initSocket(
  httpServer: HTTPServer
): Promise<SocketServer<ClientToServerEvents, ServerToClientEvents>> {
  // Redis clients (one pub, one sub — required by Redis adapter)
  const pubClient = createClient({ url: config.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  pubClient.on("error", (err) => logger.error("[Redis pub]", err));
  subClient.on("error", (err) => logger.error("[Redis sub]", err));

  // Socket.io server
  io = new SocketServer(httpServer, {
    adapter: createAdapter(pubClient, subClient),
    cors: {
      origin: config.FRONTEND_URL,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    // Disconnect clients that don't ping within 60s
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  // Auth middleware
  // Validates the httpOnly refresh cookie or bearer token on every connection.
  io.use(verifySocketAuth);

  // Connection handler
  io.on("connection", (socket) => {
    const userId = (socket.data as { userId?: string }).userId;
    logger.info(`[Socket] ${userId ?? "anonymous"} connected — ${socket.id}`);

    // Always join the global room
    socket.join(GLOBAL_ROOM);

    // Join personal + team rooms when client requests
    socket.on("room:join", ({ userId, teamId }) => {
      socket.join(userRoom(userId));
      if (teamId) socket.join(teamRoom(teamId));
    });

    // Join / leave event rooms for live leaderboard
    socket.on("room:join_event", ({ eventId }) =>
      socket.join(eventRoom(eventId))
    );
    socket.on("room:leave_event", ({ eventId }) =>
      socket.leave(eventRoom(eventId))
    );

    socket.on("disconnect", (reason) => {
      logger.info(`[Socket] ${userId ?? "anonymous"} disconnected — ${reason}`);
    });
  });

  logger.info("[Socket] Server initialised with Redis adapter");
  return io;
}

// Getter (for use in services)

export function getIO(): SocketServer<
  ClientToServerEvents,
  ServerToClientEvents
> {
  if (!io) throw new Error("[Socket] Call initSocket(httpServer) first");
  return io;
}
