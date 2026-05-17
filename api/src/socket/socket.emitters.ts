//src/socket/socket.emitters.ts

import { socketLogger } from "../lib/logger";
import {
  getIO,
  GLOBAL_ROOM,
  userRoom,
  teamRoom,
  eventRoom,
} from "./socket.gateway";

// Safe Emit Wrapper

/**
 * Wraps an emit call so a throw (e.g. Socket.IO not yet initialised during
 * startup, or a connection race at shutdown) doesn't crash the caller.
 *
 * We log at warn rather than error because this is a degraded-state condition,
 * not an operation failure — the event is lost but the caller can continue.
 */
function safeEmit(eventName: string, fn: () => void): void {
  try {
    fn();
  } catch (err) {
    socketLogger.warn("Emit failed — socket may not be initialised", {
      event: eventName,
      err,
    });
  }
}

// Emitters

export const socketEmit = {
  /**
   * First blood — broadcast to every connected client.
   * Call from: submissionService.submitFlag() when isFirstBlood = true
   */
  firstBlood(data: {
    challengeId: string;
    challengeTitle: string;
    userId: string;
    username: string;
    avatar?: string;
    teamId?: string;
    teamName?: string;
    pointsAwarded: number;
  }) {
    safeEmit("submission:first_blood", () =>
      getIO().to(GLOBAL_ROOM).emit("submission:first_blood", data)
    );
  },

  /**
   * Correct solve — personal (only the solver receives this).
   * Call from: submissionService.submitFlag() when isCorrect = true
   */
  correctSolve(
    userId: string,
    data: {
      challengeId: string;
      challengeTitle: string;
      pointsAwarded: number;
      newScore: number;
      rank: number;
    }
  ) {
    safeEmit("submission:correct", () =>
      getIO().to(userRoom(userId)).emit("submission:correct", data)
    );
  },

  /**
   * Leaderboard updated — tells clients to invalidate their TanStack Query cache.
   * Call from: leaderboardService.recompute() after computing a board.
   */
  leaderboardUpdated(scope: string, eventId?: string) {
    safeEmit("leaderboard:updated", () => {
      const io = getIO();
      if (eventId) {
        io.to(eventRoom(eventId)).emit("leaderboard:updated", {
          scope,
          eventId,
        });
      } else {
        io.to(GLOBAL_ROOM).emit("leaderboard:updated", { scope });
      }
    });
  },

  /**
   * New notification — personal or broadcast.
   * Call from: notificationService.create()
   * Pass recipientId = null to broadcast to all connected users.
   */
  newNotification(
    recipientId: string | null,
    data: {
      _id: string;
      type: string;
      title: string;
      body: string;
      actionUrl?: string;
      createdAt: string;
    }
  ) {
    safeEmit("notification:new", () => {
      const io = getIO();
      if (recipientId) {
        io.to(userRoom(recipientId)).emit("notification:new", data);
      } else {
        io.to(GLOBAL_ROOM).emit("notification:new", data);
      }
    });
  },

  /**
   * Event status changed — broadcast.
   * Call from: eventService.transitionTo()
   */
  eventStatusChanged(data: {
    eventId: string;
    slug: string;
    name: string;
    status: string;
  }) {
    safeEmit("event:status_changed", () =>
      getIO().to(GLOBAL_ROOM).emit("event:status_changed", data)
    );
  },

  /**
   * Scoreboard frozen/unfrozen — event room only.
   * Call from: eventService.setScoreboardFrozen()
   */
  scoreboardFrozen(data: {
    eventId: string;
    frozen: boolean;
    frozenAt?: string;
  }) {
    safeEmit("event:scoreboard_frozen", () =>
      getIO().to(eventRoom(data.eventId)).emit("event:scoreboard_frozen", data)
    );
  },

  /**
   * Announcement published — global broadcast.
   * Call from: announcementService.publish()
   */
  announcementPublished(data: {
    _id: string;
    title: string;
    severity: string;
    audience: string;
  }) {
    safeEmit("announcement:published", () =>
      getIO().to(GLOBAL_ROOM).emit("announcement:published", data)
    );
  },

  /**
   * Team member joined.
   * Call from: teamService after joinTeamByCode() or acceptInvite()
   */
  teamMemberJoined(teamId: string, userId: string, username: string) {
    safeEmit("team:member_joined", () =>
      getIO()
        .to(teamRoom(teamId))
        .emit("team:member_joined", { teamId, userId, username })
    );
  },

  /**
   * Team challenge solved.
   * Call from: submissionService after a correct solve when user has a team.
   */
  teamChallengeSolved(data: {
    teamId: string;
    challengeId: string;
    challengeTitle: string;
    solverUsername: string;
    pointsAwarded: number;
  }) {
    safeEmit("team:challenge_solved", () =>
      getIO().to(teamRoom(data.teamId)).emit("team:challenge_solved", data)
    );
  },
};
