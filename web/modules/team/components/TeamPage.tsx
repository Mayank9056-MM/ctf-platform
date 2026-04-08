"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUser } from "@/modules/auth/store/auth.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  TeamInvite,
  TeamMemberUser,
  TeamSearchResult,
} from "@/modules/team/types/team.types";
import {
  ChevronRight,
  ClipboardCopy,
  Crown,
  ExternalLink,
  Globe,
  Key,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Swords,
  Trophy,
  UserMinus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useKickMember } from "../hooks/team/useKickMember";
import { useMyTeam } from "../hooks/team/useMyTeam";
import { useLeaveTeam } from "../hooks/team/useLeaveTeam";
import { useGenerateJoinCode } from "../hooks/invite/useGenerateJoinCode";
import { useInviteUser } from "../hooks/invite/useInviteUserTeam";
import {
  CreateTeamFormData,
  createTeamSchema,
  InviteUserFormData,
  inviteUserSchema,
  JoinTeamByCodeFormData,
  joinTeamByCodeSchema,
} from "../schemas/team.schema";
import { useRespondToInvite } from "../hooks/invite/useRespondToInvite";
import { useCreateTeam } from "../hooks/team/useCreateTeam";
import { useJoinTeamByCode } from "../hooks/invite/useJoinTeamByCode";
import { useTeamSearch } from "../hooks/useTeamSearch";
import { useTeamSearchState, useTeamStore } from "../store/team.store";

// Ambient background

function Ambient() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="pointer-events-none fixed left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/4 blur-[140px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-emerald-500/3 blur-[100px]"
        aria-hidden
      />
    </>
  );
}

// Page header

function PageHeader() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/25">
          <Swords className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-500/60">
            {"// Alliance System"}
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
            Teams
          </h1>
        </div>
      </div>
      <p className="text-sm text-slate-500 ml-[52px]">
        Form alliances. Share first bloods. Dominate the scoreboard together.
      </p>
    </div>
  );
}

// Stat pill

function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 border border-white/[0.05]">
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span className="font-mono text-sm font-bold text-white tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
        {label}
      </span>
    </div>
  );
}

// Member row

