import {
  DIFF_CONFIG,
  STATUS_CONFIG,
} from "@/modules/story/config/admin-list-ui.config";
import { StoryStatus, StorySummary } from "@/modules/story/types/story.types";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StatusBadge } from "./StatusBadge";
import { DiffBadge } from "./DiffBadge";
import { Archive, ChevronRight, Clock, Eye, EyeOff, Layers, MoreHorizontal, Trophy, Users, X } from "lucide-react";
import { fmtMins } from "@/shared/utils/fmtMins";
import { timeAgo } from "@/shared/utils/time";
import Link from "next/link";

export function StoryCard({
  story,
  onDelete,
  onSetStatus,
}: {
  story: StorySummary;
  onDelete: () => void;
  onSetStatus: (status: StoryStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const diff = DIFF_CONFIG[story.difficulty];
  const status = STATUS_CONFIG[story.status];
  const accent = story.accentColor ?? "#10b981";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all duration-300"
    >
      {/* Accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, ${accent}60, ${accent}20, transparent)`,
        }}
      />

      {/* Cover image or gradient placeholder */}
      <div className="relative h-32 overflow-hidden">
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${accent}18 0%, transparent 60%), #0a0f1a`,
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Top-right badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <StatusBadge status={story.status} />
        </div>

        {/* Difficulty bottom-left */}
        <div className="absolute bottom-3 left-3">
          <DiffBadge difficulty={story.difficulty} />
        </div>

        {/* Actions top-left */}
        <div
          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/60 bg-black/40 text-slate-400 hover:bg-black/60 hover:text-white backdrop-blur-sm transition-colors"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute left-0 z-20 mt-1 w-44 rounded-xl border border-slate-800 bg-[#0d1117] py-1.5 shadow-2xl"
                  >
                    {story.status !== "published" && (
                      <button
                        onClick={() => {
                          onSetStatus("published");
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-emerald-400 hover:bg-slate-800/60 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Publish
                      </button>
                    )}
                    {story.status === "published" && (
                      <button
                        onClick={() => {
                          onSetStatus("draft");
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-amber-400 hover:bg-slate-800/60 transition-colors"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Unpublish
                      </button>
                    )}
                    {story.status !== "archived" && (
                      <button
                        onClick={() => {
                          onSetStatus("archived");
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/60 transition-colors"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </button>
                    )}
                    <div className="my-1 border-t border-slate-800" />
                    <button
                      onClick={() => {
                        onDelete();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-slate-800/60 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-white leading-tight line-clamp-1 group-hover:text-emerald-300 transition-colors">
            {story.title}
          </h3>
          {story.tagline && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
              {story.tagline}
            </p>
          )}
        </div>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {story.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-slate-700/60 bg-slate-800/60 px-1.5 py-0.5 font-mono text-[9px] text-slate-500"
              >
                #{tag}
              </span>
            ))}
            {story.tags.length > 3 && (
              <span className="font-mono text-[9px] text-slate-600">
                +{story.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-3">
            {story.estimatedMinutes && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="h-3 w-3" />
                <span className="font-mono">
                  {fmtMins(story.estimatedMinutes)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Trophy className="h-3 w-3" />
              <span className="font-mono">{story.completionXpBonus} XP</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Users className="h-3 w-3" />
              <span className="font-mono">{story.completionCount}</span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-slate-600">
            {timeAgo(story.createdAt)}
          </span>
        </div>

        {/* Edit button */}
        <Link
          href={`/admin/stories/${story._id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 py-2 text-xs font-mono font-semibold text-slate-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-400 transition-all"
        >
          <Layers className="h-3.5 w-3.5" />
          Open Editor
          <ChevronRight className="h-3 w-3 opacity-50" />
        </Link>
      </div>
    </motion.div>
  );
}
