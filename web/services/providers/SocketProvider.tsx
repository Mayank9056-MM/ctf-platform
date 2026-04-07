"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket, disconnectSocket } from "@/shared/lib/socket";
import type { AppSocket } from "@/shared/lib/socket";
import { useUser } from "@/modules/auth/store/auth.store";

// Context

type SocketContextValue = {
  socket: AppSocket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

// Provider

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const qc = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<AppSocket | null>(null);

  useEffect(() => {
    // Only connect when authenticated
    if (!user?._id) {
      if (socketRef.current?.connected) {
        disconnectSocket();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // Connection events

    socket.on("connect", () => {
      setIsConnected(true);

      // Join personal room and team room (if in a team)
      socket.emit("room:join", {
        userId: user._id,
        teamId: user.teamId ?? undefined,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.log("[Socket] Connection error:", err);
      console.warn("[Socket] Connection error:", err.message);
    });

    // Leaderboard invalidation
    // When the server emits this, we mark the leaderboard stale so
    // the next refetch picks up fresh data. We don't refetch immediately
    // to avoid thundering herd when many users solve simultaneously.

    socket.on("leaderboard:updated", ({ scope, eventId }) => {
      qc.invalidateQueries({ queryKey: ["leaderboard", "board"] });
      qc.invalidateQueries({ queryKey: ["leaderboard", "me"] });
    });

    // First blood toast
    // Global broadcast — everyone on the platform sees this.

    socket.on("submission:first_blood", (data) => {
      toast.custom(
        () => (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-[#1a0505] px-4 py-3 shadow-lg">
            <span className="text-lg">🩸</span>
            <div>
              <p className="text-sm font-semibold text-red-300">First Blood!</p>
              <p className="text-xs text-slate-400">
                <span className="text-white">{data.username}</span> solved{" "}
                <span className="text-white">{data.challengeTitle}</span>
                {data.teamName && (
                  <>
                    {" "}
                    · <span className="text-slate-300">{data.teamName}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        ),
        { duration: 6000 },
      );
    });

    // Personal correct submission
    // Only received in the user's personal room.

    socket.on("submission:correct", (data) => {
      // Invalidate stats so score + rank update immediately
      qc.invalidateQueries({ queryKey: ["submissions", "my", "stats"] });
      qc.invalidateQueries({ queryKey: ["leaderboard", "me"] });
      // Invalidate the challenge detail (solveCount, firstBlood)
      qc.invalidateQueries({ queryKey: ["challenges", "detail"] });
    });

    // Notification received

    socket.on("notification:new", (notif) => {
      // Invalidate summary so the bell badge updates
      qc.invalidateQueries({ queryKey: ["notifications", "summary"] });
      qc.invalidateQueries({ queryKey: ["notifications", "list"] });
    });

    // Event status changed

    socket.on("event:status_changed", ({ eventId, name, status }) => {
      qc.invalidateQueries({ queryKey: ["events", "list"] });
      qc.invalidateQueries({ queryKey: ["events", "detail"] });

      if (status === "active") {
        toast.success(`🚩 "${name}" is now live!`, {
          action: {
            label: "Join",
            onClick: () => (window.location.href = `/events/${eventId}`),
          },
        });
      }
    });

    // Scoreboard frozen

    socket.on("event:scoreboard_frozen", ({ eventId, frozen, frozenAt }) => {
      qc.invalidateQueries({
        queryKey: ["leaderboard", "board", { scope: "event_user", eventId }],
      });
      qc.invalidateQueries({
        queryKey: ["leaderboard", "board", { scope: "event_team", eventId }],
      });

      toast.info(
        frozen
          ? "📸 Scoreboard frozen — scores locked for final standings."
          : "▶ Scoreboard unfrozen — live scoring resumed.",
      );
    });

    // Announcement published

    socket.on("announcement:published", () => {
      qc.invalidateQueries({ queryKey: ["announcements", "feed"] });
    });

    // Team events

    socket.on("team:member_joined", () => {
      qc.invalidateQueries({ queryKey: ["teams", "mine"] });
    });

    socket.on("team:challenge_solved", (data) => {
      toast.success(
        `🏆 ${data.solverUsername} solved "${data.challengeTitle}" for the team! +${data.pointsAwarded} pts`,
        { duration: 5000 },
      );
      qc.invalidateQueries({ queryKey: ["teams", "mine"] });
    });

    // Connect

    if (!socket.connected) {
      socket.connect();
    }

    // Cleanup

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("leaderboard:updated");
      socket.off("submission:first_blood");
      socket.off("submission:correct");
      socket.off("notification:new");
      socket.off("event:status_changed");
      socket.off("event:scoreboard_frozen");
      socket.off("announcement:published");
      socket.off("team:member_joined");
      socket.off("team:challenge_solved");
      // Don't disconnect on re-render — only disconnect on logout (user === null)
    };
  }, [user?._id, user?.teamId, qc]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
