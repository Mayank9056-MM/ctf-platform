"use client";

import Link from "next/link";
import { useState } from "react";
import { useLeaderboard } from "@/modules/leaderboard/hooks/useLeaderboard";
import { useUser } from "@/modules/auth/store/auth.store";
import {
  ClipboardCopy,
  Crown,
  ExternalLink,
  Key,
  Loader2,
  LogOut,
  Medal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trophy,
  UserX,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { TeamMemberUser } from "@/modules/team/types/team.types";
import type { LeaderboardEntry } from "@/modules/leaderboard/types/leaderboard.types";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelHeader,
  PanelIcon,
  ScrollArea,
  SkeletonRow,
} from "../ui/widget-shell";
import { useKickMember } from "@/modules/team/hooks/team/useKickMember";
import { useLeaveTeam } from "@/modules/team/hooks/team/useLeaveTeam";
import { useMyTeam } from "@/modules/team/hooks/team/useMyTeam";
import { useGenerateJoinCode } from "@/modules/team/hooks/invite/useGenerateJoinCode";
import { useInviteUser } from "@/modules/team/hooks/invite/useInviteUserTeam";
import { useDashboardStore } from "../../store/dasboard.store";
import { useTeamSearch } from "@/modules/team/hooks/useTeamSearch";
import { useJoinTeamByCode } from "@/modules/team/hooks/invite/useJoinTeamByCode";
import Image from "next/image";

// LeaderboardWidget

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-3.5 w-3.5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-3.5 w-3.5 text-slate-300" />;
  if (rank === 3) return <Medal className="h-3.5 w-3.5 text-amber-600" />;
  return (
    <span className="w-4 text-center font-mono text-[11px] text-slate-600">
      {rank}
    </span>
  );
}

