"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

// Hooks & stores
import { useAdminStoryDetail } from "@/modules/story/hooks/admin/useAdminStoryDetail";
import { useAdminSetStoryStatus } from "@/modules/story/hooks/admin/useAdminSetStoryStatus";
import { useAdminCreateChapter } from "@/modules/story/hooks/admin/chapter/useAdminCreateChapter";
import { useAdminDeleteChapter } from "@/modules/story/hooks/admin/chapter/useAdminDeleteChapter";
import { useAdminAddCharacter } from "@/modules/story/hooks/admin/useAdminAddCharacter";
import { useAdminRemoveCharacter } from "@/modules/story/hooks/admin/useAdminRemoveCharacter";
import { useGraphStore } from "@/modules/story/store/graph.store";

// Schemas
import {
  createChapterSchema,
  type CreateChapterFormData,
  addCharacterSchema,
  type AddCharacterFormData,
} from "@/modules/story/schemas/story.schema";

import type {
  Story,
  StoryChapter,
  StoryCharacter,
  StoryStatus,
  StoryDifficulty,
} from "@/modules/story/types/story.types";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  Flag,
  GitBranch,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  Shield,
  Skull,
  Swords,
  Target,
  Terminal,
  Trash2,
  Tv,
  Upload,
  User,
  Users,
  X,
  Zap,
  Flame,
} from "lucide-react";
import { useGraphEditor } from "@/modules/story/hooks/admin/useGraphEditor";
import GraphCanvas from "./graph/GraphCanvas";
import NodeEditorPanel from "./node/NodeEditorPanel";
import PlayTestPanel from "./PlayTestPanel";

// ─── Config ───────────────────────────────────────────────────────────────────

export const DIFF_CFG: Record<
  string,
  { color: string; dot: string; label: string; Icon: React.ElementType }
> = {
  beginner: {
    color: "text-sky-400",
    dot: "bg-sky-400",
    label: "Beginner",
    Icon: Shield,
  },
  easy: {
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    label: "Easy",
    Icon: Target,
  },
  medium: {
    color: "text-amber-400",
    dot: "bg-amber-400",
    label: "Medium",
    Icon: Swords,
  },
  hard: {
    color: "text-orange-400",
    dot: "bg-orange-400",
    label: "Hard",
    Icon: Flame,
  },
  insane: {
    color: "text-red-400",
    dot: "bg-red-400",
    label: "Insane",
    Icon: Skull,
  },
};

// Chapter list item

function ChapterListItem({
  chapter,
  isActive,
  onSelect,
  onDelete,
}: {
  chapter: StoryChapter;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex items-start gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all",
        isActive
          ? "border-violet-500/40 bg-violet-500/10 ring-1 ring-violet-500/20"
          : "border-slate-800/50 bg-[#0a0e15]/50 hover:border-slate-700/60 hover:bg-[#0a0e15]",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-black ring-1",
          chapter.isPublished
            ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25"
            : "bg-slate-800/60 text-slate-500 ring-slate-700/40",
        )}
      >
        {chapter.isPublished ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          String(chapter.order).padStart(2, "0")
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-mono text-xs font-black truncate",
            isActive ? "text-white" : "text-slate-300",
          )}
        >
          {chapter.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              "font-mono text-[8px] uppercase font-bold",
              chapter.isPublished ? "text-emerald-400" : "text-slate-600",
            )}
          >
            {chapter.isPublished ? "pub" : "draft"}
          </span>
          <span className="font-mono text-[9px] text-slate-600">
            {chapter.nodes?.length ?? 0}n
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-600 hover:text-red-400"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Add chapter inline form ──────────────────────────────────────────────────

