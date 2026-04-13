"use client";

import { useAdminDeleteChapter } from "@/modules/story/hooks/admin/chapter/useAdminDeleteChapter";
import { useAdminRemoveCharacter } from "@/modules/story/hooks/admin/useAdminRemoveCharacter";
import { useAdminSetStoryStatus } from "@/modules/story/hooks/admin/useAdminSetStoryStatus";
import { useAdminStoryDetail } from "@/modules/story/hooks/admin/useAdminStoryDetail";
import { useState } from "react";
import { Skeleton } from "./Skeleton";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Terminal,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { STATUS_PILL } from "@/modules/story/config/admin-editor-ui.config";
import { AnimatePresence } from "motion/react";
import { AddChapterForm } from "./AddChapterForm";
import { ChapterPanel } from "./ChapterPanel";
import { AddCharacterForm } from "./AddCharacterForm";
import { CharacterCard } from "./CharacterCard";
import { timeAgo } from "@/shared/utils/time";
import { motion } from "motion/react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

interface Props {
  storyId: string;
}

export default function StoryEditorPage({ storyId }: Props) {
  const {
    data: story,
    isLoading,
    refetch,
    isFetching,
  } = useAdminStoryDetail(storyId);
  const { mutate: setStatus, isPending: isSettingStatus } =
    useAdminSetStoryStatus(storyId);
  const { mutate: removeCharacter, isPending: isRemovingChar } =
    useAdminRemoveCharacter(storyId);
  const { mutate: deleteChapter, isPending: isDeletingChapter } =
    useAdminDeleteChapter(storyId);

  const [addingChapter, setAddingChapter] = useState(false);
  const [addingCharacter, setAddingCharacter] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "chapters" | "characters" | "settings"
  >("chapters");
  const [deleteChapterTarget, setDeleteChapterTarget] = useState<string | null>(
    null,
  );
  const [removeCharTarget, setRemoveCharTarget] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-slate-400">Story not found.</p>
        <Link
          href="/admin/stories"
          className="text-emerald-400 hover:text-emerald-300 font-mono text-sm"
        >
          ← Back to stories
        </Link>
      </div>
    );
  }

  const chaptersSorted = [...(story.chapters ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const accent = story.accentColor ?? "#10b981";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Cinematic header ── */}
      <div className="relative overflow-hidden border-b border-slate-800/60 shrink-0">
        {/* Accent gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, ${accent}80, ${accent}30, transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-0 right-0 h-40 w-80 rounded-full blur-3xl opacity-30"
          style={{ background: accent }}
        />

        <div className="relative px-6 py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono mb-3">
            <Link
              href="/admin/stories"
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Stories
            </Link>
            <span>/</span>
            <span className="text-slate-400">{story.title}</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {story.coverImageUrl ? (
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-700">
                  <Image
                    src={story.coverImageUrl}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ring-slate-700"
                  style={{ background: `${accent}18` }}
                >
                  <BookOpen className="h-6 w-6" style={{ color: accent }} />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {story.title}
                </h1>
                {story.tagline && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {story.tagline}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] ring-1",
                      STATUS_PILL[story.status].bg,
                      STATUS_PILL[story.status].color,
                    )}
                  >
                    {STATUS_PILL[story.status].label}
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {chaptersSorted.length} chapters
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {story.characters?.length ?? 0} characters
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {story.completionCount} completions
                  </span>
                  {story.estimatedMinutes && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                      <Clock className="h-3 w-3" />
                      {story.estimatedMinutes}min
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400/80">
                    <Trophy className="h-3 w-3" />
                    {story.completionXpBonus} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Status actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-mono text-slate-400 hover:border-slate-500 hover:text-white transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                />
              </button>
              {story.status !== "published" && (
                <button
                  onClick={() => setStatus({ status: "published" })}
                  disabled={isSettingStatus}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
                >
                  {isSettingStatus ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  Publish
                </button>
              )}
              {story.status === "published" && (
                <button
                  onClick={() => setStatus({ status: "draft" })}
                  disabled={isSettingStatus}
                  className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-mono text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-60"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Unpublish
                </button>
              )}
              {story.status !== "archived" && (
                <button
                  onClick={() => setStatus({ status: "archived" })}
                  disabled={isSettingStatus}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 px-3.5 py-1.5 text-xs font-mono text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative flex border-t border-slate-800/60 px-6 gap-1">
          {(
            [
              { key: "chapters", label: "Chapters", Icon: Layers },
              { key: "characters", label: "Characters", Icon: Users },
              { key: "settings", label: "Settings", Icon: Terminal },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 font-mono text-xs transition-all border-b-2",
                activeTab === key
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-300",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* ── Chapters tab ── */}
        {activeTab === "chapters" && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
                Chapter Timeline ({chaptersSorted.length})
              </p>
              <button
                onClick={() => setAddingChapter((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[11px] transition-all",
                  addingChapter
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                )}
              >
                <Plus className="h-3 w-3" />
                Add Chapter
              </button>
            </div>

            <AnimatePresence>
              {addingChapter && (
                <AddChapterForm
                  storyId={storyId}
                  currentChapterCount={chaptersSorted.length}
                  onDone={() => setAddingChapter(false)}
                />
              )}
            </AnimatePresence>

            {chaptersSorted.length === 0 && !addingChapter && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-dashed border-slate-800">
                <BookOpen className="h-10 w-10 text-slate-700" />
                <div className="text-center space-y-1">
                  <p className="font-mono font-semibold text-slate-400">
                    No chapters yet
                  </p>
                  <p className="text-sm text-slate-600">
                    Add the first chapter to start building the story.
                  </p>
                </div>
                <button
                  onClick={() => setAddingChapter(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Chapter
                </button>
              </div>
            )}

            <div className="space-y-3">
              {chaptersSorted.map((chapter, i) => (
                <motion.div
                  key={chapter._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ChapterPanel
                    chapter={chapter}
                    storyId={storyId}
                    onDelete={() => setDeleteChapterTarget(chapter._id)}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ── Characters tab ── */}
        {activeTab === "characters" && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
                Characters ({story.characters?.length ?? 0})
              </p>
              <button
                onClick={() => setAddingCharacter((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[11px] transition-all",
                  addingCharacter
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                    : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                )}
              >
                <Plus className="h-3 w-3" />
                Add Character
              </button>
            </div>

            <AnimatePresence>
              {addingCharacter && (
                <AddCharacterForm
                  storyId={storyId}
                  onDone={() => setAddingCharacter(false)}
                />
              )}
            </AnimatePresence>

            {(!story.characters || story.characters.length === 0) &&
              !addingCharacter && (
                <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-dashed border-slate-800">
                  <Users className="h-10 w-10 text-slate-700" />
                  <div className="text-center space-y-1">
                    <p className="font-mono font-semibold text-slate-400">
                      No characters yet
                    </p>
                    <p className="text-sm text-slate-600">
                      Characters can be referenced in node narratives.
                    </p>
                  </div>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(story.characters ?? []).map((char, i) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <CharacterCard
                    character={char}
                    storyId={storyId}
                    onRemove={() => setRemoveCharTarget(char.id)}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ── Settings tab ── */}
        {activeTab === "settings" && (
          <div className="max-w-lg space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <p className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
                Story Details
              </p>
              {[
                { label: "ID", value: story._id },
                { label: "Slug", value: story.slug },
                { label: "Author", value: story.author?.username },
                { label: "Status", value: story.status },
                { label: "Difficulty", value: story.difficulty },
                { label: "Created", value: timeAgo(story.createdAt) },
                ...(story.publishedAt
                  ? [{ label: "Published", value: timeAgo(story.publishedAt) }]
                  : []),
                { label: "Completions", value: String(story.completionCount) },
                { label: "XP Bonus", value: `${story.completionXpBonus} XP` },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between text-xs py-1 border-b border-slate-800/40 last:border-0"
                >
                  <span className="text-slate-500 font-mono">{row.label}</span>
                  <span className="text-slate-300 font-mono truncate max-w-[200px] text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {story.tags && story.tags.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
                <p className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {story.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 font-mono text-[11px] text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {story.description && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
                <p className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
                  Description
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {story.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm delete chapter */}
      <ConfirmModal
        open={!!deleteChapterTarget}
        onClose={() => setDeleteChapterTarget(null)}
        onConfirm={() =>
          deleteChapterTarget &&
          deleteChapter(deleteChapterTarget, {
            onSuccess: () => setDeleteChapterTarget(null),
          })
        }
        title="Delete chapter?"
        description="This removes the chapter and all its nodes. Player progress through this chapter will be lost."
        confirmLabel="Delete Chapter"
        variant="danger"
        isPending={isDeletingChapter}
      />

      {/* Confirm remove character */}
      <ConfirmModal
        open={!!removeCharTarget}
        onClose={() => setRemoveCharTarget(null)}
        onConfirm={() =>
          removeCharTarget &&
          removeCharacter(removeCharTarget, {
            onSuccess: () => setRemoveCharTarget(null),
          })
        }
        title="Remove character?"
        description="This removes the character from the story. Nodes referencing this character ID will still reference the ID but won't resolve."
        confirmLabel="Remove"
        variant="warning"
        isPending={isRemovingChar}
      />
    </div>
  );
}