function LBRow({
  entry,
}: {
  entry: LeaderboardEntry & { isCurrentUser?: boolean };
}) {
  return (
    <Link
      href={`/profile/${entry.username}`}
      className={cn(
        "group/lb flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
        "hover:bg-white/[0.04]",
        entry.isCurrentUser && "bg-emerald-950/20 ring-1 ring-emerald-500/10",
      )}
    >
      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      {/* Avatar */}
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]">
        {entry.avatar?.url ? (
          <Image
            src={entry.avatar.url}
            alt={entry.username}
            fill
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-slate-500">
            {entry.username.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "truncate text-sm transition-colors",
              entry.isCurrentUser
                ? "font-semibold text-emerald-300"
                : "text-slate-300 group-hover/lb:text-white",
            )}
          >
            {entry.username}
          </span>
          {entry.isCurrentUser && (
            <span className="shrink-0 font-mono text-[9px] text-emerald-600">
              you
            </span>
          )}
        </div>
        {entry.teamName && (
          <p className="truncate font-mono text-[10px] text-slate-700">
            {entry.teamName}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <span className="font-mono text-sm font-bold tabular-nums text-white">
          {entry.score.toLocaleString()}
        </span>
        <p className="font-mono text-[9px] text-slate-700">
          {entry.solveCount} solves
        </p>
      </div>
    </Link>
  );
}

export function LeaderboardWidget() {
  const { entries, isLoading, isError, isStale, refetch } = useLeaderboard();

  return (
    <Panel className="h-full">
      <PanelHeader
        icon={
          <PanelIcon color="#f59e0b">
            <Trophy className="h-3.5 w-3.5" />
          </PanelIcon>
        }
        title="Leaderboard"
        href="/leaderboard"
        badge={
          isStale ? (
            <span className="font-mono text-[9px] text-slate-600 animate-pulse">
              updating…
            </span>
          ) : undefined
        }
      />

      <ScrollArea className="flex-1 px-2 pb-3">
        {isLoading ? (
          <div className="space-y-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <div className="space-y-0.5">
            {entries.map((e) => (
              <LBRow key={e.entityId} entry={e} />
            ))}
          </div>
        )}
      </ScrollArea>
    </Panel>
  );
}

// TeamWidget

type TeamTab = "mine" | "search" | "join";

const TABS: { id: TeamTab; label: string }[] = [
  { id: "mine", label: "My Team" },
  { id: "search", label: "Find" },
  { id: "join", label: "Join" },
];

function TabBar({
  active,
  onChange,
}: {
  active: TeamTab;
  onChange: (t: TeamTab) => void;
}) {
  return (
    <div className="mx-5 mb-4 flex gap-0.5 rounded-xl bg-white/[0.04] p-0.5">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex-1 rounded-lg py-1.5 font-mono text-[10px] font-medium transition-all duration-150",
            active === t.id
              ? "bg-white/[0.08] text-slate-200 shadow-sm"
              : "text-slate-600 hover:text-slate-400",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function MemberRow({
  member,
  ownerId,
  teamId,
  canManage,
}: {
  member: TeamMemberUser;
  ownerId: string;
  teamId: string;
  canManage: boolean;
}) {
  const { mutate: kick, isPending } = useKickMember(teamId);
  const [confirm, setConfirm] = useState(false);
  const isOwner = member._id === ownerId;

  return (
    <div className="group/member flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-white/[0.03]">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]">
        {member.avatar?.url ? (
          <Image
            src={member.avatar.url}
            alt={member.username}
            fill
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-slate-500">
            {member.username.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/profile/${member.username}`}
            className="truncate text-sm text-slate-300 hover:text-white transition-colors"
          >
            {member.username}
          </Link>
          {isOwner && (
            <span title="Owner">
              <Crown className="h-3 w-3 shrink-0 text-yellow-500" />
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] text-slate-700">
          {member.score.toLocaleString()} pts
        </p>
      </div>

      {canManage && !isOwner && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/member:opacity-100">
          {confirm ? (
            <>
              <button
                onClick={() => {
                  kick(member._id);
                  setConfirm(false);
                }}
                disabled={isPending}
                className="rounded p-1 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="rounded p-1 text-slate-600 hover:text-slate-400 transition-colors"
              >
                <UserX className="h-3 w-3" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="rounded p-1 text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <UserX className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MyTeamView({
  team,
}: {
  team: NonNullable<ReturnType<typeof useMyTeam>["data"]>;
}) {
  const currentUser = useUser();
  const { mutate: leave, isPending: isLeaving } = useLeaveTeam();
  const { mutate: genCode, isPending: isGenCode } = useGenerateJoinCode(
    team._id,
  );
  const { mutate: invite, isPending: isInviting } = useInviteUser(team._id);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState("");

  const ownerId = typeof team.owner === "string" ? team.owner : team.owner._id;
  const isOwner = currentUser?._id === ownerId;

  const copyCode = () => {
    if (team.joinCode) {
      navigator.clipboard.writeText(team.joinCode);
      toast.success("Join code copied!");
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Team header */}
      <div className="mx-4 mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href={`/teams/${team._id}`}
              className="flex items-center gap-1.5 font-semibold text-white hover:text-emerald-300 transition-colors"
            >
              {team.name}
              <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
            </Link>
            <p className="font-mono text-[10px] text-slate-600 mt-0.5">
              {team.members.length}/{team.maxMembers} members ·{" "}
              {team.score.toLocaleString()} pts
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm("Leave this team?")) leave();
            }}
            disabled={isLeaving}
            className="rounded-lg p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            {isLeaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {isOwner && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
              <p className="font-mono text-[11px] text-slate-400">
                {team.joinCode ?? "—"}
              </p>
            </div>
            <button
              onClick={copyCode}
              disabled={!team.joinCode}
              className="rounded-lg p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => genCode()}
              disabled={isGenCode}
              className="rounded-lg p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
            >
              {isGenCode ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <ScrollArea className="flex-1 pb-2">
        <div className="space-y-0.5">
          {team.members.map((m: TeamMemberUser) => (
            <MemberRow
              key={m._id}
              member={m}
              ownerId={ownerId}
              teamId={team._id}
              canManage={isOwner}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Invite */}
      {isOwner && team.members.length < team.maxMembers && (
        <div className="shrink-0 px-4 pt-2 pb-4">
          {showInvite ? (
            <div className="flex gap-2">
              <input
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Username…"
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inviteInput.trim()) {
                    invite(inviteInput.trim(), {
                      onSuccess: () => {
                        setInviteInput("");
                        setShowInvite(false);
                      },
                    });
                  }
                }}
              />
              <button
                onClick={() =>
                  invite(inviteInput.trim(), {
                    onSuccess: () => {
                      setInviteInput("");
                      setShowInvite(false);
                    },
                  })
                }
                disabled={!inviteInput.trim() || isInviting}
                className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-all"
              >
                {isInviting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="rounded-lg border border-white/[0.08] p-2 text-slate-600 hover:text-slate-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInvite(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] py-2 text-xs text-slate-600 hover:border-emerald-500/20 hover:text-emerald-400 transition-all"
            >
              <Plus className="h-3 w-3" /> Invite member
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SearchView() {
  const query = useDashboardStore((s) => s.teamSearchQuery);
  const setQuery = useDashboardStore((s) => s.setTeamSearchQuery);
  const { data, isLoading } = useTeamSearch(
    query.trim().length >= 2 ? { q: query } : undefined,
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-4">
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search public teams…"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {query.trim().length < 2 ? (
          <p className="py-6 text-center font-mono text-[11px] text-slate-700">
            Type 2+ characters
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : !data?.teams.length ? (
          <p className="py-6 text-center text-xs text-slate-700">
            No teams found for &quot;{query}&quot;
          </p>
        ) : (
          <div className="space-y-2">
            {data.teams.map((t) => (
              <div
                key={t._id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {t.name}
                  </p>
                  <p className="font-mono text-[10px] text-slate-600">
                    {t.memberCount ?? t.members?.length ?? 0}/{t.maxMembers} ·{" "}
                    {t.score.toLocaleString()} pts
                    {t.country && ` · ${t.country}`}
                  </p>
                </div>
                <Link
                  href={`/teams/${t._id}`}
                  className="flex items-center gap-1 rounded-lg border border-white/[0.07] px-2.5 py-1.5 font-mono text-[10px] text-slate-500 hover:border-white/[0.12] hover:text-white transition-all"
                >
                  View <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function JoinView() {
  const code = useDashboardStore((s) => s.teamJoinCode);
  const setCode = useDashboardStore((s) => s.setTeamJoinCode);
  const { mutate: join, isPending } = useJoinTeamByCode();

  return (
    <div className="px-4 space-y-4">
      <p className="text-xs text-slate-600 leading-relaxed">
        Enter a join code from your team owner to request membership.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim())
            join(code.trim().toUpperCase(), { onSuccess: () => setCode("") });
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="TEAM-XXXXXX"
            maxLength={11}
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] pl-9 pr-3 py-2.5 font-mono text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || code.length < 4}
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Join"
          )}
        </button>
      </form>
    </div>
  );
}

export function TeamWidget() {
  const { data: team, isLoading } = useMyTeam();
  const [tab, setTab] = useState<TeamTab>("mine");

  return (
    <Panel className="h-full">
      <PanelHeader
        icon={
          <PanelIcon color="#06b6d4">
            <Users className="h-3.5 w-3.5" />
          </PanelIcon>
        }
        title="Team"
        href={team ? `/teams/${team._id}` : undefined}
        hrefLabel="Team page"
      />

      {!isLoading && <TabBar active={tab} onChange={setTab} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 px-4">
            <div className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : tab === "search" ? (
          <SearchView />
        ) : tab === "join" ? (
          <JoinView />
        ) : team ? (
          <MyTeamView team={team} />
        ) : (
          <EmptyState
            icon={<Shield className="h-10 w-10" />}
            title="No team yet"
            description="Join a team to compete together and share first bloods"
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setTab("search")}
                  className="rounded-xl border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 hover:border-white/[0.15] hover:text-white transition-all"
                >
                  Find team
                </button>
                <button
                  onClick={() => setTab("join")}
                  className="rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                >
                  Join by code
                </button>
              </div>
            }
          />
        )}
      </div>
    </Panel>
  );
}
