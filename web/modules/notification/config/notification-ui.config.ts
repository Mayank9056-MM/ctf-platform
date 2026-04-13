import {
  AlertCircle,
  Award,
  Bell,
  Check,
  Flag,
  Megaphone,
  Radio,
  Shield,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { NotificationTypeValue } from "../types/notification.types";

export type NotifConfig = {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
};

export const TYPE_CONFIG: Partial<Record<NotificationTypeValue, NotifConfig>> =
  {
    submission_correct: {
      icon: Check,
      color: "#34d399",
      bg: "bg-emerald-500/10",
      label: "Solved",
    },
    submission_first_blood: {
      icon: Zap,
      color: "#ef4444",
      bg: "bg-red-500/10",
      label: "First Blood",
    },
    team_invite_received: {
      icon: Users,
      color: "#60a5fa",
      bg: "bg-blue-500/10",
      label: "Team Invite",
    },
    team_invite_accepted: {
      icon: Users,
      color: "#34d399",
      bg: "bg-emerald-500/10",
      label: "Invite Accepted",
    },
    team_invite_declined: {
      icon: Users,
      color: "#f87171",
      bg: "bg-red-500/10",
      label: "Invite Declined",
    },
    team_member_left: {
      icon: Users,
      color: "#94a3b8",
      bg: "bg-slate-500/10",
      label: "Member Left",
    },
    team_challenge_solved: {
      icon: Trophy,
      color: "#f59e0b",
      bg: "bg-amber-500/10",
      label: "Team Solve",
    },
    account_score_updated: {
      icon: Star,
      color: "#a78bfa",
      bg: "bg-violet-500/10",
      label: "Score Update",
    },
    account_banned: {
      icon: Shield,
      color: "#ef4444",
      bg: "bg-red-500/10",
      label: "Account",
    },
    account_unbanned: {
      icon: Shield,
      color: "#34d399",
      bg: "bg-emerald-500/10",
      label: "Account",
    },
    account_email_verified: {
      icon: Check,
      color: "#34d399",
      bg: "bg-emerald-500/10",
      label: "Verified",
    },
    admin_announcement: {
      icon: Megaphone,
      color: "#fbbf24",
      bg: "bg-amber-500/10",
      label: "Announcement",
    },
    event_starting_soon: {
      icon: Radio,
      color: "#f97316",
      bg: "bg-orange-500/10",
      label: "Event",
    },
    event_ended: {
      icon: Flag,
      color: "#6b7280",
      bg: "bg-slate-500/10",
      label: "Event",
    },
    challenge_published: {
      icon: Award,
      color: "#06b6d4",
      bg: "bg-cyan-500/10",
      label: "Challenge",
    },
    challenge_closed: {
      icon: AlertCircle,
      color: "#94a3b8",
      bg: "bg-slate-500/10",
      label: "Challenge",
    },
    challenge_hint_added: {
      icon: Award,
      color: "#06b6d4",
      bg: "bg-cyan-500/10",
      label: "Hint Added",
    },
  };

export function getConfig(type: string): NotifConfig {
  return (
    (TYPE_CONFIG as Record<string, NotifConfig>)[type] ?? {
      icon: Bell,
      color: "#64748b",
      bg: "bg-slate-500/10",
      label: "System",
    }
  );
}