function MemberRow({
  member,
  ownerId,
  teamId,
  canManage,
  currentUserId,
}: {
  member: TeamMemberUser;
  ownerId: string;
  teamId: string;
  canManage: boolean;
  currentUserId: string;
}) {
  const { mutate: kick, isPending } = useKickMember(teamId);
  const [confirm, setConfirm] = useState(false);
  const isOwner = member._id === ownerId;
  const isSelf = member._id === currentUserId;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
        isSelf
          ? "bg-cyan-950/20 ring-1 ring-cyan-500/10"
          : "hover:bg-white/[0.03]",
      )}
    >
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl bg-white/[0.07] ring-1 ring-white/[0.1]">
        {member.avatar?.url ? (
          <Image
            src={member.avatar.url}
            alt={member.username}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] font-bold text-slate-300">
            {member.username.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${member.username}`}
            className="truncate font-mono text-sm font-medium text-slate-200 hover:text-cyan-300 transition-colors"
          >
            {member.username}
          </Link>
          {isOwner && (
            <span title="Team Owner">
              <Crown className="h-3 w-3 shrink-0 text-yellow-400" />
            </span>
          )}
          {isSelf && (
            <span className="font-mono text-[9px] text-cyan-600">you</span>
          )}
        </div>
        <p className="font-mono text-[10px] text-slate-700">
          {member.score.toLocaleString()} pts ·{" "}
          {member.solvedChallenges?.length ?? 0} solved
        </p>
      </div>

      {canManage && !isOwner && !isSelf && (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {confirm ? (
            <>
              <button
                onClick={() => {
                  kick(member._id);
                  setConfirm(false);
                }}
                disabled={isPending}
                className="rounded-lg px-2.5 py-1 font-mono text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Kick"
                )}
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="rounded-lg p-1 text-slate-600 hover:text-slate-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="rounded-lg p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <UserMinus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// My team panel

function MyTeamPanel() {
  const { data: team, isLoading } = useMyTeam();
  const currentUser = useUser();
  const { mutate: leave, isPending: isLeaving } = useLeaveTeam();
  const { mutate: genCode, isPending: isGenCode } = useGenerateJoinCode(
    team?._id ?? "",
  );
  const { mutate: invite, isPending: isInviting } = useInviteUser(
    team?._id ?? "",
  );
  const [showInvite, setShowInvite] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
  });

  if (isLoading)
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-white/[0.04]"
          />
        ))}
      </div>
    );

  if (!team)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
          <Shield className="h-8 w-8 text-slate-700" />
        </div>
        <p className="font-mono text-sm font-medium text-slate-400">
          No team yet
        </p>
        <p className="mt-1 max-w-[220px] text-xs text-slate-700 leading-relaxed">
          Create a team or join one to compete together and share first bloods
        </p>
      </div>
    );

  const ownerId =
    typeof team.owner === "string" ? team.owner : (team.owner as any)._id;
  const isOwner = currentUser?._id === ownerId;

  const copyCode = () => {
    if (!team.joinCode) return;
    navigator.clipboard.writeText(team.joinCode);
    toast.success("Join code copied to clipboard!");
  };

  const onInvite = (data: InviteUserFormData) => {
    invite(data.username, {
      onSuccess: () => {
        reset();
        setShowInvite(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Team hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-950/20 to-transparent p-5">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/teams/${team._id}`}
                className="font-mono text-lg font-bold text-white hover:text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                {team.name}
                <ExternalLink className="h-3.5 w-3.5 opacity-50" />
              </Link>
              {team.country && (
                <span className="font-mono text-[10px] text-slate-600">
                  {team.country}
                </span>
              )}
            </div>
            {team.description && (
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {team.description}
              </p>
            )}
          </div>
          <button
            onClick={() => leave()}
            disabled={isLeaving}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-950/10 px-3 py-1.5 font-mono text-[10px] text-red-400 hover:bg-red-950/30 transition-all disabled:opacity-50"
          >
            {isLeaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <LogOut className="h-3 w-3" />
            )}
            Leave
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatPill
            icon={Trophy}
            value={team.score.toLocaleString()}
            label="Score"
            color="#f59e0b"
          />
          <StatPill
            icon={Users}
            value={`${team.members.length}/${team.maxMembers}`}
            label="Members"
            color="#06b6d4"
          />
          <StatPill
            icon={Zap}
            value={team.solvedChallenges?.length ?? 0}
            label="Solves"
            color="#34d399"
          />
        </div>

        {/* Join code (owner only) */}
        {isOwner && (
          <div className="mt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-1.5">
              Join Code
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                <p className="font-mono text-sm text-slate-300 tracking-wider">
                  {team.joinCode ?? "—"}
                </p>
              </div>
              <button
                onClick={copyCode}
                disabled={!team.joinCode}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all disabled:opacity-30"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => genCode()}
                disabled={isGenCode}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
              >
                {isGenCode ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Members */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 px-1 mb-2">
          Members ({team.members.length})
        </p>
        <div className="space-y-0.5">
          {team.members.map((m: TeamMemberUser) => (
            <MemberRow
              key={m._id}
              member={m}
              ownerId={ownerId}
              teamId={team._id}
              canManage={isOwner}
              currentUserId={currentUser?._id ?? ""}
            />
          ))}
        </div>
      </div>

      {/* Invite */}
      {isOwner && team.members.length < team.maxMembers && (
        <div>
          {showInvite ? (
            <form onSubmit={handleSubmit(onInvite)} className="flex gap-2">
              <div className="flex-1">
                <input
                  {...register("username")}
                  placeholder="Username to invite…"
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 font-mono text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
                {errors.username && (
                  <p className="mt-1 font-mono text-[10px] text-red-400">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isInviting}
                className="rounded-xl bg-cyan-500 px-4 py-2.5 font-mono text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all"
              >
                {isInviting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Invite"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInvite(false);
                  reset();
                }}
                className="rounded-xl border border-white/[0.08] p-2.5 text-slate-600 hover:text-slate-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowInvite(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] py-3 font-mono text-xs text-slate-600 hover:border-cyan-500/25 hover:text-cyan-400 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Invite a member
            </button>
          )}
        </div>
      )}

      {/* Pending invites */}
      {team.invites && team.invites.length > 0 && (
        <InvitesSection teamId={team._id} invites={team.invites} />
      )}
    </div>
  );
}

// Pending invites

function InvitesSection({
  teamId,
  invites,
}: {
  teamId: string;
  invites: TeamInvite[];
}) {
  const { mutate: respond, isPending } = useRespondToInvite(teamId);

  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 px-1 mb-2">
        Pending invites ({invites.length})
      </p>
      <div className="space-y-1.5">
        {invites.map((inv) => {
          const user =
            typeof inv.user === "string"
              ? { username: inv.user, avatar: undefined }
              : inv.user;
          return (
            <div
              key={user._id ?? user.username}
              className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
            >
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-white/[0.07] ring-1 ring-white/[0.08]">
                <span className="flex h-full w-full items-center justify-center font-mono text-[9px] font-bold text-slate-400">
                  {user.username?.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <p className="flex-1 font-mono text-xs text-slate-400">
                {user.username}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => respond({ accept: true })}
                  disabled={isPending}
                  className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond({ accept: false })}
                  disabled={isPending}
                  className="rounded-lg bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-slate-500 hover:text-slate-300 transition-all"
                >
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Create team form

function CreateTeamForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate: create, isPending } = useCreateTeam();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { isPrivate: false },
  });

  const isPrivate = watch("isPrivate");

  const onSubmit = (data: CreateTeamFormData) => {
    create(data, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">
          Team Name *
        </label>
        <input
          {...register("name")}
          placeholder="ByteBandits, CipherCrew…"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 font-mono text-sm text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
        />
        {errors.name && (
          <p className="mt-1 font-mono text-[10px] text-red-400">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">
          Description
        </label>
        <textarea
          {...register("description")}
          rows={2}
          placeholder="What drives your team?"
          className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">
            Country (ISO)
          </label>
          <input
            {...register("country")}
            placeholder="IN, US, GB…"
            maxLength={2}
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 font-mono text-sm uppercase text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">
            Visibility
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 transition-all hover:border-white/[0.12]">
            <div
              className={cn(
                "h-4 w-7 rounded-full transition-colors duration-200",
                isPrivate ? "bg-cyan-500" : "bg-white/[0.12]",
              )}
              style={{ position: "relative" }}
            >
              <div
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200",
                  isPrivate ? "translate-x-3.5" : "translate-x-0.5",
                )}
              />
            </div>
            <input
              type="checkbox"
              {...register("isPrivate")}
              className="sr-only"
            />
            <span className="font-mono text-xs text-slate-400">Private</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3.5 font-mono text-sm font-bold text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_24px_rgba(6,182,212,0.25)] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {isPending ? "Creating…" : "Create Team"}
      </button>
    </form>
  );
}

// Join by code

function JoinByCode() {
  const { mutate: join, isPending } = useJoinTeamByCode();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JoinTeamByCodeFormData>({
    resolver: zodResolver(joinTeamByCodeSchema),
  });

  const onSubmit = (data: JoinTeamByCodeFormData) => {
    join(data.code, { onSuccess: () => reset() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-cyan-400" />
          <p className="font-mono text-sm font-semibold text-slate-200">
            Have a join code?
          </p>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Ask your team owner for their join code to request membership
          instantly.
        </p>
      </div>

      <div>
        <input
          {...register("code")}
          placeholder="XXXX-XXXXXX"
          style={{ textTransform: "uppercase" }}
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 font-mono text-sm text-white placeholder:text-slate-700 tracking-wider outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
        />
        {errors.code && (
          <p className="mt-1 font-mono text-[10px] text-red-400">
            {errors.code.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 py-3.5 font-mono text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Key className="h-4 w-4" />
        )}
        {isPending ? "Joining…" : "Join Team"}
      </button>
    </form>
  );
}

// Team search card

function TeamCard({ team }: { team: TeamSearchResult }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.1] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="truncate font-mono text-sm font-semibold text-slate-200">
              {team.name}
            </p>
            {team.country && (
              <span className="shrink-0 font-mono text-[10px] text-slate-600">
                {team.country}
              </span>
            )}
            {team.isPrivate && (
              <span title="Private">
                <Shield className="h-3 w-3 shrink-0 text-slate-700" />
              </span>
            )}
          </div>
          {team.description && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {team.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-slate-700">
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-500/70" />
              {team.score.toLocaleString()} pts
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.memberCount ?? 0}/{team.maxMembers}
            </span>
            <span className="text-slate-800">
              {formatDistanceToNow(new Date(team.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        <Link
          href={`/teams/${team._id}`}
          className="shrink-0 flex items-center gap-1 rounded-xl border border-white/[0.08] px-3 py-2 font-mono text-[10px] text-slate-500 hover:border-cyan-500/25 hover:text-cyan-400 transition-all"
        >
          View <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// Search panel

function SearchPanel() {

  const query = useTeamStore((s) => s.searchQuery);
  const setQuery = useTeamStore((s) => s.setSearchQuery);

  const page = useTeamStore((s) => s.searchPage);
  const setPage = useTeamStore((s) => s.setSearchPage);

  const country = useTeamStore((s) => s.searchCountry);
  const setCountry = useTeamStore((s) => s.setSearchCountry);

  const sortBy = useTeamStore((s) => s.searchSortBy);
  const setSortBy = useTeamStore((s) => s.setSearchSortBy);

  const sortOrder = useTeamStore((s) => s.searchSortOrder);
  const setSortOrder = useTeamStore((s) => s.setSearchSortOrder);

  const { data, isLoading, isFetching } = useTeamSearch();

  const teams = data?.teams ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams…"
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] pl-10 pr-4 py-3 font-mono text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <input
          value={country ?? ""}
          onChange={(e) =>
            setCountry(e.target.value.toUpperCase().slice(0, 2) || null)
          }
          placeholder="CC"
          maxLength={2}
          className="w-16 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-3 font-mono text-sm uppercase text-white placeholder:text-slate-700 text-center outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
        />
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
          Sort:
        </span>
        {(["score", "memberCount", "createdAt"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setSortBy(opt)}
            className={cn(
              "rounded-lg px-2.5 py-1 font-mono text-[10px] transition-all",
              sortBy === opt
                ? "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20"
                : "text-slate-600 hover:text-slate-400",
            )}
          >
            {opt === "memberCount"
              ? "Members"
              : opt === "createdAt"
                ? "Newest"
                : "Score"}
          </button>
        ))}
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="ml-auto font-mono text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          {sortOrder === "desc" ? "↓ Desc" : "↑ Asc"}
        </button>
      </div>

      {/* Results */}
      {isLoading || isFetching ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>
      ) : query.trim().length < 2 && !country ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Globe className="h-10 w-10 text-slate-800 mb-3" />
          <p className="font-mono text-xs text-slate-700">
            Type 2+ characters to search
          </p>
        </div>
      ) : teams.length === 0 ? (
        <p className="py-8 text-center font-mono text-sm text-slate-700">
          No teams found
        </p>
      ) : (
        <>
          <div className="space-y-2.5">
            {teams.map((t) => (
              <TeamCard key={t._id} team={t} />
            ))}
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!meta.hasPrev}
                className="font-mono text-[10px] text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
              >
                ← Prev
              </button>
              <span className="font-mono text-[10px] text-slate-700">
                {meta.page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!meta.hasNext}
                className="font-mono text-[10px] text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Tabs

type Tab = "my-team" | "create" | "join" | "search";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "my-team", label: "My Team", icon: Shield },
  { id: "search", label: "Discover", icon: Search },
  { id: "join", label: "Join", icon: Key },
  { id: "create", label: "Create", icon: Plus },
];

// Main page

export default function TeamsPage() {
  const { data: myTeam } = useMyTeam();
  const [tab, setTab] = useState<Tab>(myTeam ? "my-team" : "search");

  return (
    <>
      <Ambient />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-8">
          <PageHeader />

          {/* Tab bar */}
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <div className="flex gap-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-xs font-medium transition-all duration-150",
                    tab === id
                      ? "bg-white/[0.07] text-slate-200 shadow-sm"
                      : "text-slate-600 hover:text-slate-400",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Panel */}
          <div className="animate-in fade-in duration-300 rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-6 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]">
            {tab === "my-team" && <MyTeamPanel />}
            {tab === "search" && <SearchPanel />}
            {tab === "join" && <JoinByCode />}
            {tab === "create" && (
              <CreateTeamForm onSuccess={() => setTab("my-team")} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
