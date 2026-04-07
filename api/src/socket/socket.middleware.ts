import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export async function verifySocketAuth(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    // Try Authorization header / auth object first, then cookie
    const token: string | undefined =
      (socket.handshake.auth as { token?: string }).token ??
      socket.handshake.headers.cookie
        ?.split(";")
        .find((c) => c.trim().startsWith("accessToken="))
        ?.split("=")[1];

    if (!token) {
      // Allow unauthenticated connections — they'll only be in the global room
      return next();
    }

    const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as {
      _id: string;
    };

    socket.data.userId = payload._id;
    next();
  } catch {
    // Invalid token — still allow but without userId (global room only)
    next();
  }
}
