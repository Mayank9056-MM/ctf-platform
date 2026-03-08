import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

class SocketService {
  private io: SocketIOServer | null = null;

  init(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.use((socket: Socket, next) => {
      // Optional auth — allow anonymous for leaderboard/events
      const token = socket.handshake.auth?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as {
            _id: string;
            username: string;
          };
          (socket as Socket & { user?: unknown }).user = decoded;
        } catch {
          // Non-fatal — user just won't be in authenticated rooms
        }
      }
      next();
    });

    this.io.on("connection", (socket: Socket) => {
      // Join user-specific room for personal notifications
      const user = (socket as Socket & { user?: { _id: string } }).user;
      if (user) {
        socket.join(`user:${user._id}`);
      }

      socket.on("join:team", (teamId: string) => {
        socket.join(`team:${teamId}`);
      });

      socket.on("disconnect", () => {
        // cleanup if needed
      });
    });
  }

  emit(event: string, data: unknown): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToTeam(teamId: string, event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