function AddChapterInline({
  storyId,
  currentCount,
  onDone,
}: {
  storyId: string;
  currentCount: number;
  onDone: () => void;
}) {
  const { mutate, isPending } = useAdminCreateChapter(storyId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateChapterFormData>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: { order: currentCount + 1, unlockAfterChapters: [] },
  });

  console.log(errors,"errors in add chapter form");

  const close = () => {
    reset();
    setCoverFile(null);
    onDone();
  };
  const onSubmit = (data: CreateChapterFormData) => {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("order", String(data.order));
    if (data.openingNarrative)
      fd.append("openingNarrative", data.openingNarrative);
    if (coverFile) fd.append("coverImage", coverFile);
    mutate(fd, { onSuccess: close });
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400">
          New Chapter
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Input
              {...register("title")}
              placeholder="Chapter title"
              className={cn(
                "h-8 bg-slate-900/60 border-slate-700/60 text-white text-xs placeholder:text-slate-600 focus-visible:ring-0",
                errors.title && "border-red-500/60",
              )}
            />
          </div>
          <Input
            type="number"
            min={1}
            {...register("order", { valueAsNumber: true })}
            className="h-8 bg-slate-900/60 border-slate-700/60 text-white text-xs focus-visible:ring-0"
          />
        </div>

        {/* Cover image */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 font-mono text-[10px] transition-colors",
              coverFile
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                : "border-slate-700/60 text-slate-600 hover:border-slate-600",
            )}
          >
            <Upload className="h-3 w-3" />
            {coverFile ? `✓ ${coverFile.name}` : "Cover image (opt)"}
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={close}
            size="sm"
            className="flex-1 h-8 border-slate-700/60 text-slate-400 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="flex-1 h-8 bg-violet-500 text-white font-black hover:bg-violet-400 text-xs"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </div>
    </motion.form>
  );
}

// ─── Main editor page ─────────────────────────────────────────────────────────

