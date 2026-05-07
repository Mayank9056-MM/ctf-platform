import logger from "../lib/logger";
import {
  getIO,
  GLOBAL_ROOM,
  userRoom,
  teamRoom,
  eventRoom,
} from "./socket.gateway";

// Safe wrapper

function safeEmit(fn: () => void): void {
  try {
    fn();
  } catch (err) {
    logger.warn(
      "[SocketEmit] Emit failed — socket may not be initialised yet:",
      { err }
    );
  }
}

// Emitters
export const socketEmit = {
  // First blood — broadcast to everyone
  // Call from: submissionService.submitFlag() when isFirstBlood = true

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
    safeEmit(() =>
      getIO().to(GLOBAL_ROOM).emit("submission:first_blood", data)
    );
  },

  // Correct solve — personal (only the solver receives this)
  // Call from: submissionService.submitFlag() when isCorrect = true

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
    safeEmit(() =>
      getIO().to(userRoom(userId)).emit("submission:correct", data)
    );
  },

  // Leaderboard updated — broadcast scope change
  // Call from: leaderboardService.recompute() after computing a board
  // Clients use this to invalidate their TanStack Query cache

  leaderboardUpdated(scope: string, eventId?: string) {
    safeEmit(() => {
      const io = getIO();

      if (eventId) {
        // Only tell clients in the event room
        io.to(eventRoom(eventId)).emit("leaderboard:updated", {
          scope,
          eventId,
        });
      } else {
        // Global board — tell everyone
        io.to(GLOBAL_ROOM).emit("leaderboard:updated", { scope });
      }
    });
  },

  // New notification — personal
  // Call from: notificationService.create() after persisting the notification

  newNotification(
    recipientId: string | null, // null = broadcast to all
    data: {
      _id: string;
      type: string;
      title: string;
      body: string;
      actionUrl?: string;
      createdAt: string;
    }
  ) {
    safeEmit(() => {
      const io = getIO();

      if (recipientId) {
        io.to(userRoom(recipientId)).emit("notification:new", data);
      } else {
        // Broadcast notification — send to all connected users
        io.to(GLOBAL_ROOM).emit("notification:new", data);
      }
    });
  },

  // Event status changed — broadcast
  // Call from: eventService.transitionTo()

  eventStatusChanged(data: {
    eventId: string;
    slug: string;
    name: string;
    status: string;
  }) {
    safeEmit(() => getIO().to(GLOBAL_ROOM).emit("event:status_changed", data));
  },

  // Scoreboard freeze — event room only
  // Call from: eventService.setScoreboardFrozen()

  scoreboardFrozen(data: {
    eventId: string;
    frozen: boolean;
    frozenAt?: string;
  }) {
    safeEmit(() =>
      getIO().to(eventRoom(data.eventId)).emit("event:scoreboard_frozen", data)
    );
  },

  // Announcement published — broadcast or targeted
  // Call from: announcementService after publish()

  announcementPublished(data: {
    _id: string;
    title: string;
    severity: string;
    audience: string; // "all" | "teams" | "solo" | "specific"
  }) {
    safeEmit(() =>
      getIO().to(GLOBAL_ROOM).emit("announcement:published", data)
    );
  },

  // Team member joined
  // Call from: teamService after joinTeamByCode() or acceptInvite()

  teamMemberJoined(teamId: string, userId: string, username: string) {
    safeEmit(() =>
      getIO()
        .to(teamRoom(teamId))
        .emit("team:member_joined", { teamId, userId, username })
    );
  },

  // Team challenge solved
  // Call from: submissionService after a correct solve when user has a team

  teamChallengeSolved(data: {
    teamId: string;
    challengeId: string;
    challengeTitle: string;
    solverUsername: string;
    pointsAwarded: number;
  }) {
    safeEmit(() =>
      getIO().to(teamRoom(data.teamId)).emit("team:challenge_solved", data)
    );
  },
};
