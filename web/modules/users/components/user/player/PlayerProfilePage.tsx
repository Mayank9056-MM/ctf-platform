"use client";

import { useUser } from "@/modules/auth/store/auth.store";
import { getPublicProfile } from "@/modules/users/api/user.api";
import { useQuery } from "@tanstack/react-query";
import { Ambient } from "./Ambient";
import { ProfileSkeleton } from "./ProfileSkeleton";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  Clock,
  Flag,
  Globe,
  Star,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { timeAgo } from "@/shared/utils/time";
import { StatPill } from "./StatPill";
import { RecentSolves } from "./RecentSolves";
import { ActivityChart } from "./ActivityChart";
import { CategoryBreakdown } from "./CategoryBreakdown";

export default function PlayerProfilePage({ username }: { username: string }) {
  const currentUser = useUser();

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user", "public-profile", username],
    queryFn: () => getPublicProfile(username),
    staleTime: 1000 * 60 * 5,
  });

  // Redirect to own profile page if viewing yourself
  const isSelf = currentUser?.username === username;

  if (isLoading)
    return (
      <div className="relative z-10">
        <Ambient />
        <ProfileSkeleton />
      </div>
    );

  if (isError || !profile)
    return (
      <div className="relative z-10 flex flex-col items-center justify-center py-32 text-center">
        <Ambient />
        <AlertCircle className="mb-4 h-10 w-10 text-red-400/50" />
        <p className="font-mono text-sm font-medium text-slate-500">
          Player not found
        </p>
        <Link
          href="/leaderboard"
          className="mt-4 flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Leaderboard
        </Link>
      </div>
    );

  const stats = profile.stats;
  const roleColour =
    profile.role === "superadmin"
      ? "#f87171"
      : profile.role === "admin"
        ? "#fbbf24"
        : "#34d399";

  return (
    <>
      <Ambient />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Leaderboard
            </Link>
            <span className="font-mono text-slate-800">/</span>
            <span className="font-mono text-xs text-slate-600">
              {profile.username}
            </span>
          </div>

          {/* Hero card */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
              {/* Avatar */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/[0.08] ring-2 ring-white/[0.1] ring-offset-2 ring-offset-[#080c10]">
                {profile.avatar?.url ? (
                  <Image
                    src={profile.avatar.url}
                    alt={profile.username}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-mono text-2xl font-bold text-slate-300">
                      {profile.username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-mono text-xl font-bold text-white">
                    {profile.username}
                  </h1>
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[9px] ring-1"
                    style={{
                      backgroundColor: `${roleColour}15`,
                      color: roleColour,
                      borderColor: `${roleColour}30`,
                    }}
                  >
                    {profile.role}
                  </span>
                  {isSelf && (
                    <Link
                      href="/profile"
                      className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-[9px] text-slate-500 hover:text-slate-300 ring-1 ring-white/[0.07] transition-colors"
                    >
                      Edit →
                    </Link>
                  )}
                </div>

                {profile.fullName && (
                  <p className="text-sm text-slate-500 mb-1">
                    {profile.fullName}
                  </p>
                )}
                {profile.bio && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-700">
                  {profile.country && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {profile.country}
                    </span>
                  )}
                  {profile.team && (
                    <Link
                      href={`/teams/${profile.team._id}`}
                      className="flex items-center gap-1 hover:text-slate-400 transition-colors"
                    >
                      <Users className="h-3 w-3" />
                      {profile.team.name}
                    </Link>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last active{" "}
                    {formatDistanceToNow(new Date(profile.lastActive), {
                      addSuffix: true,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Terminal className="h-3 w-3" />
                    Joined {timeAgo(profile.createdAt)}
                  </span>
                </div>
              </div>

              {/* Score + rank */}
              <div className="shrink-0 text-right">
                <p className="font-mono text-3xl font-bold text-white tabular-nums">
                  {(stats?.totalPoints ?? profile.score).toLocaleString()}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
                  score
                </p>
                {stats?.rank && (
                  <p className="mt-1 font-mono text-sm font-bold text-amber-400">
                    #{stats.rank.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stat pills */}
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <StatPill
              icon={Flag}
              value={stats?.solveCount ?? profile.solvedChallenges?.length ?? 0}
              label="Solved"
              color="#34d399"
            />
            <StatPill
              icon={Zap}
              value={stats?.firstBloods ?? 0}
              label="1st Bloods"
              color="#ef4444"
            />
            <StatPill
              icon={Activity}
              value={`${stats?.streak ?? 0}d`}
              label="Streak"
              color="#f97316"
            />
            <StatPill
              icon={Star}
              value={`${stats?.solveRate ?? 0}%`}
              label="Solve Rate"
              color="#a78bfa"
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
            {/* Left: recent solves */}
            <div
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "150ms", animationFillMode: "both" }}
            >
              <RecentSolves solves={profile.recentSolves ?? []} />
            </div>

            {/* Right: category + activity */}
            <div
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              <ActivityChart data={stats?.recentActivity ?? []} />
              <CategoryBreakdown solves={stats?.solvesByCategory ?? []} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
