"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/services/providers/SocketProvider";

export function useEventRoom(eventId: string | undefined) {
  const { socket, isConnected } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected || !eventId) return;

    // Join the event room so the server sends event-scoped events to this client
    socket.emit("room:join_event", { eventId });

    return () => {
      // Leave when navigating away
      socket.emit("room:leave_event", { eventId });
    };
  }, [socket, isConnected, eventId]);
}