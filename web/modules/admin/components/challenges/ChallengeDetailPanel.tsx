import { useState } from "react";
import { AdminChallenge } from "../../../challenges/types/challenge.types";
import { usePublishChallenge } from "../../../challenges/hooks/admin/usePublishChallenge";
import { useUnpublishChallenge } from "../../../challenges/hooks/admin/useUnpublishChallenge";
import {
  BarChart3,
  Info,
  Loader2,
  Paperclip,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { CatBadge } from "./badges/CatBadge";
import { DiffBadge } from "./badges/DiffBadge";
import { ScoringBadge } from "./badges/ScoringBadge";
import { VisibleBadge } from "./badges/VisibleBadge";
import { fmt } from "@/shared/utils/fmt";
import { timeAgo } from "@/shared/utils/time";
import { AttachmentManager } from "./AttachmentManager";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { HintManager } from "./HintManager";
import { SubmissionsTab } from "./SubmissionsTab";

type DetailTab = "info" | "hints" | "attachments" | "submissions";

export function ChallengeDetailPanel({
  challenge,
  onClose,
  onEdit,
  onDelete,
  isSuperAdmin,
}: {
  challenge: AdminChallenge;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSuperAdmin: boolean;
}) {

  const [tab, setTab] = useState<DetailTab>("info");
  const { mutate: publish, isPending: isPublishing } = usePublishChallenge();
  const { mutate: unpublish, isPending: isUnpublishing } =
    useUnpublishChallenge();

  const tabs: { key: DetailTab; label: string; icon: React.ElementType }[] = [
    { key: "info", label: "Info", icon: Info },
    {
      key: "hints",
      label: `Hints (${challenge.hints.length})`,
      icon: Sparkles,
    },
    {
      key: "attachments",
      label: `Files (${challenge.attachments.length})`,
      icon: Paperclip,
    },
    { key: "submissions", label: "Submissions", icon: BarChart3 },
  ];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-y-0 right-0 z-30 w-[384px] border-l border-slate-800 bg-[#070d1a] flex flex-col"
    >
      {/* Header */}
      <div className="border-b border-slate-800 px-5 py-4 shrink-0 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-mono font-semibold text-white text-sm truncate">
              {challenge.title}
            </p>
            <p className="font-mono text-[10px] text-slate-600 mt-0.5 truncate">
              /{challenge.slug}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <CatBadge category={challenge.category} />
          <DiffBadge difficulty={challenge.difficulty} />
          <ScoringBadge type={challenge.scoringType} />
          <VisibleBadge visible={challenge.isVisible} />
          {challenge.isHosted && (
            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] text-cyan-400 ring-1 ring-cyan-500/20">
              hosted
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Points", value: fmt(challenge.currentPoints) },
            { label: "Solves", value: fmt(challenge.solveCount) },
            { label: "Attempts", value: fmt(challenge.totalAttempts) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-slate-800 bg-slate-900/40 px-2 py-1.5 text-center"
            >
              <p className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {s.value}
              </p>
              <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            Edit
          </button>
          {challenge.isVisible ? (
            <button
              onClick={() => unpublish(challenge._id)}
              disabled={isUnpublishing}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-60"
            >
              {isUnpublishing && <Loader2 className="h-3 w-3 animate-spin" />}
              Unpublish
            </button>
          ) : (
            <button
              onClick={() => publish(challenge._id)}
              disabled={isPublishing}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
            >
              {isPublishing && <Loader2 className="h-3 w-3 animate-spin" />}
              Publish
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={onDelete}
              className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
              tab === t.key
                ? "border-b-2 border-emerald-500 text-emerald-400"
                : "text-slate-600 hover:text-slate-400",
            )}
          >
            <t.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === "info" && (
          <div className="space-y-4">
            {/* Description */}
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase">
                Description
              </p>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {challenge.description}
              </p>
            </div>

            {/* Tags */}
            {challenge.tags.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {challenge.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta rows */}
            <div className="space-y-2 border-t border-slate-800/60 pt-4">
              {[
                { label: "ID", value: challenge._id },
                { label: "Author", value: challenge.author.username },
                { label: "Base pts", value: String(challenge.points) },
                {
                  label: "Current pts",
                  value: String(challenge.currentPoints),
                },
                ...(challenge.scoringType === "dynamic"
                  ? [
                      {
                        label: "Min pts",
                        value: String(challenge.minPoints),
                      },
                    ]
                  : []),
                {
                  label: "Case sensitive",
                  value: challenge.isCaseSensitive ? "Yes" : "No",
                },
                ...(challenge.flagFormat
                  ? [{ label: "Flag format", value: challenge.flagFormat }]
                  : []),
                ...(challenge.publishedAt
                  ? [
                      {
                        label: "Published",
                        value: timeAgo(challenge.publishedAt),
                      },
                    ]
                  : []),
                ...(challenge.closedAt
                  ? [
                      {
                        label: "Closes",
                        value: new Date(challenge.closedAt).toLocaleString(),
                      },
                    ]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-slate-500 font-mono">{row.label}</span>
                  <span className="text-slate-300 font-mono truncate max-w-[160px] text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* First blood */}
            {challenge.firstBlood && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 space-y-1">
                <p className="font-mono text-[10px] text-amber-400 uppercase tracking-wider">
                  🩸 First Blood
                </p>
                <p className="text-xs text-slate-300 font-mono">
                  {challenge.firstBlood.username}
                </p>
                <p className="text-[10px] text-slate-500">
                  {timeAgo(challenge.firstBlood.solvedAt)}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "hints" && <HintManager challenge={challenge} />}
        {tab === "attachments" && <AttachmentManager challenge={challenge} />}
        {tab === "submissions" && (
          <SubmissionsTab challengeId={challenge._id} />
        )}
      </div>
    </motion.div>
  );
}
