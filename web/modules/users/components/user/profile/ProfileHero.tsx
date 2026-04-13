import { UserProfile } from "@/modules/users/types/user.types";
import { AvatarUploader } from "./AvatarUploader";
import { Clock, Globe, Mail, Terminal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VerifyEmailBanner } from "./VerifyEmailBanner";
import { timeAgo } from "@/shared/utils/time";

export function ProfileHero({ user, stats }: { user: UserProfile; stats }) {
  const roleColour =
    user.role === "superadmin"
      ? "#f87171"
      : user.role === "admin"
        ? "#fbbf24"
        : "#34d399";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <AvatarUploader user={user} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-mono text-xl font-bold text-white">
              {user.username}
            </h1>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[9px] font-medium ring-1"
              style={{
                backgroundColor: `${roleColour}15`,
                color: roleColour,
                borderColor: `${roleColour}30`,
              }}
            >
              {user.role}
            </span>
            {!user.isVerified && (
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-mono text-[9px] text-orange-400 ring-1 ring-orange-500/20">
                unverified
              </span>
            )}
          </div>

          {user.fullName && (
            <p className="text-sm text-slate-500 mb-1">{user.fullName}</p>
          )}
          {user.bio && (
            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              {user.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-700">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </span>
            {user.country && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {user.country}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last active{" "}
              {formatDistanceToNow(new Date(user.lastActive), {
                addSuffix: true,
              })}
            </span>
            <span className="flex items-center gap-1">
              <Terminal className="h-3 w-3" />
              Joined {timeAgo(user.createdAt)}
            </span>
          </div>

          {!user.isVerified && <VerifyEmailBanner />}
        </div>

        <div className="text-right shrink-0">
          <p className="font-mono text-3xl font-bold text-white tabular-nums">
            {(stats?.totalPointsEarned ?? user.score).toLocaleString()}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
            total score
          </p>
          {stats?.rank && (
            <p
              className="mt-1 font-mono text-sm font-bold"
              style={{ color: "#f59e0b" }}
            >
              #{stats.rank.toLocaleString()} global
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