export default function StoryEditorPage({ storyId }: { storyId: string }) {
  const {
    data: story,
    isLoading,
    isFetching,
    refetch,
  } = useAdminStoryDetail(storyId);
  const { mutate: setStatus, isPending: isSettingStatus } =
    useAdminSetStoryStatus(storyId);
  const { mutate: removeChar, isPending: isRemovingChar } =
    useAdminRemoveCharacter(storyId);
  const { mutate: deleteChapter, isPending: isDeletingChap } =
    useAdminDeleteChapter(storyId);

  const {
    activeChapterId,
    setActiveChapter,
    panelMode,
    selectedNodeId,
    closePanel,
    isTraversalActive,
    stopTraversal,
    leftCollapsed,
    toggleLeft,
  } = useGraphStore();

  const [activeTab, setActiveTab] = useState<
    "chapters" | "characters" | "settings"
  >("chapters");
  const [showAddChap, setShowAddChap] = useState(false);
  const [deleteChapId, setDeleteChapId] = useState<string | null>(null);
  const [removeCharId, setRemoveCharId] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<StoryStatus | null>(null);

  const s = story as Story | undefined;
  const chapters = useMemo(
    () => (s?.chapters ?? []).slice().sort((a, b) => a.order - b.order),
    [s?.chapters],
  );

  // Auto-select first chapter
  useEffect(() => {
    if (!activeChapterId && chapters.length > 0) {
      setActiveChapter(chapters[0]._id);
    }
  }, [chapters, activeChapterId, setActiveChapter]);

  const effectiveChapterId = activeChapterId ?? chapters[0]?._id ?? "";

  // Graph editor hook (React Flow state + mutation callbacks)
  const graphEditor = useGraphEditor(storyId, effectiveChapterId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#060a12]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-violet-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          <p className="font-mono text-xs text-slate-600">
            Loading graph editor…
          </p>
        </div>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#060a12]">
        <AlertTriangle className="h-10 w-10 text-red-400/50" />
        <p className="font-mono text-slate-500">Story not found.</p>
        <Link href="/admin/stories">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 gap-1.5 font-mono"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </Link>
      </div>
    );
  }

  const accent = s.accentColor ?? "#8b5cf6";
  const diff = DIFF_CFG[s.difficulty] ?? DIFF_CFG.medium;
  const DiffIcon = diff.Icon;

  const activeChapterObj =
    chapters.find((c) => c._id === effectiveChapterId) ?? null;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden bg-[#060a12]">
        {/* ══ Top bar ══════════════════════════════════════════════════════ */}
        <div
          className="shrink-0 relative overflow-hidden border-b border-slate-800/60"
          style={{
            background: `linear-gradient(to right, ${accent}08, transparent)`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, ${accent}80 0%, ${accent}30 50%, transparent 80%)`,
            }}
          />

          <div className="relative flex items-center gap-3 px-4 py-3">
            <Link
              href="/admin/stories"
              className="flex items-center gap-1 font-mono text-[10px] text-slate-600 hover:text-emerald-400 transition-colors shrink-0"
            >
              <ArrowLeft className="h-3 w-3" />
              Stories
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-700 shrink-0" />

            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                style={{
                  background: `${accent}18`,
                  border: `1px solid ${accent}40`,
                }}
              >
                <BookOpen className="h-4 w-4" style={{ color: accent }} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs">
                  {s.title}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 hidden sm:flex">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase",
                    s.status === "published"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-700/60 bg-slate-800/60 text-slate-500",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      s.status === "published"
                        ? "bg-emerald-400 animate-pulse"
                        : "bg-slate-600",
                    )}
                  />
                  {s.status}
                </span>
                <div className="flex items-center gap-1">
                  <DiffIcon className={cn("h-3 w-3", diff.color)} />
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold",
                      diff.color,
                    )}
                  >
                    {diff.label}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-amber-400/80 flex items-center gap-0.5">
                  <Zap className="h-3 w-3" />
                  {s.completionXpBonus} XP
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-8 w-8 border-slate-700/60 bg-transparent text-slate-500 hover:border-emerald-500/40 hover:text-emerald-400"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                />
              </Button>
              {s.status !== "published" && (
                <Button
                  size="sm"
                  onClick={() => setStatusTarget("published")}
                  disabled={isSettingStatus}
                  className="bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 h-8 gap-1.5 text-xs"
                >
                  {isSettingStatus ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  Publish
                </Button>
              )}
              {s.status === "published" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusTarget("draft")}
                  disabled={isSettingStatus}
                  className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 h-8 gap-1.5 text-xs"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Unpublish
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ══ Body ═════════════════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left sidebar ────────────────────────────────────────────── */}
          <div
            className={cn(
              "shrink-0 flex flex-col border-r border-slate-800/60 bg-[#060a12] transition-all duration-200 overflow-hidden",
              leftCollapsed ? "w-0" : "w-60",
            )}
          >
            {/* Sidebar tab bar */}
            <div className="shrink-0 flex border-b border-slate-800/60 px-1.5 py-1">
              {[
                { id: "chapters", short: "Ch" },
                { id: "characters", short: "Cx" },
                { id: "settings", short: "⚙" },
              ].map(({ id, short }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all",
                    activeTab === id
                      ? "bg-slate-800/80 text-white"
                      : "text-slate-600 hover:text-slate-400",
                  )}
                >
                  {short}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* ── Chapters ── */}
              {activeTab === "chapters" && (
                <div className="p-2.5 space-y-2">
                  <AnimatePresence mode="wait">
                    {showAddChap ? (
                      <AddChapterInline
                        key="form"
                        storyId={storyId}
                        currentCount={chapters.length}
                        onDone={() => setShowAddChap(false)}
                      />
                    ) : (
                      <button
                        key="btn"
                        onClick={() => setShowAddChap(true)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700/60 py-2 font-mono text-[10px] text-slate-600 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/5 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Chapter
                      </button>
                    )}
                  </AnimatePresence>

                  {chapters.length === 0 && !showAddChap && (
                    <div className="py-8 text-center">
                      <BookOpen className="h-7 w-7 text-slate-700 mx-auto mb-2" />
                      <p className="font-mono text-[10px] text-slate-700">
                        No chapters
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {chapters.map((ch) => (
                      <ChapterListItem
                        key={ch._id}
                        chapter={ch}
                        isActive={effectiveChapterId === ch._id}
                        onSelect={() => setActiveChapter(ch._id)}
                        onDelete={() => setDeleteChapId(ch._id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Characters ── */}
              {activeTab === "characters" && (
                <div className="p-2.5 space-y-2">
                  <button className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700/60 py-2 font-mono text-[10px] text-slate-600 hover:border-sky-500/40 hover:text-sky-400 transition-all">
                    <Plus className="h-3.5 w-3.5" />
                    Add Character
                  </button>
                  {(s.characters ?? []).length === 0 && (
                    <div className="py-8 text-center">
                      <Users className="h-7 w-7 text-slate-700 mx-auto mb-2" />
                      <p className="font-mono text-[10px] text-slate-700">
                        No characters
                      </p>
                    </div>
                  )}
                  {(s.characters ?? []).map((char: StoryCharacter) => (
                    <div
                      key={char.id}
                      className="group flex items-center gap-2 rounded-xl border border-slate-800/50 bg-[#0a0e15] p-2.5 hover:border-slate-700/70 transition-all"
                    >
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-slate-800/60 ring-1 ring-slate-700/50">
                        {char.avatar?.url ? (
                          <img
                            src={char.avatar.url}
                            alt={char.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-3 w-3 text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[10px] font-black text-white truncate">
                          {char.name}
                        </p>
                        <p className="font-mono text-[9px] text-slate-600">
                          @{char.id}
                        </p>
                      </div>
                      <button
                        onClick={() => setRemoveCharId(char.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Settings ── */}
              {activeTab === "settings" && (
                <div className="p-2.5 space-y-2">
                  <div className="rounded-xl border border-slate-800/50 bg-[#0a0e15] p-3 space-y-1.5">
                    {[
                      ["Slug", s.slug],
                      ["Status", s.status],
                      ["Difficulty", diff.label],
                      [
                        "Created",
                        formatDistanceToNow(new Date(s.createdAt), {
                          addSuffix: true,
                        }),
                      ],
                      ["Completions", String(s.completionCount)],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between text-[9px] py-1 border-b border-slate-800/40 last:border-0"
                      >
                        <span className="font-mono text-slate-600">{k}</span>
                        <span className="font-mono text-slate-400 truncate max-w-[110px] text-right">
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                  {s.status !== "archived" && (
                    <button
                      onClick={() => setStatusTarget("archived")}
                      className="w-full rounded-xl border border-slate-700/50 px-3 py-2 font-mono text-[10px] text-slate-500 hover:border-slate-600 hover:text-slate-400 text-left transition-colors"
                    >
                      Archive story
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Collapse button */}
            <button
              onClick={toggleLeft}
              className="shrink-0 flex items-center justify-center gap-1.5 border-t border-slate-800/60 py-2.5 font-mono text-[10px] text-slate-700 hover:text-slate-400 hover:bg-slate-800/20 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Collapse
            </button>
          </div>

          {/* Expand tab */}
          {leftCollapsed && (
            <button
              onClick={toggleLeft}
              className="shrink-0 w-6 flex items-center justify-center border-r border-slate-800/60 bg-[#060a12] text-slate-700 hover:text-slate-400 hover:bg-slate-800/20 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {/* ── Graph canvas area ──────────────────────────────────────── */}
          <div
            className="flex-1 overflow-hidden transition-all duration-200"
            style={{ minWidth: 0 }}
          >
            {activeChapterObj ? (
              <GraphCanvas
                storyId={storyId}
                chapterId={effectiveChapterId}
                chapter={activeChapterObj}
                rfNodes={graphEditor.rfNodes}
                rfEdges={graphEditor.rfEdges}
                onNodesChange={graphEditor.onNodesChange}
                onEdgesChange={graphEditor.onEdgesChange}
                onConnect={graphEditor.onConnect}
                onConnectEnd={graphEditor.onConnectEnd}
                handleNodeDragStop={graphEditor.handleNodeDragStop}
                validation={graphEditor.validation}
                setDeleteTargetId={graphEditor.setDeleteTargetId}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                  <Layers className="h-12 w-12 text-slate-700 mx-auto" />
                  <p className="font-mono text-sm text-slate-600">
                    {chapters.length === 0
                      ? "Add a chapter in the left panel to start building"
                      : "Select a chapter to view its graph"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel — node editor or play test ─────────────────── */}
          <AnimatePresence>
            {(panelMode === "create" || panelMode === "edit") && (
              <motion.div
                key="editor"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="shrink-0 h-full overflow-hidden border-l border-slate-800/60"
                style={{ width: 380 }}
              >
                <NodeEditorPanel
                  storyId={storyId}
                  chapterId={effectiveChapterId}
                  node={panelMode === "edit" ? graphEditor.selectedNode : null}
                  allNodes={graphEditor.sortedNodes}
                  nextOrder={graphEditor.sortedNodes.length + 1}
                />
              </motion.div>
            )}

            {(panelMode === "preview" || isTraversalActive) &&
              graphEditor.graph && (
                <motion.div
                  key="preview"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 380, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="shrink-0 h-full overflow-hidden border-l border-slate-800/60"
                  style={{ width: 380 }}
                >
                  <PlayTestPanel graph={graphEditor.graph} />
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══ Dialogs ═════════════════════════════════════════════════════════ */}

      {/* Delete node confirm */}
      <AlertDialog
        open={!!graphEditor.deleteTargetId}
        onOpenChange={(v) => {
          if (!v) graphEditor.setDeleteTargetId("");
        }}
      >
        <AlertDialogContent className="bg-[#0a0e15] border-slate-800 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-white">
              Delete node?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-sm">
              Removes from chapter graph. Update any referencing nodes first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 font-mono">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={graphEditor.isDeleting}
              onClick={graphEditor.confirmDelete}
              className="bg-red-500 text-white hover:bg-red-400 font-mono font-black"
            >
              {graphEditor.isDeleting && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete chapter */}
      <AlertDialog
        open={!!deleteChapId}
        onOpenChange={(v) => {
          if (!v) setDeleteChapId(null);
        }}
      >
        <AlertDialogContent className="bg-[#0a0e15] border-slate-800 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-white">
              Delete chapter?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-sm">
              Removes chapter and all its nodes. Player progress is lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 font-mono">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingChap}
              onClick={() =>
                deleteChapId &&
                deleteChapter(deleteChapId, {
                  onSuccess: () => {
                    setDeleteChapId(null);
                    if (activeChapterId === deleteChapId)
                      setActiveChapter(null);
                  },
                })
              }
              className="bg-red-500 text-white hover:bg-red-400 font-mono font-black"
            >
              {isDeletingChap && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              )}
              Delete Chapter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove character */}
      <AlertDialog
        open={!!removeCharId}
        onOpenChange={(v) => {
          if (!v) setRemoveCharId(null);
        }}
      >
        <AlertDialogContent className="bg-[#0a0e15] border-slate-800 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-white">
              Remove character?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-sm">
              Removes from roster. Node references remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 font-mono">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovingChar}
              onClick={() =>
                removeCharId &&
                removeChar(removeCharId, {
                  onSuccess: () => setRemoveCharId(null),
                })
              }
              className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-mono font-black"
            >
              {isRemovingChar && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Story status */}
      <AlertDialog
        open={!!statusTarget}
        onOpenChange={(v) => {
          if (!v) setStatusTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#0a0e15] border-slate-800 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-white">
              {statusTarget === "published"
                ? "Publish story?"
                : statusTarget === "archived"
                  ? "Archive story?"
                  : "Move to draft?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-sm">
              {statusTarget === "published"
                ? "Makes this story immediately visible to all participants."
                : statusTarget === "archived"
                  ? "Hides from all listings. Player progress preserved."
                  : "Returns to draft. Players can no longer access it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 font-mono">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSettingStatus}
              onClick={() =>
                statusTarget &&
                setStatus(
                  { status: statusTarget },
                  { onSuccess: () => setStatusTarget(null) },
                )
              }
              className={cn(
                "font-mono font-black",
                statusTarget === "published"
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  : statusTarget === "archived"
                    ? "bg-slate-600 text-white hover:bg-slate-500"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400",
              )}
            >
              {isSettingStatus && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
