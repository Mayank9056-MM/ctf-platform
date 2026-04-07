import { io, Socket } from "socket.io-client";

// Event types

export type ServerToClientEvents = {
  // Leaderboard
  "leaderboard:updated": (data: {
    scope: "global_user" | "global_team" | "event_user" | "event_team";
    eventId?: string;
  }) => void;

  // Submissions / first blood
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

  // Notifications
  "notification:new": (data: {
    _id: string;
    type: string;
    title: string;
    body: string;
    actionUrl?: string;
    createdAt: string;
  }) => void;

  // Events
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

  // Announcements
  "announcement:published": (data: {
    _id: string;
    title: string;
    severity: string;
    audience: string;
  }) => void;

  // Team
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

  // Connection
  connect_error: (err: Error) => void;
};

// Client → Server events
export type ClientToServerEvents = {
  /** Join rooms for a user and optionally their team */
  "room:join": (data: { userId: string; teamId?: string }) => void;

  /** Join an event room for live leaderboard */
  "room:join_event": (data: { eventId: string }) => void;

  /** Leave an event room */
  "room:leave_event": (data: { eventId: string }) => void;
};

// Typed socket

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Singleton

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        "",
      {
        // Don't connect immediately — connect once the user is authenticated
        autoConnect: false,

        // httpOnly cookie is sent automatically with same-origin requests
        withCredentials: true,

        transports: ["websocket", "polling"],

        // Reconnection settings
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10_000,
      },
    );
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}
